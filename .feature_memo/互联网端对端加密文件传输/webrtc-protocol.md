# 当前 WebRTC 协议 v1（与实现一致）

更新：2026-10-02。文件字节仅走 WebRTC DataChannel；旧 R2 协议不实施。

## 配对与能力凭据

浏览器生成 26 位 Crockford Base32 代码，130 bit 随机熵。大小写、空白和分隔横线可规范化。配对码不传服务端。

- roomId = SHA-256(`gy-rtc/v1/room:` + normalizedCode)，64 位十六进制。
- receiverProof = HMAC(HKDF(code, zero salt, `gy-rtc/v1/receiver-proof`), `join`)。
- 发送方提交 SHA-256(proof)，接收方领取时提交 proof；只能占用一个接收角色。
- sender/receiver token 均由客户端随机产生 32 字节，服务端只存 SHA-256。相同 capability 可幂等重试，其他 token 无法接管。
- 房间 token 放 Authorization Bearer；不放 URL。所有 RTC 响应 no-store，拒绝跨站 Origin。

## API

| 方法/路径（前缀 `/api/rtc`） | 鉴权 | 请求/响应 |
| --- | --- | --- |
| POST `/rooms` | 既有应用 JWT | `{roomId,tokenHash,verifier}` → `{result:true,data:{expiresAt}}` |
| POST `/rooms/join` | 配对 proof；body tokenHash | `{roomId,tokenHash,proof}` → expiresAt |
| POST `/rooms/:roomId/events` | role token | `{signal}` → seq；同角色/代际 SDP 幂等，异内容冲突 409 |
| GET `/rooms/:roomId/events?after=seq` | role token | `{events:[{seq,role,payload}]}`；每页最多 32，含本端事件 |
| POST `/rooms/:roomId/heartbeat` | role token | 续 paired 房间租约至最多当前时间+10分钟，不超过最大 2 小时 |
| POST `/rooms/:roomId/ice-config` | role token | `{iceServers:[...]}`，未配置 TURN 时为 STUN |
| POST `/rooms/:roomId/close` | role token | 关闭房间，删除信令；再次访问已关闭房间返回 404 |

错误统一 `{result:false,msg}` 和对应 HTTP status。创建/加入/发布/ICE 有 IP 限流，请求 JSON 最大 64 KiB，SDP 最大 48,000 字符。D1 原子更新完成接收角色占用。

## SDP 认证

`Signal = {version:1, roomId,generation,nonce,role,type,sdp,mac}`。

- generation 为 1～8；发送方 offer、接收方 answer。每代重新建立 PeerConnection。
- 完整 ICE gathering 后发布 SDP（上限 60 秒）；候选随 SDP 传递，无独立 candidate API。
- signal key 由 HKDF(code, zero salt, `gy-rtc/v1/signal/<roomId>`) 派生。
- MAC 字节为 UTF-8 JSON 数组 `[version,roomId,generation,nonce,role,type,sdp]` 的固定字段顺序。
- 对端先验证 MAC、房间及代际，再调用 setRemoteDescription；更改 SDP/指纹/代际/角色会失败。
- 信令每 1.5 秒轮询，心跳每 30 秒；网络请求最多重试 3 次，房间失效和权限失败不自动重试。

## 文件信封与块

每个文件随机独立 AES-256-GCM key，配对 HKDF key 只包裹随机文件 key。salt 16 字节、wrap/meta IV 各 12 字节。文件名、大小、MIME、chunk count、noncePrefix 在 manifest 中加密。

- 文件限制 1 GiB，块大小 1 MiB；0 B 文件也有一个认证空块。
- nonce = 8 字节随机 prefix + uint32_be chunk index。
- AAD = JSON `["gy-rtc/v1/chunk",transferId,index,chunks,size,chunkSize]`。
- 密文含 16 字节 GCM tag。重传同一不可变 File 的同一块产生相同密文，不改变内容或 key。
- 每个 DataChannel frame 至多 16 KiB：uint32_be index/offset/total 的 12 字节头 + payload。
- 接收端校验块序号、精确 offset、密文总长，最多保留一个块；Worker 校验解密后写文件，再 ACK。

## DataChannel 控制消息

可靠、有序 channel `file`。控制消息为 JSON 字符串；帧为 ArrayBuffer。

1. sender channel open → `hello {envelope}`。
2. receiver 解信封，显示文件信息；用户点击按钮触发保存 picker。选择成功后 → `ready {nextChunk}`。
3. sender 从 nextChunk 发送逐块 frames，等待 `ack {index}` 后继续。发送缓冲区超过 1 MiB 时等待；阈值 256 KiB。
4. 全部块 ACK 后 sender → `complete`。
5. receiver 核对已提交块数和总字节数，关闭文件写入流或生成 Blob URL → `saved`。
6. sender 收到 saved 才显示成功并关闭房间。Blob 模式 receiver 需要用户点下载；saved 表示字节准备完毕，不声称用户已经完成下载。

控制消息 `cancel/error` 停止双方；无效帧/密文认证失败会中止并清理。

## 断线、保存与结束

- sender 最多 8 代连接；receiver 保留同一个 sink、文件身份、nextChunk，丢弃部分块。
- 新 hello 必须携带原文件信封。receiver 回报已写入的位置，包括已写入但 ACK 丢失的块。
- 接收消息通过 Promise 队列串行处理；重连 hello 排在旧写入之后，防止重复写/越序写。
- 最终 saved 丢失时，receiver 保留已完成结果最多两分钟，重连后幂等响应 complete，不重新写文件。
- 用户取消 picker 时保持会话可再选；不会静默改用 Blob。
- 无 File System Access：移动端 32 MiB、桌面 100 MiB 的内存上限。Blob URL 在再次开始/离页时 revoke。
- 取消/卸载 abort 请求，关闭通道和 PC、停止 Worker，在接收队列结束后 abort sink，尽力关闭服务端房间。TTL 处理未能送达的关闭。
- 页面刷新后不保留 key/token/续传状态；必须重新配对。
