import { HTTPException } from 'hono/http-exception';
import { Ctx } from '../types';

const HASH = /^[a-f0-9]{64}$/;
type Room = {
  id: string;
  sender_user_id: number;
  sender_token_hash: string;
  receiver_verifier: string;
  receiver_token_hash: string | null;
  status: string;
  expires_at_ms: number;
  max_expires_at_ms: number;
};
type Body = Record<string, unknown>;
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    ),
    (b) => b.toString(16).padStart(2, '0')
  ).join('');
const fail = (
  status: 400 | 401 | 404 | 409 | 413 | 429,
  message: string
): never => {
  throw new HTTPException(status, { message });
};

export async function boundedJson(ctx: Ctx): Promise<Body> {
  if (!ctx.req.header('Content-Type')?.startsWith('application/json'))
    fail(400, '需要 JSON 请求');
  const reader = ctx.req.raw.body?.getReader();
  if (!reader) return fail(400, '请求为空');
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    let reading = true;
    while (reading) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        fail(413, '信令请求过大');
      }
      parts.push(next.value);
      reading = !next.done;
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    return value as Body;
  } catch {
    return fail(400, 'JSON 格式无效');
  }
}
function field(body: Body, name: string) {
  const value = body[name];
  if (typeof value !== 'string' || !HASH.test(value))
    return fail(400, '配对请求无效');
  return value;
}

interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}
export function normalizeIceServers(value: unknown): IceServerConfig[] {
  const servers = Array.isArray(value) ? value : [value];
  if (!servers.length || servers.length > 16)
    throw new HTTPException(503, { message: '中继配置无效' });
  return servers.map((server) => {
    if (!server || typeof server !== 'object')
      throw new HTTPException(503, { message: '中继配置无效' });
    const input = server as Record<string, unknown>;
    const urls = Array.isArray(input.urls) ? input.urls : [input.urls];
    if (
      !urls.length ||
      urls.length > 16 ||
      urls.some(
        (url) => typeof url !== 'string' || !/^(stun|turn|turns):/.test(url)
      )
    )
      throw new HTTPException(503, { message: '中继配置无效' });
    const allowed = (urls as string[]).filter(
      (url) => !/:53(?:[/?]|$)/.test(url)
    );
    if (
      !allowed.length ||
      (input.username !== undefined && typeof input.username !== 'string') ||
      (input.credential !== undefined && typeof input.credential !== 'string')
    )
      throw new HTTPException(503, { message: '中继配置无效' });
    return {
      urls: allowed,
      username: input.username as string | undefined,
      credential: input.credential as string | undefined,
    };
  });
}

export default class RtcService {
  static async limit(ctx: Ctx, scope: string, limit: number) {
    const now = Date.now();
    const key = await hash(
      `${scope}:${ctx.req.header('CF-Connecting-IP') || 'local'}:${Math.floor(now / 60000)}`
    );
    const row = await ctx.env.DB.prepare(
      'INSERT INTO rtc_limits_v1 (key,count,expires_at_ms) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count'
    )
      .bind(key, now + 120000)
      .first<{ count: number }>();
    if (!row || row.count > limit) {
      ctx.header('Retry-After', '60');
      fail(429, '请求过于频繁，请稍后重试');
    }
  }
  static async cleanup(ctx: Ctx) {
    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        "DELETE FROM rtc_signals_v1 WHERE room_id IN (SELECT id FROM rtc_rooms_v1 WHERE expires_at_ms <= ? OR status='closed' LIMIT 100)"
      ).bind(Date.now()),
      ctx.env.DB.prepare(
        "DELETE FROM rtc_rooms_v1 WHERE id IN (SELECT id FROM rtc_rooms_v1 WHERE expires_at_ms <= ? OR status='closed' LIMIT 100)"
      ).bind(Date.now()),
      ctx.env.DB.prepare(
        'DELETE FROM rtc_limits_v1 WHERE key IN (SELECT key FROM rtc_limits_v1 WHERE expires_at_ms <= ? LIMIT 100)'
      ).bind(Date.now()),
      ctx.env.DB.prepare(
        'DELETE FROM rtc_join_limits_v1 WHERE room_id IN (SELECT room_id FROM rtc_join_limits_v1 WHERE expires_at_ms <= ? LIMIT 100)'
      ).bind(Date.now()),
    ]);
  }
  static async create(ctx: Ctx) {
    const payload = ctx.get('jwtPayload') as { user?: { id?: number } };
    const user = payload?.user?.id;
    if (!Number.isSafeInteger(user) || !user) fail(401, '请先登录再发送文件');
    await this.limit(ctx, 'create', 10);
    await this.cleanup(ctx);
    const body = await boundedJson(ctx);
    const id = field(body, 'roomId');
    const tokenHash = field(body, 'tokenHash');
    const verifier = field(body, 'verifier');
    const now = Date.now();
    await ctx.env.DB.prepare(
      `INSERT INTO rtc_rooms_v1 (id,sender_user_id,sender_token_hash,receiver_verifier,expires_at_ms,max_expires_at_ms,created_at_ms)
      SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM rtc_rooms_v1 WHERE sender_user_id=? AND status!='closed' AND expires_at_ms>?) < 3
      ON CONFLICT(id) DO NOTHING`
    )
      .bind(
        id,
        user,
        tokenHash,
        verifier,
        now + 600000,
        now + 7200000,
        now,
        user,
        now
      )
      .run();
    const room = await ctx.env.DB.prepare(
      'SELECT * FROM rtc_rooms_v1 WHERE id=?'
    )
      .bind(id)
      .first<Room>();
    if (
      !room ||
      room.sender_user_id !== user ||
      room.sender_token_hash !== tokenHash ||
      room.receiver_verifier !== verifier ||
      room.expires_at_ms <= now ||
      room.status === 'closed'
    )
      return fail(409, '最多同时发送 3 个文件，请关闭旧会话后重试');
    return ctx.json({ result: true, data: { expiresAt: room.expires_at_ms } });
  }
  static async join(ctx: Ctx) {
    await this.limit(ctx, 'join', 5);
    const body = await boundedJson(ctx);
    const id = field(body, 'roomId');
    const tokenHash = field(body, 'tokenHash');
    const now = Date.now();
    const activeRoom = await ctx.env.DB.prepare(
      "SELECT id FROM rtc_rooms_v1 WHERE id=? AND expires_at_ms>? AND status!='closed'"
    )
      .bind(id, now)
      .first<{ id: string }>();
    if (!activeRoom) return fail(404, '配对码无效或已过期');
    const roomAttempts = await ctx.env.DB.prepare(
      `INSERT INTO rtc_join_limits_v1 (room_id,count,expires_at_ms) VALUES (?,1,?) ON CONFLICT(room_id) DO UPDATE SET count=CASE WHEN expires_at_ms<=? THEN 1 ELSE count+1 END, expires_at_ms=CASE WHEN expires_at_ms<=? THEN ? ELSE expires_at_ms END RETURNING count`
    )
      .bind(id, now + 60000, now, now, now + 60000)
      .first<{ count: number }>();
    if (!roomAttempts || roomAttempts.count > 10)
      return fail(429, '此配对码尝试次数过多，请发送方重新生成配对码');
    const row = await ctx.env.DB.prepare(
      `UPDATE rtc_rooms_v1 SET receiver_token_hash=?, status='paired', expires_at_ms=MIN(max_expires_at_ms,?)
      WHERE id=? AND expires_at_ms>? AND status!='closed' AND (receiver_token_hash IS NULL OR receiver_token_hash=?) RETURNING expires_at_ms`
    )
      .bind(tokenHash, now + 600000, id, now, tokenHash)
      .first<{ expires_at_ms: number }>();
    if (!row) return fail(404, '配对码无效、已被领取或已过期');
    return ctx.json({ result: true, data: { expiresAt: row.expires_at_ms } });
  }
  static async auth(ctx: Ctx) {
    const id = ctx.req.param('roomId');
    const token =
      ctx.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!HASH.test(id) || !HASH.test(token))
      return fail(401, '房间访问凭据无效');
    const tokenHash = await hash(token);
    const room = await ctx.env.DB.prepare(
      "SELECT * FROM rtc_rooms_v1 WHERE id=? AND expires_at_ms>? AND status!='closed' AND (sender_token_hash=? OR receiver_token_hash=?)"
    )
      .bind(id, Date.now(), tokenHash, tokenHash)
      .first<Room>();
    if (!room) return fail(404, '配对房间无效或已过期');
    return {
      room,
      role: room.sender_token_hash === tokenHash ? 'sender' : 'receiver',
    };
  }
  static async events(ctx: Ctx) {
    const { room, role } = await this.auth(ctx);
    if (ctx.req.method === 'GET') {
      const after = Number(ctx.req.query('after') || 0);
      if (!Number.isSafeInteger(after) || after < 0) fail(400, '游标无效');
      const rows = await ctx.env.DB.prepare(
        'SELECT seq,role,payload FROM rtc_signals_v1 WHERE room_id=? AND seq>? ORDER BY seq LIMIT 32'
      )
        .bind(room.id, after)
        .all();
      return ctx.json({ result: true, data: { events: rows.results } });
    }
    await this.limit(ctx, 'publish', 180);
    const body = await boundedJson(ctx);
    const signal = body.signal as Body | undefined;
    const candidate =
      signal?.candidate && typeof signal.candidate === 'object'
        ? (signal.candidate as Body)
        : undefined;
    if (
      !signal ||
      signal.version !== 2 ||
      signal.roomId !== room.id ||
      signal.role !== role ||
      (signal.type === 'offer' && role !== 'sender') ||
      (signal.type === 'answer' && role !== 'receiver') ||
      !['offer', 'answer', 'candidate'].includes(String(signal.type)) ||
      typeof signal.generation !== 'number' ||
      !Number.isSafeInteger(signal.generation) ||
      signal.generation < 1 ||
      signal.generation > 8 ||
      typeof signal.nonce !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(signal.nonce) ||
      typeof signal.sdp !== 'string' ||
      signal.sdp.length > 48000 ||
      (signal.type === 'candidate' &&
        (!candidate ||
          typeof candidate.candidate !== 'string' ||
          candidate.candidate.length > 4096 ||
          (candidate.sdpMid != null &&
            (typeof candidate.sdpMid !== 'string' ||
              candidate.sdpMid.length > 256)) ||
          (candidate.sdpMLineIndex != null &&
            (!Number.isSafeInteger(candidate.sdpMLineIndex) ||
              Number(candidate.sdpMLineIndex) < 0)))) ||
      (signal.type === 'candidate' && signal.sdp !== '') ||
      (signal.type !== 'candidate' && !signal.sdp)
    )
      fail(400, '信令事件无效');
    const payload = JSON.stringify(signal);
    const eventId = `${signal.generation}:${signal.nonce}`;
    await ctx.env.DB.prepare(
      `INSERT INTO rtc_signals_v1 (room_id,event_id,role,payload) SELECT ?,?,?,?
      WHERE EXISTS (SELECT 1 FROM rtc_rooms_v1 WHERE id=? AND expires_at_ms>? AND status!='closed')
      ON CONFLICT(room_id,role,event_id) DO NOTHING`
    )
      .bind(room.id, eventId, role, payload, room.id, Date.now())
      .run();
    const saved = await ctx.env.DB.prepare(
      'SELECT seq,payload FROM rtc_signals_v1 WHERE room_id=? AND role=? AND event_id=?'
    )
      .bind(room.id, role, eventId)
      .first<{ seq: number; payload: string }>();
    if (!saved || saved.payload !== payload)
      fail(409, '信令代际冲突，请重新配对');
    return ctx.json({ result: true, data: { seq: saved.seq } });
  }
  static async heartbeat(ctx: Ctx) {
    const { room } = await this.auth(ctx);
    if (room.status === 'paired')
      await ctx.env.DB.prepare(
        "UPDATE rtc_rooms_v1 SET expires_at_ms=MIN(max_expires_at_ms,?) WHERE id=? AND status='paired' AND expires_at_ms>?"
      )
        .bind(Date.now() + 600000, room.id, Date.now())
        .run();
    return ctx.json({ result: true });
  }
  static async close(ctx: Ctx) {
    const { room } = await this.auth(ctx);
    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        "UPDATE rtc_rooms_v1 SET status='closed' WHERE id=?"
      ).bind(room.id),
      ctx.env.DB.prepare('DELETE FROM rtc_signals_v1 WHERE room_id=?').bind(
        room.id
      ),
    ]);
    return ctx.json({ result: true });
  }
  static async ice(ctx: Ctx) {
    await this.auth(ctx);
    await this.limit(ctx, 'ice', 10);
    if (ctx.env.RTC_TURN_KEY_ID && ctx.env.RTC_TURN_KEY_SECRET) {
      const response = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(ctx.env.RTC_TURN_KEY_ID)}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ctx.env.RTC_TURN_KEY_SECRET}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ttl: 7200 }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!response.ok)
        throw new HTTPException(503, { message: '中继服务暂时不可用' });
      const data = (await response.json()) as { iceServers: unknown };
      return ctx.json({
        result: true,
        data: { iceServers: normalizeIceServers(data.iceServers) },
      });
    }
    return ctx.json({
      result: true,
      data: {
        iceServers: [
          {
            urls: [
              'stun:stun.cloudflare.com:3478',
              'stun:stun.l.google.com:19302',
            ],
          },
        ],
      },
    });
  }
}
