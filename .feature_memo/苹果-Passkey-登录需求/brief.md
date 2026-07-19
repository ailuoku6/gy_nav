# Brief

## User Goal

- 在当前 Web 站点接入通用 Passkey 登录，让 iPhone、Mac、Safari、Chrome 等支持 WebAuthn 的环境可以使用系统 Passkey 完成登录。

## Scope

- 新增 Passkey 凭证绑定流程：用户已登录后可为当前账号创建 Passkey。
- 新增 Passkey 登录流程：未登录用户可通过浏览器 Passkey API 完成认证，服务端验证后签发现有 JWT。
- 前端登录页增加 Passkey 登录入口，已登录状态增加 Passkey 绑定入口。
- 后端新增 WebAuthn 注册/认证 options 与 verify 接口，并在 D1 持久化凭证和 challenge。

## Non-Goals

- 首期不做 Sign in with Apple OAuth；Passkey 是 WebAuthn 标准能力，不等同于 Apple OAuth。
- 首期不建议做 Passkey-only 新用户注册，避免立即改造 `users.passWord NOT NULL` 和账号恢复流程。
- 首期不接入原生 iOS App 的 Associated Domains / AuthenticationServices 流程；纯 Web 登录不需要 Apple Developer 账号配置。

## Acceptance Criteria

- 用户登录后可以成功绑定一个 Passkey。
- 已绑定 Passkey 的用户可以在支持 WebAuthn 的浏览器中完成 Passkey 登录。
- Passkey 登录成功后复用当前登录返回结构，前端能保存 token、用户信息、分区数据和常用站点数据，并回到首页。
- 不支持 Passkey 或用户取消生物识别/PIN 时，页面给出可理解的提示，并可继续使用用户名密码登录。
- 服务端会校验 challenge、origin、RP ID、用户验证结果、凭证 ID、公钥签名，并更新凭证 counter/lastUsedAt。

## Open Questions

- 生产域名/RP ID 是什么。
- 是否需要用户管理多个 Passkey、重命名和删除；推荐首期至少支持查看/删除，重命名可后置。
