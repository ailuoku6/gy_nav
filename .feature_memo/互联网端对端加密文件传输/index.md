# 互联网端对端加密文件传输

- 状态：本地实现与真实双 Chrome 验证完成；待云端 D1 迁移、部署和两台真实设备跨网络验收。
- 更新：2026-10-03
- 当前入口：`/transfer`；首页工具面板「传输文件」。

## 文档

- `brief.md`：目标和验收边界。
- `webrtc-tech.md`：架构与实现补充。
- `webrtc-protocol.md`：当前协议。
- `files.md`：文件索引。
- `decisions.md`：决策记录。
- `changes.md`：实现和验证记录。
- `handoff.md`：继续工作说明。
- `../../docs/file-transfer.md`：运行和上线说明。

## 最新事实

- 发送方选择文件后自动创建会话并生成配对码，接收方配对成功后自动传输，无需再点击发送按钮。
- 只用 WebRTC DataChannel 传文件；D1 仅保存短期信令，文件不进 R2。
- 配对码为无偏 36 进制 6 位；短码只用于 CPace 在线 PAKE，随机文件密钥由 CPace 会话密钥包装。
- 使用 trickle ICE，SDP 先发布，轮询协商期 300ms；本地 PDF 55,259,905 字节传输自动接收约 981ms，内容校验通过。
- 接收方配对后自动写入 OPFS 或受限内存，完成后才显示保存位置；首页入口改为更大的 MUI `SwapHorizIcon`。
- CPace 依赖 `@cipherman/pake-js@0.1.1`，其 `THREAT_MODEL.md` 要求调用方独立审查；当前方案已做 PBKDF2、key confirmation、在线限流，但尚未完成独立密码学审计。

## 后续

1. 登录 Wrangler 后对 preview/production 执行 `rtc.sql`。
2. 部署 Pages，优先配置 TURN key 覆盖蜂窝/公司网络。
3. 两台真实设备跨网络验证配对、传输、断线恢复和保存。
