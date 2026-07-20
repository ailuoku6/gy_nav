# 苹果 Passkey 登录需求

- Status: active
- Last updated: 2026-07-19
- Current focus: Passkey 后端 API 与前端登录/绑定/凭证管理入口已实现；生产配置已确认修好，删除 Passkey 已新增二次确认，等待部署后手测删除确认流程。
- Workspace: `GY_nav_react`

## Document Map

- `brief.md`: user goal, scope, acceptance criteria, open questions
- `tech.md`: technical plan, architecture, dependencies, constraints
- `protocol.md`: data/API/event/storage contracts
- `files.md`: important files and recent modifications
- `decisions.md`: decisions and rationale
- `changes.md`: chronological implementation and verification log
- `handoff.md`: compact resume note for a new AI thread

## Latest Summary

- 用户确认目标是在当前 Web 站点接入 iPhone/Mac/Safari/Chrome 可用的通用 Passkey 登录。
- 当前项目是 React/Vite 前端 + Hono Cloudflare Pages Functions 后端 + D1 数据库 + JWT 会话。
- 推荐方案是基于 WebAuthn/Passkey 标准实现，Apple 设备通过系统 Passkey/iCloud Keychain 提供体验，后端验证成功后继续签发现有 JWT。
- 用户已确认采用方案 A：首期先做“现有账号绑定 Passkey + Passkey 登录”，保留用户名密码链路，降低对 `users.passWord NOT NULL` 的改动风险。
- 正式设计文档已写入 `docs/superpowers/specs/2026-07-19-passkey-login-design.md`。
- 实施计划已写入 `docs/superpowers/plans/2026-07-19-passkey-login.md`。
- 已安装 `@simplewebauthn/browser@13.3.0`、`@simplewebauthn/server@13.3.2`、`vitest@2.1.9`。
- 已用 TDD 完成 `UserService.buildLoginSuccessPayload`、`PasskeyService` 的 config/challenge 基础方法、注册/登录 options 与 verify、凭证列表/删除。
- 前端登录页已接入“使用 Passkey 登录”“绑定 Passkey”和凭证列表删除；新增 JSON HTTP helper 和 WebAuthn browser helper。
- 验证通过：`npm test` 13/13，`npm run build`，后端 `tsc --noEmit ... lib/hono/index.ts`。
- D1 迁移已拆分：`lib/hono/SQL/passkeys.sql` 可重复创建 Passkey 表，`lib/hono/SQL/passkeys_user_column.sql` 只为每个 D1 数据库执行一次。
- `PasskeyService.getConfig` 现在会在未配置 `PASSKEY_RP_ID`/`PASSKEY_ORIGIN` 时从当前请求 URL 推导生产 rpID/origin，例如 `https://nav.ailuoku6.top` -> `nav.ailuoku6.top`/`https://nav.ailuoku6.top`。
- 已确认用户提供的生产 registration credential 本地 SimpleWebAuthn 校验可通过；线上继续失败更可能是 challenge 查找失败或 D1 credential 保存失败。
- 生产 tail 日志确认实际失败根因是 `PASSKEY_ORIGIN` 错配为 `.com`，用户已改好配置并确认可用。
- 删除 Passkey 已加二次确认，确认文案为“确认删除这个 Passkey 吗？删除后需要重新绑定才能再次使用。”

## Next Actions

- 部署最新代码后重新发起一次 Passkey 绑定；旧的失败 verify 对应 challenge/credential ceremony 不要复用。
- 如果部署后返回“Passkey challenge 已失效或不存在”，检查 `passkey_challenges` 是否有对应 challenge、userId 和未过期 expiresAt。
- 如果部署后返回“Passkey 保存失败”，按错误修复 `passkey_credentials` 远程 schema。
- 部署后手测删除凭证的取消/确认两条路径。
- 将 `lib/hono/SQL/passkeys.sql` 应用到 D1 preview/production 数据库。
- 确认 `users.passkeyUserId` 是否存在；不存在时执行一次 `lib/hono/SQL/passkeys_user_column.sql`，已存在时跳过。
- 可选显式配置真实 `PASSKEY_RP_ID`、`PASSKEY_RP_NAME`、`PASSKEY_ORIGIN`；生产 origin 必须是 HTTPS 完整域名。
- 在 macOS Safari/Chrome 和 iPhone Safari 上手测绑定、登录、取消 prompt、删除凭证。
- 整仓 `npm run lint` 仍有既有 lint 债，后续可单独清理。

## Open Questions

- 生产域名/RP ID 需要在实现前确认，例如 `example.com` 或当前部署域名。
- 首期已明确不做 Passkey-only 注册；设计中包含免用户名 discoverable credential 登录能力。
