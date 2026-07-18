# 苹果 Passkey 登录需求

- Status: active
- Last updated: 2026-07-19
- Current focus: 方案 A 已确认，正式设计文档已创建，等待用户审阅。
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

## Next Actions

- 请用户审阅设计文档。
- 用户确认设计文档后，进入实现计划拆解。

## Open Questions

- 生产域名/RP ID 需要在实现前确认，例如 `example.com` 或当前部署域名。
- 首期已明确不做 Passkey-only 注册；设计中包含免用户名 discoverable credential 登录能力。
