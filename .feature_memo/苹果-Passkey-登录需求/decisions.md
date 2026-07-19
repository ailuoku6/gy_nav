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

## 2026-07-19 - 使用兼容 Vite 5 的 Vitest 2.x

- Decision: 测试框架选择 `vitest@2.1.9`，不用当前最新 `vitest@4.1.10`。
- Rationale: 项目当前 Vite 是 5.x；Vitest 4 启动时报 `vite/module-runner` export 不存在，根因是 Vitest 4 需要 Vite 6+。
- Alternatives: 升级 Vite 到 6/7/8，或不用测试框架改写一次性脚本。
- Consequences: 保持构建工具升级范围最小；后续若项目整体升级 Vite，可再升级 Vitest。

## 2026-07-19 - 先实现后端基础层

- Decision: 首批编码只实现后端共享登录 payload 与 Passkey challenge/config 基础层。
- Rationale: WebAuthn 注册/登录验签依赖 challenge 一次性消费、安全配置和复用 JWT 响应；先把这些边界测牢，后续注册/登录 API 更容易验证。
- Alternatives: 先做前端按钮或一次性完成完整 WebAuthn 流程。
- Consequences: 当前还不能真实绑定/登录 Passkey；下一步应从注册 options/verify 继续。
