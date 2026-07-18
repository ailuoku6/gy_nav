# Handoff

Resume from `index.md`.

Current state:
- 用户要在当前 Web 站点接入 iPhone/Mac/Safari/Chrome 可用的通用 Passkey 登录。
- 已确认应采用 WebAuthn/Passkey 标准方案，而不是 Sign in with Apple OAuth。
- 项目当前是 React/Vite 前端 + Hono Cloudflare Pages Functions 后端 + D1 + JWT；用户已确认方案 A：首期做现有账号绑定 Passkey，再支持 Passkey 登录并复用现有 JWT。
- 正式设计文档已创建：`docs/superpowers/specs/2026-07-19-passkey-login-design.md`。

Most relevant files:
- `src/pages/Login.tsx`: 登录/注册页面，后续增加 Passkey 入口。
- `src/utils/http.ts`: 当前请求封装，WebAuthn 建议新增 JSON POST helper。
- `lib/hono/index.ts`: API 路由和 JWT 白名单。
- `lib/hono/service/userService.ts`: 当前登录成功响应结构。
- `lib/hono/SQL/users.sql`: 用户表约束影响 Passkey-only 注册。

Need next:
- 请用户审阅设计文档；确认后进入实现计划拆解。

Watch out:
- 生产 RP ID/origin 必须和实际 HTTPS 域名一致；Cloudflare Worker 环境下服务端 WebAuthn 库需要构建/运行验证。
