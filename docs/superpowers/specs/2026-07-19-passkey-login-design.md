# Passkey 登录设计

- 日期：2026-07-19
- 状态：已选择方案 A，等待用户审阅
- 范围：当前 Web 站点接入通用 Passkey 登录
- 项目：GY_nav_react

## 背景

当前项目已经有用户名密码登录、注册、JWT 会话、React 登录页、Hono API 和 Cloudflare D1 用户表。用户希望在当前 Web 站点中接入 iPhone、Mac、Safari、Chrome 可用的通用 Passkey 登录。

本设计采用 WebAuthn 标准 Passkey 方案。Apple 设备上的 Face ID、Touch ID、iCloud Keychain 体验由浏览器和系统提供，服务端只需要按 WebAuthn 标准生成 challenge、验证注册响应和登录 assertion。该方案不是 Sign in with Apple OAuth，也不依赖 Apple 私有登录协议。

## 目标

- 用户已登录后，可以给当前账号绑定一个 Passkey。
- 用户绑定 Passkey 后，可以在登录页使用 Passkey 完成登录。
- Passkey 登录成功后，后端继续签发现有 JWT，前端复用当前登录成功后的用户数据、分区数据、常用站点数据和首页跳转逻辑。
- 保留用户名密码登录作为降级方式和账号恢复方式。
- 支持 Safari、Chrome、iPhone、Mac 等实现 WebAuthn/Passkey 的环境。

## 非目标

- 首期不做 Sign in with Apple OAuth。
- 首期不做 Passkey-only 新用户注册。
- 首期不改造 `users.passWord NOT NULL` 约束。
- 首期不做原生 iOS App 的 Associated Domains、AASA、AuthenticationServices 集成。
- 首期不强制只允许 Apple 设备或平台认证器；支持外部安全钥匙和其他浏览器 Passkey Provider。

## 推荐方案

采用方案 A：现有账号绑定 Passkey，再使用 Passkey 登录。

用户首次使用 Passkey 前，先用已有用户名密码登录。登录后点击“绑定 Passkey”，浏览器调用 WebAuthn 注册流程，服务端保存 credential ID、公钥、counter、transports、备份状态等凭证信息。之后用户可以在登录页点击“使用 Passkey 登录”，浏览器调用 WebAuthn 认证流程，服务端用已保存的公钥验签。验签成功后，后端返回与 `/api/login` 对齐的响应结构和 JWT。

选择该方案的原因：

- 对当前用户体系侵入最小。
- 不需要立即改造密码注册和账号恢复。
- 可以复用现有 JWT 中间件、token 存储和前端数据加载路径。
- 密码登录保留为 Passkey 绑定失败、设备丢失、浏览器不支持时的回退方案。

## 用户体验

登录页在用户名密码表单下方增加“使用 Passkey 登录”按钮。浏览器支持 WebAuthn 时按钮可用；不支持时按钮禁用或点击后提示“当前浏览器不支持 Passkey，请使用用户名密码登录”。

已登录状态下增加“绑定 Passkey”入口。绑定成功后显示成功提示，并在凭证列表中展示已绑定 Passkey。凭证列表显示名称、创建时间、最近使用时间，并支持删除。首期可以用默认名称，例如“我的 Passkey”，后续再支持用户重命名。

用户取消 Face ID、Touch ID、系统 PIN 或安全钥匙操作时，前端不视为系统错误，而是提示“已取消 Passkey 验证”。用户可以继续使用密码登录。

## 前端设计

新增依赖：

- `@simplewebauthn/browser`

新增或调整模块：

- `src/utils/http.ts`：新增 `postJson(url, data)`，用于发送 WebAuthn JSON 数据。
- `src/utils/Api.ts`：新增 Passkey API 常量。
- `src/pages/Login.tsx`：新增 Passkey 登录按钮、绑定入口和凭证列表入口。
- 可选新增 `src/utils/passkey.ts`：封装 `startRegistration`、`startAuthentication` 和错误文案映射。

Passkey 登录流程：

1. 用户点击“使用 Passkey 登录”。
2. 前端调用 `POST /api/passkey/login/options`。
3. 前端将返回的 options 交给 `startAuthentication(options)`。
4. 浏览器弹出系统 Passkey 验证。
5. 前端将 assertion JSON 提交给 `POST /api/passkey/login/verify`。
6. 服务端返回 `{ result, user, msg, token }`。
7. 前端沿用现有登录成功处理逻辑：解析 `partData`、`popularSites`，写入 `appStore`，跳转首页。

Passkey 绑定流程：

1. 用户已登录，点击“绑定 Passkey”。
2. 前端调用 `POST /api/passkey/register/options`。
3. 前端将返回的 options 交给 `startRegistration(options)`。
4. 浏览器创建 Passkey。
5. 前端将 credential JSON 提交给 `POST /api/passkey/register/verify`。
6. 服务端验证通过后保存凭证。
7. 前端提示绑定成功并刷新凭证列表。

## 后端设计

新增 `PasskeyService`，建议位置：

- `lib/hono/service/passkeyService.ts`

后端职责：

- 读取 Passkey 配置：RP ID、RP Name、Origin。
- 为注册和登录生成 challenge。
- 将 challenge 保存到 D1，并设置短有效期。
- 验证注册 credential。
- 保存 credential ID、公钥、counter、transports、device type、backedUp。
- 验证登录 assertion 的 challenge、origin、RP ID、user verification 和签名。
- 登录成功后查询用户数据、签发 JWT，并返回与现有登录接口一致的数据结构。
- 登录成功后更新凭证 counter 和 `lastUsedAt`。

新增免登录 API：

```text
POST /api/passkey/login/options
POST /api/passkey/login/verify
```

这两个接口需要加入 `authFreeSet`。

新增需要 JWT 的 API：

```text
POST /api/passkey/register/options
POST /api/passkey/register/verify
GET  /api/passkey/credentials
POST /api/passkey/credentials/delete
```

这些接口继续走现有 JWT 中间件。

## API 契约

### `POST /api/passkey/register/options`

认证：需要 JWT。

请求：

```json
{}
```

响应：

```json
{
  "result": true,
  "options": {
    "rp": {
      "name": "GY Nav",
      "id": "example.com"
    },
    "user": {
      "id": "base64url-user-handle",
      "name": "userName",
      "displayName": "userName"
    },
    "challenge": "base64url-challenge"
  }
}
```

实现说明：实际 `options` 字段以 WebAuthn registration options 为准，包含算法、resident key、user verification、exclude credentials 等字段。

### `POST /api/passkey/register/verify`

认证：需要 JWT。

请求：

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "credential-raw-id",
    "response": {},
    "type": "public-key",
    "clientExtensionResults": {}
  },
  "name": "我的 Passkey"
}
```

响应：

```json
{
  "result": true,
  "msg": "Passkey binding successful"
}
```

失败时：

```json
{
  "result": false,
  "msg": "Passkey verification failed"
}
```

### `POST /api/passkey/login/options`

认证：免 JWT。

请求：

```json
{
  "userName": ""
}
```

`userName` 可以为空。为空时不传 `allowCredentials`，允许 discoverable credentials；有值时可以限制该用户已绑定的 credentials。

响应：

```json
{
  "result": true,
  "options": {
    "challenge": "base64url-challenge",
    "rpId": "example.com",
    "userVerification": "required"
  }
}
```

### `POST /api/passkey/login/verify`

认证：免 JWT。

请求：

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "credential-raw-id",
    "response": {},
    "type": "public-key",
    "clientExtensionResults": {}
  }
}
```

成功响应对齐 `/api/login`：

```json
{
  "result": true,
  "user": {
    "id": 1,
    "userName": "userName",
    "partData": "[]",
    "popularSites": "[]"
  },
  "msg": "Login successful",
  "token": "jwt"
}
```

### `GET /api/passkey/credentials`

认证：需要 JWT。

响应：

```json
{
  "result": true,
  "credentials": [
    {
      "id": 1,
      "name": "我的 Passkey",
      "createdAt": "2026-07-19 10:00:00",
      "lastUsedAt": "2026-07-19 10:05:00",
      "transports": ["internal", "hybrid"]
    }
  ]
}
```

### `POST /api/passkey/credentials/delete`

认证：需要 JWT。

请求：

```json
{
  "id": 1
}
```

响应：

```json
{
  "result": true,
  "msg": "Passkey deleted"
}
```

## 数据库设计

新增 `passkey_credentials`：

```sql
CREATE TABLE passkey_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  credentialId TEXT UNIQUE NOT NULL,
  publicKey TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  deviceType TEXT,
  backedUp INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_passkey_credentials_userId
  ON passkey_credentials(userId);
```

新增 `passkey_challenges`：

```sql
CREATE TABLE passkey_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passkey_challenges_challenge_type
  ON passkey_challenges(challenge, type);
```

扩展 `users`：

```sql
ALTER TABLE users ADD COLUMN passkeyUserId TEXT;

CREATE UNIQUE INDEX idx_users_passkeyUserId
  ON users(passkeyUserId);
```

`passkeyUserId` 是随机生成的稳定 user handle。已有用户在首次绑定 Passkey 时补齐该字段。

## 配置

新增环境变量：

```text
PASSKEY_RP_ID=生产站点的可注册域名
PASSKEY_RP_NAME=GY Nav
PASSKEY_ORIGIN=https://生产站点完整域名
```

本地开发使用：

```text
PASSKEY_RP_ID=localhost
PASSKEY_ORIGIN=http://localhost:5173
```

生产环境必须使用 HTTPS。RP ID 必须和站点域名匹配。

## WebAuthn 参数

注册参数：

```ts
{
  attestationType: 'none',
  authenticatorSelection: {
    residentKey: 'required',
    userVerification: 'required',
  }
}
```

登录参数：

```ts
{
  userVerification: 'required'
}
```

首期不设置 `authenticatorAttachment: 'platform'`，避免把外部安全钥匙、Chrome Password Manager、跨设备 Passkey 排除掉。

## 安全要求

- Challenge 有效期建议 5 分钟。
- Challenge 只能使用一次，验证成功或失败后应删除或标记失效。
- 注册 verify 必须校验当前 JWT 用户与 challenge 用户一致。
- 登录 verify 必须通过 credential ID 查找已保存凭证和用户。
- 必须校验 origin、RP ID、challenge、type、user verification、签名。
- 必须保存并更新 counter；对同步型 Passkey 的 counter 行为按 WebAuthn 库推荐策略处理，避免误拒绝正常 iCloud Keychain/Chrome 凭证。
- 不能把私钥、原始生物识别信息或系统 PIN 传给服务端；服务端只保存公钥和凭证元数据。
- 删除凭证只能删除当前 JWT 用户自己的凭证。
- 登录失败返回统一错误文案，避免泄露 credential 是否存在。

## 依赖策略

前端使用：

```text
@simplewebauthn/browser
```

服务端优先使用：

```text
@simplewebauthn/server
```

在开始完整实现前，需要验证 `@simplewebauthn/server` 在 Cloudflare Pages Functions/Workers 构建和运行环境中可用。如果构建或运行时不兼容，再改用 Worker-safe 的轻量 WebAuthn 验证实现。

## 兼容性与降级

- 浏览器不支持 WebAuthn：继续使用用户名密码登录。
- 用户取消 Passkey 操作：显示取消提示，不清空已输入用户名。
- Challenge 过期：提示重新发起 Passkey 登录。
- 未绑定 Passkey：提示先用密码登录并绑定。
- 服务端验签失败：返回统一失败提示，并允许重试。
- 用户设备丢失：保留密码登录作为账号恢复入口。

## 测试计划

构建验证：

- `npm run build`

后端接口验证：

- 未登录调用绑定 options 应返回 401。
- 登录后调用绑定 options 应返回 registration options。
- 注册 verify 使用错误 challenge 应失败。
- 注册 verify 成功后 D1 保存 credential。
- 登录 options 生成 challenge。
- 登录 verify 使用错误 credential 应失败。
- 登录 verify 成功后返回 JWT 和用户数据。
- 登录 verify 成功后更新 `lastUsedAt`。
- 删除其他用户 credential 应失败。

浏览器验证：

- macOS Safari 绑定和登录。
- macOS Chrome 绑定和登录。
- iPhone Safari 绑定和登录。
- 用户取消 Face ID/Touch ID 后提示正确。
- 不支持 WebAuthn 的浏览器或环境有清晰降级提示。

回归验证：

- 用户名密码登录仍可用。
- 注册仍可用。
- JWT 保护接口仍可用。
- 登录后首页数据加载和本地缓存逻辑仍可用。

## 实施顺序

1. 安装并验证 SimpleWebAuthn 前后端依赖。
2. 新增 D1 SQL 迁移文件。
3. 新增 Passkey 配置读取和通用用户登录响应 helper。
4. 新增 `PasskeyService`。
5. 在 `lib/hono/index.ts` 注册 Passkey 路由和免登录白名单。
6. 前端新增 `postJson` 和 Passkey helper。
7. 登录页增加 Passkey 登录入口。
8. 已登录状态增加绑定和凭证管理入口。
9. 执行构建、接口和浏览器验证。

## 参考资料

- W3C WebAuthn Level 3: https://www.w3.org/TR/webauthn-3/
- MDN Web Authentication API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
- Apple Passkeys: https://developer.apple.com/passkeys/
- SimpleWebAuthn Docs: https://simplewebauthn.dev/docs/
- Cloudflare Workers Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
- Cloudflare D1 Prepared Statements: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
