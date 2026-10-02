# 继续工作说明

纯 WebRTC 文件传输已完整实现并通过本地集成验证；代码未提交、未部署。用户授权持续补齐，不要切回 R2。

从 `docs/file-transfer.md`、`webrtc-protocol.md` 和 `src/utils/rtcTransfer.ts` 开始。发送登录、接收免登录，26 位随机配对码，D1 仅短期信令，AES-GCM Worker 加解密，1 MiB 块/16 KiB 帧，可靠 ordered DataChannel，校验写入后 ACK。hello 在 channel open 发送，用户点击保存后 ready；complete/saved 确认。最多 8 代重建 PC，接收进度保留；lost ACK 和 lost final saved 都有恢复。取消、离页清理、流式保存、Blob 限额/下载均实现。

已通过：build、43 单元/API 测试、新文件 eslint、后端 tsc、diff check；本地 rtc.sql migration；9 个真实双 Chrome 场景（下载 SHA-256、丢 ACK 续传、lost saved 恢复、篡改密文拒绝、取消、无效码）。主 E2E 使用 host candidates，不能宣称跨运营商/TURN 验收。

阻碍上线：`wrangler whoami` 返回 Not logged in；无已配置 TURN secret。需要用户登录 Cloudflare 后，按文档执行 preview D1 schema，部署 preview，并用两台设备不同网络验证。TURN 可选，变量 `RTC_TURN_KEY_ID` / `RTC_TURN_KEY_SECRET`，secret 是 TURN key secret，非账户 API token。真实 TURN relay、Safari/移动真机待验收。

本地运行：`npm run rtc:db:local`，`npm run rtc:dev`，另一终端 `RTC_E2E_HOST_ONLY=1 npm run test:rtc:e2e`。测试 JWT 仅本地脚本创建。依赖安装恢复且供应链校验通过；未绕过策略。
