import { describe, expect, it, vi } from 'vitest';

import { confirmDeletePasskey } from './passkeyConfirm';

describe('confirmDeletePasskey', () => {
  it('returns false when the user cancels passkey deletion', () => {
    const confirmFn = vi.fn(() => false);

    expect(confirmDeletePasskey(confirmFn)).toBe(false);
    expect(confirmFn).toHaveBeenCalledWith(
      '确认删除这个 Passkey 吗？删除后需要重新绑定才能再次使用。'
    );
  });

  it('returns true when the user confirms passkey deletion', () => {
    const confirmFn = vi.fn(() => true);

    expect(confirmDeletePasskey(confirmFn)).toBe(true);
  });
});
