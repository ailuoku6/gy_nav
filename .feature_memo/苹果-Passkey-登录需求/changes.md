# Changes

## 2026-07-19

- Changed: 创建需求 memo，确认目标为当前 Web 站点通用 Passkey 登录，并记录推荐技术方案草案。
- Verification: 已检查项目登录链路、D1 用户表、Hono 路由、JWT 工具、前端登录页和依赖信息；未进入代码实现。
- Known issues: 生产域名/RP ID、是否首期支持 Passkey-only 注册仍待最终确认。
- Next: 用户确认方案后写正式设计文档和实现计划。

- Changed: 用户确认采用方案 A，创建正式设计文档 `docs/superpowers/specs/2026-07-19-passkey-login-design.md`。
- Verification: 已扫描设计文档中的 `TBD`、`TODO`、`待定`、`占位`、`placeholder`、`FIXME`、`不确定`，未发现残留；已人工检查范围、接口、数据流和安全要求。
- Known issues: 生产域名/RP ID 仍需在实现或部署前填写为真实值。
- Next: 用户审阅设计文档后进入实现计划拆解。

- Changed: 拆解实施计划到 `docs/superpowers/plans/2026-07-19-passkey-login.md`，并开始编码后端基础层。
- Changed: 安装 `@simplewebauthn/browser@13.3.0`、`@simplewebauthn/server@13.3.2`、`vitest@2.1.9`；添加 `test`/`test:watch` 脚本和 `vitest.config.ts`。
- Changed: 新增 `lib/hono/SQL/passkeys.sql`，包含 `users.passkeyUserId`、`passkey_credentials`、`passkey_challenges`。
- Changed: 抽出 `UserService.buildLoginSuccessPayload`，密码登录已改用该 helper；新增 `PasskeyService.getConfig/saveChallenge/consumeChallenge`。
- Verification: TDD RED `node_modules/.bin/vitest run lib/hono/service/passkeyService.test.ts` 先因 `buildLoginSuccessPayload is not a function` 失败，后通过。
- Verification: TDD RED 同一测试随后因缺少 `./passkeyService` 失败，补实现后通过 5/5。
- Verification: `npm test -- lib/hono/service/passkeyService.test.ts` 通过 5/5；`npm run build` 通过。
- Known issues: `pnpm test` 会触发 pnpm 11 deps-status 非交互安装检查并被 `confirmModulesPurge` 拦截；当前可用 `npm test` 或直接 `node_modules/.bin/vitest run ...`。`pnpm install` 还提示未批准 `esbuild`、`sharp`、`workerd` build scripts，尚未替用户做批准。
- Next: 继续 Task 5 注册 options/verify，补当前 JWT 用户解析、稳定 user handle、SimpleWebAuthn 注册校验和路由。

- Changed: 实现完整 Passkey 后端 API：`/api/passkey/register/options`、`/api/passkey/register/verify`、`/api/passkey/login/options`、`/api/passkey/login/verify`、`GET /api/passkey/credentials`、`POST /api/passkey/credentials/delete`。
- Changed: `PasskeyService` 现在支持稳定 `passkeyUserId`、注册 options、注册 verify、登录 options、登录 verify、凭证列表、凭证删除、counter/lastUsedAt 更新。
- Changed: 前端新增 `postJson`、Passkey API 常量、`src/utils/passkey.ts`，登录页新增 Passkey 登录、已登录绑定、凭证列表和删除入口。
- Changed: `package.json` build 脚本会从 `build/lib` 删除 `*.test.ts`，lint 脚本忽略生成的 `build` 目录。
- Verification: TDD RED 新增服务测试先因 `createRegistrationOptions`、`verifyRegistration`、`createLoginOptions`、`verifyLogin`、`deleteCredential` 缺失失败，补实现后通过。
- Verification: `npm test` 通过 13/13；`npm run build` 通过；`node_modules/.bin/tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --skipLibCheck --types @cloudflare/workers-types,vite/client lib/hono/index.ts` 通过。
- Verification: 本地 Vite dev server 打开 `http://127.0.0.1:5173/login`，页面标题为“注册/登陆”，DOM 中存在“使用 Passkey 登录”按钮，app 控制台无本地页面错误。
- Known issues: `npm run lint` 仍失败，剩余为整仓既有 lint 债和少量现有规则警告（例如旧 `any`、`@ts-ignore`、fast-refresh）；本轮未整体清理。真实 WebAuthn ceremony 仍需在已应用 D1 schema 和正确 RP ID/origin 后用 Safari/Chrome/iPhone 手测。
- Next: 应用 D1 SQL、配置 Passkey 环境变量，执行真实浏览器绑定/登录/删除验证。

- Changed: 根据 D1 执行错误 `no such table: main.passkey_challenges`，将迁移拆分为可重复执行的 `lib/hono/SQL/passkeys.sql` 和一次性 `lib/hono/SQL/passkeys_user_column.sql`，并新增 `lib/hono/SQL/README_passkeys.md`。
- Verification: 用临时 SQLite 数据库验证 `passkeys.sql` 可创建 `passkey_credentials`/`passkey_challenges`，`passkeys_user_column.sql` 可给 `users` 补充 `passkeyUserId`。
- Known issues: 如果某个 D1 已执行过旧版 `ALTER TABLE users ADD COLUMN passkeyUserId`，再次执行 `passkeys_user_column.sql` 会报 duplicate column，可忽略并继续确认 Passkey 表存在。
- Next: 先执行 `passkeys.sql`，再按数据库状态执行或跳过 `passkeys_user_column.sql`。

- Changed: 针对生产 `https://nav.ailuoku6.top/api/passkey/register/verify` 返回 `Passkey verification failed`，修复 `PasskeyService.getConfig`：未设置 env 时从请求 URL 自动推导 `rpID` 和 `origin`，避免生产默认继续使用 `localhost`。
- Changed: `verifyRegistration` / `verifyLogin` 失败时记录 `[passkey] verification failed` 日志，包含 flow、错误 message、expectedOrigin、expectedRPID、requestOrigin；challenge 改为验证通过后再删除。
- Verification: `npm test` 通过 15/15；后端独立 `tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --skipLibCheck --types @cloudflare/workers-types,vite/client lib/hono/index.ts` 通过；`npm run build` 通过。
- Known issues: 需要部署最新代码后重新发起一次 Passkey 绑定；旧 ceremony 不能复用。若仍失败，查看 Cloudflare Pages Functions 日志中的 `[passkey] verification failed` 具体 message。
- Next: 部署并在 `https://nav.ailuoku6.top/login` 重新执行“登录 -> 绑定 Passkey -> 登出 -> Passkey 登录”。
