# Files

## Recently Modified

| Path | Why it matters | Status |
| --- | --- | --- |
| `.feature_memo/苹果-Passkey-登录需求/*` | 记录需求方案、计划、实现状态和后续交接。 | modified |
| `docs/superpowers/plans/2026-07-19-passkey-login.md` | Passkey 登录具体实施计划，按任务拆分依赖、SQL、后端、前端和验证。 | added |
| `package.json` / `pnpm-lock.yaml` | 新增 SimpleWebAuthn 和 Vitest 依赖，添加 `test`/`test:watch` 脚本。 | modified |
| `vitest.config.ts` | 后端服务单测配置，匹配 `lib/**/*.test.ts`。 | added |
| `lib/hono/service/passkeyService.test.ts` | Passkey 基础服务和登录成功 helper 的 TDD 测试。 | added |
| `lib/hono/service/passkeyService.ts` | Passkey 配置读取、challenge 保存与一次性消费基础服务。 | added |
| `lib/hono/service/userService.ts` | 抽出共享登录成功 payload helper，供密码登录和后续 Passkey 登录复用。 | modified |
| `lib/hono/types/index.ts` | 新增 Passkey env binding、challenge 类型和用户 id 类型补充。 | modified |
| `lib/hono/SQL/passkeys.sql` | 新增 D1 Passkey credential/challenge 表与索引，可重复执行。 | added |
| `lib/hono/SQL/passkeys_user_column.sql` | 新增 `users.passkeyUserId` 一次性迁移和唯一索引。 | added |
| `lib/hono/SQL/README_passkeys.md` | 记录 Passkey D1 迁移执行顺序、重复执行注意事项和状态检查命令。 | added |
| `lib/hono/index.ts` | 注册 Passkey 后端路由，并把登录 options/verify 加入免登录白名单。 | modified |
| `src/utils/Api.ts` | 新增 Passkey API endpoint 常量。 | modified |
| `src/utils/http.ts` | 新增 `postJson`，用于 WebAuthn 嵌套 JSON payload。 | modified |
| `src/utils/passkey.ts` | 新增浏览器 WebAuthn helper 和错误文案映射。 | added |
| `src/pages/Login.tsx` | 接入 Passkey 登录、绑定、凭证列表、删除和共享登录成功处理。 | modified |
| `src/pages/login.css` | 新增凭证列表样式。 | modified |

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
