# Changes

## 2026-10-02

- Changed: Memo scaffold created.
- Verification: Not run yet.
- Known issues: None confirmed.
- Next: Fill requirement context as work proceeds.

### 继续未完成的技术方案

- Changed: 修复上次文档写入失败后只留空模板的状态，完成 tech.md、protocol.md、brief/index/files/decisions/handoff。
- Verification: 读取项目路由、wrangler 配置和 feature memo；直接抓取 Cloudflare R2 Workers API、lifecycle、Pages bindings 和 W3C WebCrypto 官方页面。核对配对码/鉴权/信封分域、nonce 与 AAD、创建到期时间、领取幂等、R2/D1 跨存储失败补偿和独立清理 Worker。
- Verification: 本轮仅文档，未运行业务 build/test，也未执行 SQL、创建云资源或部署；preview 集成测试计划在 tech.md 第 13 节。
- Known issues: 当前账户套餐、成本价格和 Safari/移动端保存上限尚需实测。短数字码与匿名发送为待确认需求。
- Next: 技术方案评审完成后再实施 crypto/API/UI/preview；本轮请求已交付详细方案。
- Review: 补充服务端 expiresAt 后冻结信封的二阶段创建、稳定接收 token、ack 幂等例外，以及 D1 条件更新 0 行不自动回滚的事务断言要求。
- Verification: 将 protocol.md 的 SQL fenced block 提取后送入 `sqlite3 :memory:`，退出码 0；仅证明 schema 基本语法，不代表 D1 并发/云端行为已经验证。
- Changed: 回应 R2 免费额度疑问，补充 WebRTC 直连方案及 R2 免费额度的准确含义。
- Verification: 读取 Cloudflare R2 Pricing（2026-10-01）和 Cloudflare Realtime Pricing（2026-09-22）官方页面；R2 免费项为 10 GB-month Standard 存储、100 万 Class A、1000 万 Class B，出网免费；Realtime 的 SFU/TURN 共享每月前 1000 GB egress 免费，超出按官方费率计费。
- Changed: 用户明确选择只用 WebRTC；新增 `webrtc-tech.md` 与 `webrtc-protocol.md`，将当前实施范围改为纯 DataChannel 在线传输，旧 R2 文档保留为历史记录。
- Verification: 检查新文档均明确不写 R2/其他文件存储、双方在线约束、TURN 是否允许、frame 背压、重连 generation、信令短期 TTL 和应用层 AES-GCM。
- Known issues: 尚未实现代码；纯 WebRTC 仍需确定 TURN 供应商、信令幂等角色恢复策略和浏览器保存能力矩阵。
- Next: 实施时先写协议测试向量，再实现 Hono signaling + D1 短期房间，最后接入 React DataChannel 传输。
- Changed: 完成第一版纯 WebRTC 原型代码：新增 `rtcService`、`rtc.sql`、`rtcCrypto`、信令 API、`/transfer` 页面和入口；创建房间单独要求应用 JWT，接收加入使用房间 token。
- Verification: `npm run build` 通过；`npm test -- --run` 通过（2 个测试文件、19 个测试）。
- Known issues: 当前 demo 使用轮询信令和公网 STUN；未配置 TURN、未实现信令 MAC、ICE candidate 完整代际校验、可靠 ACK/断线恢复、流式文件保存和完整 E2E 测试。发送端/接收端需先在 D1 执行 `lib/hono/SQL/rtc.sql`。
- Next: 修复 demo 协议的安全与可靠性缺口：增加配对码派生的信令 MAC、TURN 配置、DataChannel frame/ACK/backpressure、断线恢复和真实双浏览器测试。

## 2026-10-02：完成 WebRTC 流程、恢复与本地集成测试

- 修复先前 MVP 双方等待 ready 的握手死锁、接收完成判断错误、异步 onmessage 并发写入、保存 picker 缺少用户激活及失败后资源泄漏。
- 新增 `rtcTransfer.ts` 会话状态机：hello/ready/frames/ack/complete/saved；sender 收 saved 才报告完成；Blob 模式接收方显式下载。
- 实现取消/离页清理、请求 abort、PC/通道关闭、Worker dispose、sink abort、Blob URL revoke、超时、30 秒心跳、1.5 秒信令轮询。
- 实现最多 8 代重连；已写入进度为权威，丢失 ACK 不重复写。旧写入与新 hello 串行化；最终保存结果保留两分钟支持 lost saved 恢复。
- 限制帧 index/offset/total 与块长一致，篡改认证失败后中止。保存对话框取消可再次点击，不静默下载。
- 修复 Hono 路由异常 JSON 契约；添加实际 SQLite API 测试。TURN 单对象/数组配置规范化、过滤 53 端口；变量改为 `RTC_TURN_KEY_SECRET` 明确是 TURN key secret。
- Playwright 开发依赖及可复现本地脚本已添加。pnpm 离线校验因缺少 metadata 失败，随后正常联网 frozen install 成功，锁文件供应链校验通过；未绕过策略，依赖链接已恢复。自动生成的无效 workspace 模板已清理。
- 最终验证：`npm run build`、`npm test -- --run`（6 文件/43 测试）、新增文件 eslint、后端 tsc、`git diff --check` 通过。
- 本地 D1 执行 rtc.sql 成功；真实 Chrome DataChannel/Worker/D1 E2E 9 场景通过：0 B、1 KiB、1 MiB、1 MiB+1 B、4 MiB+1 B 内容 SHA-256；块 ACK 丢失续传；最终 saved 丢失恢复；密文篡改拒绝；picker 取消和对端取消；错误配对码。主矩阵 ICE 配置仅本机候选，不视为跨网络测试；另已通过默认 STUN 配置的空文件传输，公网 STUN 不可达时 gathering 延迟接近一分钟。
- 云端只读访问检查：`wrangler whoami` 返回 Not logged in。未执行远程 D1 schema/部署/创建 TURN key；需要用户登录后继续 preview 部署和真机跨网络验收。

## 2026-10-03：短码与接收体验改造

- Changed: 配对码改为无偏 36 进制 6 位；移除短码直接派生文件/信令 MAC，改用 CPace draft-20 + PBKDF2 PRS + 双向 HMAC key confirmation。
- Changed: 信令版本 2 支持 trickle ICE candidate；接收配对后立即创建 OPFS/内存 sink，传输完成后再调用保存选择器。
- Changed: 房间 join 增加每 IP 和每房间限流；首页传输入口改为 48px MUI SwapHorizIcon。
- Verification: `pnpm build` 通过；`pnpm test` 通过（6 文件、45 测试）；真实双 Chrome 本地 E2E 通过 0B、1KiB、1MiB、1MiB+1B、4MiB+1B、重连、最终确认丢失、密文篡改、保存取消、错误码；指定 PDF 55,259,905B 默认 STUN 传输通过且 SHA-256 一致，自动接收约 981ms。
- Known issues: 8790 本地 E2E 仅同机网络，不能证明跨运营商连通；线上仍是旧部署，未执行远程 D1/deploy；全仓 eslint 仍有既有 88 项问题，改动相关文件无新增阻塞。
