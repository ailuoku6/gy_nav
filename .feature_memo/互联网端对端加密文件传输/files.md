# 文件索引

| 文件 | 实现职责 |
| --- | --- |
| `src/pages/FileTransfer.tsx` | 发送/接收界面、确认保存、取消、进度、配对码及下载 URL 生命周期 |
| `src/utils/rtcTransfer.ts` | 会话状态机、握手、PC/通道生命周期、信令轮询/心跳、8 代恢复和保存完成确认 |
| `src/utils/rtcProtocol.ts` / `.test.ts` | 受限块组装、顺序/偏移校验、续传位置与控制消息 |
| `src/utils/rtcCrypto.ts` / `.test.ts` | 配对码/HKDF、SDP MAC、AES-GCM 信封/块及帧编码 |
| `src/utils/rtcSignalingApi.ts` | 请求超时、取消、有限重试与 API 客户端 |
| `src/utils/rtcSave.ts` / `.test.ts` | 用户激活 picker、流式保存、内存 fallback、大小核对/abort |
| `src/utils/rtcWorker.ts` / `src/workers/rtc-transfer.worker.ts` | 分块加解密、可停止 Worker 任务 |
| `src/router/router.tsx` / `src/component/FeaturePanel/index.tsx` | `/transfer` 和首页入口 |
| `lib/hono/service/rtcService.ts` / `.test.ts` | D1 原子角色占用、信令、TTL、限流、TURN 凭据规范化及真实 SQLite API 测试 |
| `lib/hono/SQL/rtc.sql` | 可重复执行的新信令表和索引，仅本地已执行 |
| `lib/hono/index.ts` / `lib/hono/types/index.ts` | RTC 路由、鉴权边界、no-store/Origin/JSON 错误响应、TURN key 类型 |
| `scripts/rtc-e2e.mjs` | 本地真实双 Chrome 上下文 WebRTC/D1/Worker 集成测试 |
| `docs/file-transfer.md` | 使用、运行、验证、D1/可选 TURN 上线准备 |
| `package.json` / `pnpm-lock.yaml` | Playwright 开发依赖、本地 DB/API/E2E 脚本 |

现有 Pages 入口 `functions/api/[[routes]].ts`、应用 JWT、DB binding 均复用。没有文件存储 binding，没有新增云资源。现有 `src/utils/http.ts` 和服务端固定 IV 加密不用于此功能。
