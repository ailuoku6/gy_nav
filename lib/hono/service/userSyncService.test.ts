import { describe, expect, it, vi } from 'vitest';
import { broadcastUserDataUpdate } from './userSyncService';
import type { Ctx } from '../types';

describe('account update notifications', () => {
  it('routes to the authenticated account and includes the writer identity', async () => {
    const broadcast = vi.fn();
    const getByName = vi.fn(() => ({ broadcast }));
    const ctx = {
      get: () => ({ user: { id: 42 } }),
      req: { header: () => 'device-a' },
      env: { USER_SYNC: { getByName } },
    } as unknown as Ctx;
    await broadcastUserDataUpdate(ctx, 'partData');
    expect(getByName).toHaveBeenCalledWith('42');
    expect(broadcast).toHaveBeenCalledWith({
      type: 'data-updated', sourceDeviceId: 'device-a', changed: 'partData',
    });
  });

  it('does not fail a completed database write when notification fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ctx = {
      get: () => ({ user: { id: 42 } }),
      req: { header: () => undefined },
      env: { USER_SYNC: { getByName: () => { throw new Error('unavailable'); } } },
    } as unknown as Ctx;
    await expect(broadcastUserDataUpdate(ctx, 'popularSites')).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
