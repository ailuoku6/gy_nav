# 纯 WebRTC 端对端加密文件传输方案

日期：2026-10-02。用户已决定只使用 WebRTC。本轮仅设计，不改业务代码或部署。

## 1. 范围

- 文件通过 RTCDataChannel 从发送浏览器实时传到接收浏览器，不写 R2、不写服务端磁盘、不通过普通 HTTP/WebSocket 中转文件。
- 服务端只存短期信令：房间、offer/answer、ICE candidates、角色能力凭据和期限。两端必须同时在线，关闭发送页面后无法稍后领取。
- WebRTC 使用 ICE 选择连接路径，推荐 STUN + TURN 兜底。TURN 是 WebRTC 加密包中继，不是文件存储；“只用 WebRTC”本身不等于禁止 TURN。
- 若严格要求文件字节不经过任何服务器，则禁用 TURN，但 NAT/防火墙不允许直连时只能失败。当前推荐保留 TURN，是否强制直连未获用户确认。
- 同页面断线可重建 PeerConnection 并从接收方已校验块恢复。刷新页面恢复、大文件跨会话恢复暂不承诺。

## 2. 项目架构

```text
React 发送端 <-- 小量 HTTPS 信令 --> Pages/Hono <-- 小量 HTTPS 信令 --> React 接收端
      \------------- RTCDataChannel，直连或 TURN 中继 -------------/
```

首版复用 Hono + D1 做短期信令轮询。每个房间最多两个角色、每角色一个在用连接；加角色 token、event cursor、generation 隔离重复页面和旧连接事件。

配对阶段 1 秒轮询，连接后退避到 5 秒心跳；终态停止。通过请求时过期检查与限量删除过期行完成逻辑清理，不增加 R2 bucket/file tables。持续物理清理按实际需要部署小型 Cron Worker，清理对象仅为信令记录。

规模增长时可迁移 Durable Object WebSocket 信令；首版无需为实时文件数据引入 DO。平台资源依然有独立请求/数据库配额，WebRTC 不代表整个应用免费。

## 3. 建议默认值

| 参数 | 建议 |
| --- | --- |
| 配对码 | 浏览器生成 26 个均匀 Base32 字符，约 130 bit |
| 等待加入窗口 | 创建后 10 分钟 |
| 已配对会话 | 活跃时续期；最长 2 小时 |
| 断线保留 | 2 分钟重连窗口，超过后终止 |
| 文件 | 单文件，初始上限 1 GiB，可配置 |
| 加密块 | 1 MiB，AES-GCM 每块独立认证 |
| RTC frame | min(16 KiB, 协商 maxMessageSize)，包含 framing header |
| 未 ACK 块窗口 | 最多 2 块，足够发完完整块再等 ACK |
| DataChannel 队列 | 高水位 1 MiB，低水位 256 KiB |
| 保存 | 能力探测后流式写文件；Blob fallback 限 100 MiB，移动端建议 32 MiB并实测 |

0 字节文件同样发送一个含 GCM tag 的空块。即使前端允许 1 GiB，不支持流式落盘的接收浏览器也不能因此自动支持该大小。

## 4. 配对、安全与密钥绑定

保留独立的长随机配对码 C，不将 C 发给服务器。roomId=SHA256(域标签 || C)，只能定位房间，不能用于解密。信令 room token 仅授权发布/读取事件，不代替文件加密或对端认证。

从 C 使用 HKDF-SHA256 分域派生 `signalingKey` 和 `wrapKey`。SDP offer/answer 带 MAC，认证内容包括 version、roomId、generation、双方随机 nonce、角色和精确 SDP bytes（包含 DTLS fingerprint）。ICE candidates 也按 generation/event id MAC。接收方验 MAC 后才能 setRemoteDescription，拒绝篡改或重放旧 generation。

浏览器可通过房间检索获取公共 salt，但配对码保持足够高熵；所有 KDF info/端序/认证字段在协议固定。不接受用户自定义弱口令。6～8 位短数字码必须另做经审查的 PAKE，不能直接哈希短码用于 MAC/AEAD。

发送端每个文件随机生成 256 bit fileKey、fileId 和 noncePrefix；用 wrapKey 加密包裹 fileKey，并用派生 metaKey 加密 manifest。manifest 包含 name、mime、plainSize、chunkSize、totalChunks、transferId、fileId、noncePrefix。只经 DataChannel 发送加密信封，信令服务不存信封或文件名。

DATA 块 AES-GCM nonce=`noncePrefix(8 bytes) || uint32_be(index)`，AAD 固定绑定 version/transferId/fileId/index/totalChunks/plainSize/chunkSize，tag 128 bit。HKDF/AAD/MAC 二进制编码和测试向量必须在编码前固定；具体字段见协议。

重传只能使用相同 fileKey/nonce 对应的相同密文。首次加密后的未确认块在内存缓存；已确认块无需重传。改变文件、丢失加密上下文、重选文件或刷新页面时新建传输和密钥，避免同 nonce 加密不同明文。

RTCDataChannel 自身的 DTLS 提供传输加密；应用层认证信令、包裹密钥和块 AEAD 提供配对码身份绑定与内容认证。服务器可观察 IP/时序及连接元数据，也可拒绝服务，但不能仅凭信令 token 推导 fileKey。仍不能抵抗恶意前端发布、XSS、配对码泄露或接收者复制已下载内容。

## 5. 完整流程

1. 发送方选文件，探测发送能力并登录（首版建议复用应用 JWT），生成代码和短期房间；页面显示等待接收方。
2. 接收方输入代码，通过 roomId 定位房间，取得独立角色 token；双方验证带 MAC 的 SDP/ICE。
3. ICE 连接，建立 ordered/reliable DataChannel；连接状态显示“直连”或“中继”，不要把中继称为直连。
4. 发送端 HELLO 发送加密信封；接收端本地解密并校验 manifest，选择保存位置，ACCEPT 后才发文件块。
5. Web Worker 分块加密；密文拆为小 frame，bounded window 发出。接收端有界重组、AEAD 校验、按序写入后 ACK。
6. 全部块通过且总字节数一致，接收端关闭可写流成功后 COMPLETE；Blob fallback 仅表示浏览器发起下载，不能证明操作系统已保存。
7. 收到 COMPLETE 后清理浏览器密钥引用和缓存、关闭连接/房间。JS 运行时不保证物理内存擦除，文案只说释放引用。

## 6. 流控、恢复和取消

frame 水位与 chunk ACK 窗口分别控制。不能将一个 1 MiB 加密块塞成单个 RTC 消息，也不能将窗口缩到不足发完一个块造成死锁。

ordered/reliable channel 用于可靠传输；ACK 表示应用层已验证并写入，不只是网络已接收。checksum 可用密文 SHA-256 排查传输一致性，但安全以 GCM tag 和已认证 manifest 为准。每 frame 拒绝越界 offset、过长 payload、冲突 chunk 和超过两个块的重组占用。

失联时停止读新文件块并保留最多两个未 ACK 密文块。同页面重连 generation++，更换 SDP nonce，重新验证信令。接收端发送绑定 manifest hash 的 RESUME(lastCommittedIndex)。发送端只接受缓存窗口内可解释的状态；状态分歧直接终止，不跳过未校验块。重复已提交 index 只回 ACK，不重复写文件。

取消立即停止读文件、abort 临时输出、关闭 DataChannel/PeerConnection 和信令房间。移动端后台/锁屏可能暂停浏览器；显示断线/重连状态，不承诺后台持续传输。

## 7. 后端与部署

- create / sender role：应用 JWT + 房间归属；receiver join：roomId 定位 + 原子唯一角色占用；对端身份由代码派生 MAC 认证。
- role tokens：随机 256 bit bearer，D1 只存 hash；token 进 header，不进 URL。房间加入响应丢失时使用客户端 joinRequestId 幂等恢复，凭据安全返回策略在实现前固定。
- 临时表仅 `rtc_rooms` / `rtc_events`，记录 generation、角色、token hashes、expiresAt、event ids。SDP/candidates 有大小和条数限制，TTL 删除；任何请求先校验过期。
- 信令 64 KiB/event，候选最多 128/角色/generation；原子 event序号和 room CAS 防并发占用。create/join/post 有频率和总量配额。
- TURN 长期凭据仅服务端 secret；浏览器获得短期凭据，期限/房间人数/成本控制，禁用匿名无限申请，账户可达性实测。
- 不复用全局 axios 的响应日志与自动跳转；接收页面匿名访问，传输 API 使用独立 fetch。

## 8. 实施与验收

1. 固定加密/信令 MAC/framing 测试向量，验证 nonce/错误码/重放防护。
2. Hono 信令 + D1 短期 schema/幂等角色占用 + STUN/TURN 配置。
3. React /transfer 页面与 FeaturePanel 入口，RtcTransport、crypto Worker、saveAdapter、状态机。
4. 两端不同网络 E2E：局域网/蜂窝/家宽/公司网络；强制 relay 验证 TURN；禁用 relay 验证失败提示。

文件测试 0、1、B-1、B、B+1、100 MiB、1 GiB，主流桌面/移动浏览器按能力验收。测慢接收端/水位、断线/重复 ACK、保存权限拒绝、SDP MAC 篡改、旧 generation 注入、连接中取消以及前端响应日志。验证所有 WebSocket/HTTP 请求只有信令，没有密文文件块。

后端不创建 bucket、文件表、文件清理 Worker；旧 R2 文档仅保留历史。实施前核对当前 Workers/D1/TURN 账户配额与浏览器 API，实现后通过真实网络验收。

## 2026-10-02 实现补充（优先于上方草案）

已实施 React 页面 + `rtcTransfer.ts` 会话状态机，复用 Pages/Hono/D1 做 1.5 秒轮询信令，不新增 Durable Object/Worker 服务。具体字段、JSON 数组 MAC、完整 SDP gathering、capability 幂等领取、逐块组装/ACK、8 代恢复、最终 saved 恢复均以 `webrtc-protocol.md` 和源码为准。接收使用用户点击触发保存 picker，未选择时不发 ready；取消 picker 可重试，不自动 fallback。Blob 模式显示下载按钮，发送完成文案仅保证对端已确认全部数据，避免声称用户已经下载。新增运行/部署说明 `docs/file-transfer.md`。

已验证本地真实双 Chrome 上下文（9 个场景）以及 43 项单元/API 测试。未部署远程：2026-10-02 `wrangler whoami` 返回 Not logged in。暂无 TURN key secret，两台设备跨网络/TURN relay/Safari 真机验收待完成。TURN 变量为 `RTC_TURN_KEY_ID`、`RTC_TURN_KEY_SECRET`，后者必须为 TURN key secret，不是通用账户 API token。
