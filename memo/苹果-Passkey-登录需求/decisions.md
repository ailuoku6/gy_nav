# Decisions

## 2026-07-19 - 采用 WebAuthn 通用 Passkey 方案

- Decision: 当前需求按 WebAuthn/Passkey 实现，不按 Sign in with Apple OAuth 或原生 iOS AuthenticationServices 方案实现。
- Rationale: 用户确认目标是在当前 Web 站点支持 iPhone/Mac/Safari/Chrome 可用的通用 Passkey 登录；WebAuthn 是跨浏览器标准，Apple 设备会通过系统 Passkey 能力提供体验。
- Alternatives: Sign in with Apple OAuth；原生 App Associated Domains + AuthenticationServices。
- Consequences: 需要服务端持久化凭证、公钥、challenge 并完成 WebAuthn 校验；纯 Web 首期不需要 Apple Developer 账号配置。

## 2026-07-19 - 首期推荐绑定现有账号

- Decision: 首期推荐做“现有账号绑定 Passkey + Passkey 登录”，保留用户名密码登录。
- Rationale: 当前 `users.passWord` 为 `NOT NULL`，直接做 Passkey-only 注册会扩大账号体系和恢复流程改造。
- Alternatives: 一步到位做 Passkey-only 注册；只做用户名 + Passkey 二次认证。
- Consequences: 用户首次仍需通过密码账号存在或登录后绑定；后续可平滑扩展 Passkey-only 注册。
