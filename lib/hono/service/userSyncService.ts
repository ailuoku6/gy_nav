import type { UserSyncMessage } from '../../userSync';
import { Ctx } from '../types';

export const broadcastUserDataUpdate = async (
  ctx: Ctx,
  changed: UserSyncMessage['changed']
) => {
  try {
    const payload = ctx.get('jwtPayload') as { user?: { id?: number } };
    const userId = payload.user?.id;
    if (!userId) return;

    const sourceDeviceId = ctx.req.header('X-Device-Id') || 'http-request';
    const sync = ctx.env.USER_SYNC.getByName(String(userId));
    await sync.broadcast({
      type: 'data-updated',
      sourceDeviceId,
      changed,
    });
  } catch (error) {
    // A transient sync outage must not turn a successful D1 write into a 500.
    console.error('广播账号数据更新失败', error);
  }
};
