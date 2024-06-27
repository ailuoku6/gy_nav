import { Ctx } from '../types';

import scheduled from '../clipboard-cleaner';

const scheduledDeleteClip = (scheduled as any).scheduled;

import { encryptData, decryptData } from '../utils/encrypt';

export default class ClipboardService {
  public static writeClipBoard = async (
    ctx: Ctx,
    { clipboardString }: { clipboardString: string }
  ) => {
    try {
      const payloadJson = ctx.get('jwtPayload');
      // const payloadJson = JSON.parse(payload);
      const db = ctx.env.DB;

      const dataSecretKey = ctx.env.DataSecretKey;

      await scheduledDeleteClip(null, ctx.env, ctx);

      // 计算剪切板内容的过期时间 (当前时间加上 5 分钟)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const result = await db
        .prepare(
          'INSERT INTO clipboard (user_id, content, expires_at) VALUES (?, ?, ?)'
        )
        .bind(
          payloadJson.user.id,
          JSON.stringify(
            await encryptData(
              clipboardString,
              `${dataSecretKey}-${payloadJson.user.id}`
            )
          ),
          expiresAt
        )
        .run();

      if (result.success) {
        return ctx.json({
          result: true,
          msg: 'Clipboard content write successfully',
        });
      } else {
        return ctx.json({
          result: false,
          msg: 'Failed to write clipboard content',
        });
      }
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };
  public static getClipBoard = async (ctx: Ctx) => {
    try {
      const dataSecretKey = ctx.env.DataSecretKey;
      const payloadJson = ctx.get('jwtPayload');
      // const payloadJson = JSON.parse(payload);
      const db = ctx.env.DB;

      const now = new Date().toISOString();
      const content = await db
        .prepare(
          'SELECT content FROM clipboard WHERE user_id = ? AND expires_at > ? ORDER BY updated_at DESC LIMIT 1'
        )
        .bind(payloadJson.user.id, now)
        .first();

      if (!content) {
        return ctx.json({
          result: false,
          data: '',
          msg: 'No valid clipboard content found',
        });
      }

      const [data] = await Promise.all([
        decryptData(
          JSON.parse(content.content as string),
          `${dataSecretKey}-${payloadJson.user.id}`
        ),
        scheduledDeleteClip(null, ctx.env, ctx),
      ]);

      return ctx.json({ result: true, data, msg: 'success' });
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };
}
