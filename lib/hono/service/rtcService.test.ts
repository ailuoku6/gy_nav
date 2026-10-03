import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');
import { readFileSync } from 'node:fs';
import { sign } from 'hono/jwt';
import app from '../index';
import { normalizeIceServers } from './rtcService';
import { Bindings } from '../types';
import {
  generatePairingCode,
  randomToken,
  roomIdForCode,
  sha256,
} from '../../../src/utils/rtcCrypto';

// Exercise actual SQLite statements and the Hono middleware/API contract.
class LocalD1 {
  sqlite = new DatabaseSync(':memory:');
  constructor() {
    this.sqlite.exec(
      readFileSync(new URL('../SQL/rtc.sql', import.meta.url), 'utf8')
    );
  }
  prepare(sql: string) {
    const statement = this.sqlite.prepare(sql);
    const bound = (...values: (string | number | null)[]) => ({
      bind: (...next: (string | number | null)[]) => bound(...next),
      first: async () => statement.get(...values) || null,
      all: async () => ({ results: statement.all(...values) }),
      run: async () => ({ success: true, meta: statement.run(...values) }),
    });
    return bound();
  }
  async batch(statements: { run(): Promise<unknown> }[]) {
    this.sqlite.exec('BEGIN');
    try {
      const results = await Promise.all(
        statements.map((statement) => statement.run())
      );
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
}
let db: LocalD1;
let env: Bindings;
let jwt: string;
let code: string;
let roomId: string;
let sender: string;
let receiver: string;

async function request(
  path: string,
  token: string,
  body?: unknown,
  ip = '127.0.0.1'
) {
  const response = await app.request(
    `/api/rtc/${path}`,
    {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'CF-Connecting-IP': ip,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    env
  );
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  return { status: response.status, value: await response.json() };
}
async function create() {
  return request('rooms', jwt, {
    roomId,
    tokenHash: await sha256(sender),
    verifier: await sha256(receiver),
  });
}
async function join(token = receiver) {
  return request('rooms/join', token, {
    roomId,
    tokenHash: await sha256(token),
  });
}

beforeEach(async () => {
  db = new LocalD1();
  env = {
    DB: db as unknown as D1Database,
    TokenSecret: 'local-test-secret',
    PasswordSecret: '',
    DataSecretKey: '',
  };
  jwt = await sign(
    { user: { id: 7 }, exp: Math.floor(Date.now() / 1000) + 3600 },
    env.TokenSecret
  );
  code = generatePairingCode();
  roomId = await roomIdForCode(code);
  sender = randomToken();
  receiver = randomToken();
});
afterEach(() => db.sqlite.close());

describe('RTC signaling API', () => {
  it('requires application login to create a room and returns JSON errors', async () => {
    const result = await request('rooms', 'invalid', {});
    expect(result.status).toBe(401);
    expect(result.value.result).toBe(false);
  });
  it('retries creation and join with the same capabilities without exposing tokens', async () => {
    expect((await create()).status).toBe(200);
    expect((await create()).status).toBe(200);
    expect((await join()).status).toBe(200);
    expect((await join()).status).toBe(200);
    expect((await join(randomToken())).status).toBe(404);
    const row = db.sqlite.prepare('SELECT * FROM rtc_rooms_v1').get()!;
    expect(row.sender_token_hash).toBe(await sha256(sender));
    expect(row.receiver_token_hash).toBe(await sha256(receiver));
    expect(row.receiver_verifier).not.toBe(await sha256(code));
  });
  it('allows only the paired receiver capability to claim a room', async () => {
    await create();
    expect((await join()).status).toBe(200);
    expect((await join(randomToken())).status).toBe(404);
  });
  it('enforces room authentication and publishing roles', async () => {
    await create();
    await join();
    const signal = {
      version: 2,
      roomId,
      generation: 1,
      nonce: crypto.randomUUID(),
      role: 'sender',
      type: 'offer',
      sdp: 'sample-sdp',
    };
    expect(
      (await request(`rooms/${roomId}/events`, receiver, { signal })).status
    ).toBe(400);
    expect(
      (await request(`rooms/${roomId}/events`, randomToken())).status
    ).toBe(404);
    expect(
      (await request(`rooms/${roomId}/events`, sender, { signal })).status
    ).toBe(200);
    expect(
      (await request(`rooms/${roomId}/events`, sender, { signal })).status
    ).toBe(200);
    expect(
      (
        await request(`rooms/${roomId}/events`, sender, {
          signal: { ...signal, sdp: 'different' },
        })
      ).status
    ).toBe(409);
    const events = (await request(`rooms/${roomId}/events?after=0`, receiver))
      .value.data.events;
    expect(events).toHaveLength(1);
    expect(JSON.parse(events[0].payload)).toEqual(signal);
    expect(
      (await request(`rooms/${roomId}/events?after=${events[0].seq}`, receiver))
        .value.data.events
    ).toEqual([]);
    expect(
      (await request(`rooms/${roomId}/events?after=-1`, receiver)).status
    ).toBe(400);
  });
  it('bounds request bodies before parsing and rejects cross-site requests', async () => {
    await create();
    expect(
      (
        await request(`rooms/${roomId}/events`, sender, {
          padding: 'a'.repeat(65536),
        })
      ).status
    ).toBe(413);
    const response = await app.request(
      '/api/rtc/rooms',
      { method: 'POST', headers: { Origin: 'https://evil.invalid' } },
      env
    );
    expect(response.status).toBe(403);
  });
  it('expires rooms and caps lease renewal at the hard expiry', async () => {
    await create();
    await join();
    db.sqlite
      .prepare('UPDATE rtc_rooms_v1 SET max_expires_at_ms=?')
      .run(Date.now() + 5000);
    expect(
      (await request(`rooms/${roomId}/heartbeat`, sender, {})).status
    ).toBe(200);
    const row = db.sqlite
      .prepare('SELECT expires_at_ms,max_expires_at_ms FROM rtc_rooms_v1')
      .get()!;
    expect(row.expires_at_ms).toBe(row.max_expires_at_ms);
    db.sqlite.prepare('UPDATE rtc_rooms_v1 SET expires_at_ms=0').run();
    expect((await request(`rooms/${roomId}/events`, receiver)).status).toBe(
      404
    );
  });
  it('limits online pairing guesses for one active code across client IPs', async () => {
    await create();
    for (let index = 0; index < 10; index++) {
      const token = randomToken();
      const result = await request(
        'rooms/join',
        token,
        {
          roomId,
          tokenHash: await sha256(token),
        },
        `192.0.2.${index}`
      );
      expect(result.status).toBe(index === 0 ? 200 : 404);
    }
    const token = randomToken();
    const denied = await request('rooms/join', token, {
      roomId,
      tokenHash: await sha256(token),
    });
    expect(denied.status).toBe(429);
  });
  it('closes a room, removes signaling and rejects new access', async () => {
    await create();
    await join();
    const signal = {
      version: 2,
      roomId,
      generation: 1,
      nonce: crypto.randomUUID(),
      role: 'sender',
      type: 'offer',
      sdp: 'sample-sdp',
    };
    await request(`rooms/${roomId}/events`, sender, { signal });
    expect((await request(`rooms/${roomId}/close`, receiver, {})).status).toBe(
      200
    );
    expect(
      db.sqlite.prepare('SELECT COUNT(*) AS n FROM rtc_signals_v1').get()?.n
    ).toBe(0);
    expect((await request(`rooms/${roomId}/events`, sender)).status).toBe(404);
  });
});

describe('TURN config normalization', () => {
  it('accepts provider object and array shapes and removes blocked port 53', () => {
    const server = {
      urls: [
        'turn:turn.cloudflare.com:53?transport=udp',
        'turns:turn.cloudflare.com:5349?transport=tcp',
        'turns:turn.cloudflare.com:443?transport=tcp',
      ],
      username: 'temporary',
      credential: 'temporary-secret',
    };
    expect(normalizeIceServers(server)).toEqual(normalizeIceServers([server]));
    expect(normalizeIceServers(server)[0].urls).toHaveLength(2);
    expect(
      normalizeIceServers({ urls: 'stun:stun.cloudflare.com:3478' })[0].urls
    ).toEqual(['stun:stun.cloudflare.com:3478']);
  });
  it('rejects malformed provider responses', () => {
    for (const config of [
      null,
      [],
      {},
      { urls: 'https://invalid' },
      { urls: 'turn:host:53' },
      { urls: 'turn:host:3478', credential: 5 },
    ])
      expect(() => normalizeIceServers(config)).toThrow();
  });
});
