export const PASSKEY_DELETE_CONFIRM_TEXT =
  '确认删除这个 Passkey 吗？删除后需要重新绑定才能再次使用。';

export const confirmDeletePasskey = (
  confirmFn: (message: string) => boolean = window.confirm
) => confirmFn(PASSKEY_DELETE_CONFIRM_TEXT);
