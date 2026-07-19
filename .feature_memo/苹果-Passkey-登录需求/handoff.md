# Handoff

Resume from `index.md`.

Current state:
- 用户要在当前 Web 站点接入 iPhone/Mac/Safari/Chrome 可用的通用 Passkey 登录。
- 已确认应采用 WebAuthn/Passkey 标准方案，而不是 Sign in with Apple OAuth。
- 项目当前是 React/Vite 前端 + Hono Cloudflare Pages Functions 后端 + D1 + JWT；用户已确认方案 A：首期做现有账号绑定 Passkey，再支持 Passkey 登录并复用现有 JWT。
- 正式设计文档已创建：`docs/superpowers/specs/2026-07-19-passkey-login-design.md`。
- 实施计划已创建：`docs/superpowers/plans/2026-07-19-passkey-login.md`。
- 已安装 SimpleWebAuthn 和 Vitest，已完成后端 API 与前端入口：注册 options/verify、登录 options/verify、凭证列表/删除、登录页 Passkey 登录/绑定/删除。
- 验证通过：`npm test` 13/13，`npm run build`，后端独立 `tsc --noEmit ... lib/hono/index.ts`。
- 本地浏览器验证：`http://127.0.0.1:5173/login` 可打开，存在“使用 Passkey 登录”按钮，app 控制台无本地页面错误。
- 用户执行迁移时遇到 `no such table: main.passkey_challenges`；已将 D1 迁移拆分为 `passkeys.sql`（可重复 Passkey 表/索引）和 `passkeys_user_column.sql`（一次性 `users.passkeyUserId` 字段/索引），并新增 `README_passkeys.md`。

Most relevant files:
- `docs/superpowers/plans/2026-07-19-passkey-login.md`: 继续实现的施工图。
- `lib/hono/service/passkeyService.ts`: 下一步扩展注册/登录 options 与 verify。
- `lib/hono/service/passkeyService.test.ts`: 继续按 TDD 添加注册/登录/凭证管理测试。
- `lib/hono/index.ts`: 已注册所有 Passkey API 路由。
- `src/pages/Login.tsx`: 登录/注册页面，后续增加 Passkey 入口。
- `src/utils/http.ts`: 当前请求封装，WebAuthn 建议新增 JSON POST helper。
- `src/utils/passkey.ts`: 前端 SimpleWebAuthn browser helper。
- `lib/hono/SQL/passkeys.sql`: Passkey credential/challenge 表，可重复应用到 D1。
- `lib/hono/SQL/passkeys_user_column.sql`: `users.passkeyUserId` 一次性迁移；如果已存在则跳过。
- `lib/hono/SQL/README_passkeys.md`: D1 迁移执行顺序和检查命令。

Need next:
- 应用 `lib/hono/SQL/passkeys.sql` 到 D1 preview/production；确认 `users.passkeyUserId`，不存在再执行 `passkeys_user_column.sql`。
- 配置 `PASSKEY_RP_ID`、`PASSKEY_RP_NAME`、`PASSKEY_ORIGIN`。
- 在真实 Safari/Chrome/iPhone 上手测绑定、登录、取消 prompt、删除凭证。

Watch out:
- 生产 RP ID/origin 必须和实际 HTTPS 域名一致。
- `ALTER TABLE users ADD COLUMN passkeyUserId` 不能重复执行；重复时会报 duplicate column。
- `pnpm test` 当前被 pnpm deps-status/confirmModulesPurge 拦截；使用 `npm test -- lib/hono/service/passkeyService.test.ts` 可跑通。
- `npm run lint` 仍有既有 lint 债；不要把它误判为本轮 Passkey 功能构建失败。
