# Technical Notes

## Current Approach

- 推荐采用 WebAuthn 标准方案：前端使用浏览器 `navigator.credentials.create/get`，后端生成 challenge 并验证注册/认证响应。
- 首期路径为“现有账号绑定 Passkey + Passkey 登录”。绑定接口需要 JWT；登录接口免 JWT，验证成功后复用 `UserService.login` 类似的用户数据返回和 `signToken` JWT 签发。
- 服务端使用 `@simplewebauthn/server@13.3.2`，前端使用 `@simplewebauthn/browser@13.3.0` 降低 base64url/ArrayBuffer 处理风险。当前 `npm run build` 已通过；仍需在 Cloudflare Pages Functions 运行态验证真实 WebAuthn ceremony。
- 后端测试框架采用 `vitest@2.1.9`，原因是当前项目 Vite 为 5.x，Vitest 4.x 依赖 Vite 6+ 的 `vite/module-runner` 会启动失败。
- 已抽出 `UserService.buildLoginSuccessPayload(ctx, user)`，后续 Passkey 登录成功后应复用该 helper 返回 JWT 和用户首页数据。
- 已新增 `PasskeyService.getConfig/saveChallenge/consumeChallenge`，challenge 有 5 分钟 TTL，消费后删除，过期后删除。

## Key Constraints

- WebAuthn 依赖 HTTPS 安全上下文；本地开发可用 `localhost`。
- RP ID 必须与站点域名匹配，不能随意跨域；需要用环境变量固定生产值。
- 当前 `users.passWord` 是 `NOT NULL`，因此首期不建议直接做免密码注册。
- 当前 `post` 工具使用 `application/x-www-form-urlencoded`，WebAuthn 嵌套对象更适合新增 JSON POST helper 并在 Hono 侧使用 `ctx.req.json()`。
- Cloudflare Pages Functions / Workers 环境不是普通 Node 服务，服务端库必须做构建和运行时兼容性验证。

## Dependencies and Patterns

- 现有登录接口位于 `lib/hono/index.ts` 和 `lib/hono/service/userService.ts`。
- 当前 JWT 签发工具为 `lib/hono/utils/sign.ts`。
- 当前前端登录页为 `src/pages/Login.tsx`，HTTP 封装在 `src/utils/http.ts`，API 常量在 `src/utils/Api.ts`。
- 现有 D1 表结构在 `lib/hono/SQL/users.sql` 等 SQL 文件中维护。
- 新增 Passkey SQL 草案在 `lib/hono/SQL/passkeys.sql`。

## Risks

- Challenge 必须短期有效且一次性使用；否则有重放风险。
- Passkey 凭证 ID、公钥、counter、transports 等字段需要精确存储，编码不一致会导致登录不可用。
- Sync passkey 的 counter 可能为 0 或行为不同，校验策略需要避免误伤正常 iCloud Keychain/Chrome Password Manager 凭证。
- 若不提供账号恢复/删除凭证能力，用户丢失所有设备后可能无法重新绑定；首期保留密码登录可缓解。
- `pnpm install` 在 pnpm 11 下会触发 build-script approval，当前没有替用户批准 `esbuild`、`sharp`、`workerd` 的构建脚本；验证使用 `npm test` 和 `npm run build` 可通过。
