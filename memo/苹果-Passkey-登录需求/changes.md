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
