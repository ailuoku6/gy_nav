# Protocols and Contracts

## API Contracts

- `POST /api/passkey/register/options`：需要 JWT；服务端为当前用户生成注册 options 和 challenge。
- `POST /api/passkey/register/verify`：需要 JWT；前端提交 `PublicKeyCredential` JSON；服务端验证后保存凭证。
- `POST /api/passkey/login/options`：免 JWT；可接受 `userName`，也可为空以支持 discoverable credentials；返回认证 options 和 challenge。
- `POST /api/passkey/login/verify`：免 JWT；前端提交 assertion JSON；服务端验证签名后返回 `{ result, user, msg, token }`，结构尽量对齐 `/api/login`。
- `GET /api/passkey/credentials`：需要 JWT；返回当前用户已绑定凭证列表。
- `POST /api/passkey/credentials/delete`：需要 JWT；删除当前用户指定凭证。

## Data Models

- `passkey_credentials` 建议字段：`id`, `userId`, `credentialId`, `publicKey`, `counter`, `transports`, `deviceType`, `backedUp`, `name`, `createdAt`, `lastUsedAt`。
- `passkey_challenges` 建议字段：`id`, `userId`, `challenge`, `type`, `expiresAt`, `createdAt`；登录时 `userId` 可为空。
- 可选为 `users` 增加 `passkeyUserId`，作为 WebAuthn user handle，避免直接暴露递增用户 ID。

## Storage and Config

- 环境变量建议：`PASSKEY_RP_ID`、`PASSKEY_RP_NAME`、`PASSKEY_ORIGIN`。
- 注册 options 推荐：`attestationType: 'none'`，`residentKey: 'required'`，`userVerification: 'required'`。
- 登录 options 推荐：`userVerification: 'required'`；无用户名登录时不传 `allowCredentials`。

## Compatibility Notes

- 新增接口需要加入 `authFreeSet`：`/api/passkey/login/options`、`/api/passkey/login/verify`。
- 绑定/管理类接口继续走现有 JWT 中间件。
- 现有用户名密码登录、注册和 JWT 存储逻辑保持可用，作为回退和账号恢复方式。
