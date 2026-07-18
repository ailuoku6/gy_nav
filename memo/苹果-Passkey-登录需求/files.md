# Files

## Recently Modified

| Path | Why it matters | Status |
| --- | --- | --- |
| `memo/苹果-Passkey-登录需求/*` | 记录需求方案和后续实现上下文。 | modified |

## Important Context

| Path | Why it matters |
| --- | --- |
| `src/pages/Login.tsx` | 当前用户名密码登录/注册页面，后续需要增加 Passkey 登录和绑定入口。 |
| `src/utils/http.ts` | 当前 POST 使用 urlencoded；WebAuthn 建议新增 JSON 请求 helper。 |
| `src/utils/Api.ts` | 后续新增 Passkey API 常量。 |
| `lib/hono/index.ts` | 当前 API 路由和 JWT 免登录白名单，后续新增 Passkey 路由。 |
| `lib/hono/service/userService.ts` | 当前登录成功响应结构和 JWT 签发数据来源，Passkey 登录应复用该结构。 |
| `lib/hono/utils/sign.ts` | 当前 JWT 签发工具。 |
| `lib/hono/SQL/users.sql` | 当前用户表 `passWord NOT NULL`，影响 Passkey-only 注册范围。 |
| `wrangler.toml` | Cloudflare Pages Functions/D1 配置，后续需要确认 Passkey 环境变量。 |
