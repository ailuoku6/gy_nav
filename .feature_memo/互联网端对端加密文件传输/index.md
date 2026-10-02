# 互联网端对端加密文件传输

- 状态：纯 WebRTC 实现及本地集成验证已完成；待云端部署和真机跨网络验收。
- 更新：2026-10-02
- 当前入口：`/transfer`；首页工具面板「传输文件」。

## 文档

- `brief.md`：用户目标、范围和验收边界。
- `webrtc-tech.md`：当前架构方案与实现补充。
- `webrtc-protocol.md`：与源码一致的当前协议。
- `files.md`：实际文件索引。
- `decisions.md`：历史决策。
- `changes.md`：实现与验证记录。
- `handoff.md`：继续工作说明。
- `../../docs/file-transfer.md`：操作、运行、测试、D1/TURN 配置和上线验收。
- `tech.md` / `protocol.md`：旧 R2 方案，仅历史参考。

## 最新事实

文件只走 WebRTC DataChannel；浏览器 AES-GCM 加密，D1 只处理短期信令。已修复 MVP 的握手死锁、完成条件和异步消息并发问题，补齐取消、资源清理、同页面恢复、最终确认丢失恢复和保存 picker 用户激活。配对码 26 位 Base32，发送登录、接收免登录。

## 后续

运行远程环境 schema，发布 preview，配置可选 TURN key secret 并用两台真实设备不同网络验收。生产未部署、远程 schema 未执行；不宣称真实跨网/TURN 测试完成。
