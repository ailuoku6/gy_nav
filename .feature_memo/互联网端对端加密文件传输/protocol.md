# 接口、状态与存储契约草案 v1

> 历史协议：用户已选择纯 WebRTC。本文件的文件存储 API/SQL 不再实施，当前协议见 `webrtc-protocol.md`。

日期：2026-10-02。配套架构见 [tech.md](tech.md)。此文件为设计契约，SQL 未在实际数据库执行。

## 1. 公共约定

- base path：`/api/transfers`；参数均用 JSON，二进制块使用 application/octet-stream。
- 成功：`{result:true,data:...}`；失败：`{result:false,code:"...",msg:"...",retryable:false}`。
- transferId 是客户端随机 UUID，服务端校验唯一性；fileId 是 16 字节 Base64URL。index 从 0 开始，chunkSize 固定为 8 MiB。
- locator/authVerifier/cipherHash 传输时使用 64 字符小写 hex；其他二进制字段采用无 padding Base64URL。
- 时间持久化为 UTC Unix 毫秒，API 输出 ISO 8601。SQL 不混用 CURRENT_TIMESTAMP 字符串和 ISO 字符串比较有效期。
- 响应和受保护下载统一 Cache-Control: no-store；所有能力字段从日志/追踪中删除。
- 服务端限制 version=1，不从客户端参数选择加密算法。信封 JSON 最大 64 KiB。

## 2. API 表

| 方法/路径 | 权限 | 请求/响应要点 |
| --- | --- | --- |
| POST `/` | 应用 JWT | 创建会话、预留配额；客户端 transferId 作为创建幂等键 |
| POST `/:id/envelope` | sender JWT | 创建后提交并冻结信封，必须先于块上传 |
| GET `/:id/status` | sender JWT | 状态与 ready 块序号；无密钥和领取凭据 |
| PUT `/:id/chunks/:index` | sender JWT | 密文 binary，Content-Length 与 X-Cipher-SHA256；幂等返回 ready |
| POST `/:id/complete` | sender JWT | 原子校验块数量/尺寸后发布；幂等 |
| POST `/open` | 匿名 + 限流 | `{locator}`；返回 transferId/envelope，不占领取名额 |
| POST `/:id/claim` | authSecret | `{authSecret,claimId}`；本地成功解密后取得接收租约 |
| GET `/:id/chunks/:index` | receive token | 返回单个完整密文块；首版不支持任意 Range |
| POST `/:id/renew` | receive token | 延长 token 和空闲租约，受传输 TTL 限制 |
| POST `/:id/ack` | receive token | 本地验证/交付成功后 consumed；幂等 |
| POST `/:id/revoke` | sender JWT | 立即禁止新读写，并排入后台清理 |

open/claim/renew/ack 虽免应用登录，但各自有独立鉴权。建议注册子路由并显式 middleware；现有全局 JWT 中间件只对经过审计的传输路由交给子路由处理，不能单纯跳过整个前缀。

### 创建请求

```json
{
  "version": 1,
  "transferId": "uuid",
  "fileId": "base64url-16-bytes",
  "locator": "64-char-hex",
  "authVerifier": "64-char-hex",
  "plainSize": 10000000,
  "chunkSize": 8388608,
  "totalChunks": 2
}
```

信封提交请求（获得服务端 expiresAt 并加密 manifest 后）：

```json
{
  "envelope": {
    "version": 1,
    "salt": "base64url-16-bytes",
    "wrapIv": "base64url-12-bytes",
    "wrappedFileKey": "base64url-48-bytes",
    "manifestIv": "base64url-12-bytes",
    "encryptedManifest": "base64url"
  }
}
```

服务端核对 `totalChunks=max(1,ceil(plainSize/chunkSize))`，固定应用上限，不接收客户端指定无限 TTL。创建响应返回 transferId、服务器计算的 expiresAt、uploadDeadline、并发建议和实际上限。

manifest 的 expiresAt 必须与服务端到期时间匹配。首版采用两阶段契约：

1. POST create 不含 envelope，返回服务端 expiresAt。
2. POST `/:id/envelope`（sender JWT）提交固定信封；重复同一信封成功，冲突拒绝；上传接口只允许 envelope 已冻结的会话。

create 请求的 id/fileId/locator/authVerifier/尺寸在创建后全部不可变。重复 create 必须同 sender 且参数相同，不重复预留配额。

### open / claim

open 仅对未失效、可接收会话返回 `{transferId,envelope,expiresAt}`；服务端不返回明文文件名。接收端解密 manifest 后核对其 transferId、expiresAt 与响应一致。open 失败统一 `TRANSFER_UNAVAILABLE`。

claim 在恒定时间比较 SHA256(authSecret) 与 verifier 后，用条件批处理取得接收租约。错误证明与不可用会话统一失败；不要在限流前执行大量密码运算。

```json
{
  "result": true,
  "data": {
    "claimId": "random-128-bit-id",
    "receiveToken": "opaque-capability",
    "tokenExpiresAt": "ISO-8601",
    "leaseExpiresAt": "ISO-8601"
  }
}
```

为处理 claim 回包丢失，receiveToken 可以由独立服务端 secret 使用 HMAC-SHA256 稳定派生：输入固定域标签、transferId 原始 bytes、claimId 原始 bytes。claim row 存 token hash 和 keyVersion；同一 claimId 重试得到相同 token。服务端该 secret 只用于 API 鉴权，不参与文件加密。必须固定字段编码，避免字符串拼接歧义。

该幂等恢复仅适用于仍 active 的 claim。已经 released 的 claimId 不重新激活；客户端收到租约失效后生成新 claimId，旧 token 始终无效。避免把过期接收凭据恢复成新会话。

token 有效期和租约在 D1 检查，renew 延长到 min(now+15min,session TTL)；租约空闲期限 min(now+30min,session TTL)。即使 token 正确，revoked/expired/consumed 会话仍拒绝下载。secret 轮换需保留存量会话用的旧 keyVersion 至全部失效。ack 的幂等路径例外：相同有效凭据、claimId 已 ack 且会话 consumed 时仅返回原成功，不提供下载/续期权限。

### 错误与响应

- 400 BAD_REQUEST：格式、索引、version 或尺寸错误。
- 401 AUTH_REQUIRED：应用 JWT/receive token 缺失或无效；接收页面不自动跳应用登录。
- 404 TRANSFER_UNAVAILABLE：open/claim 的统一不可用响应。
- 409 TRANSFER_BUSY / CHUNK_CONFLICT：接收租约冲突或同块不一致；不重试覆盖。
- 410 TRANSFER_EXPIRED：已鉴权的发送/接收会话到期。
- 413 LIMIT_EXCEEDED：实际 body/文件/配额超限。
- 429 RATE_LIMITED：返回 Retry-After。
- 503 STORAGE_RETRY：R2/D1 暂时失败，可按幂等请求重试。

## 3. 状态机

```text
uploading --freeze envelope / upload chunks--> uploading
uploading --complete all chunks--------------> ready
ready     --claim----------------------------> receiving
receiving --renew / same claim retry----------> receiving
receiving --lease expiry----------------------> ready
receiving --ack-------------------------------> consumed
uploading/ready/receiving --revoke-------------> revoked
uploading/ready/receiving --TTL----------------> expired
uploading --fatal failure---------------------> failed
consumed/revoked/expired/failed --cleanup------> tombstone --retention--> deleted
```

TTL 和租约检查均在服务端进行。下载可能在 revoke 前已经进入响应流；撤销保证后续新请求被拒绝，不能撤回已经发送的字节。

complete 检查：信封已提交、块索引全部存在、所有块 ready、每块尺寸符合预期、sum(cipher_size)=plainSize+16*N。分片重试不改变会话的有效期。

ack 表示接收会话成功交付，不证明操作系统永久保存；清理之后接收者仍可持有明文副本。失败租约可以重新开放，产品不能把这个描述为无法复制的一次性文件。

## 4. D1 SQL 草案

```sql
CREATE TABLE file_transfers (
  id TEXT PRIMARY KEY,
  sender_user_id INTEGER NOT NULL,
  protocol_version INTEGER NOT NULL CHECK (protocol_version = 1),
  file_id TEXT NOT NULL,
  locator TEXT NOT NULL UNIQUE,
  auth_verifier TEXT NOT NULL,
  plain_size INTEGER NOT NULL CHECK (plain_size >= 0),
  cipher_size INTEGER NOT NULL CHECK (cipher_size >= 16),
  chunk_size INTEGER NOT NULL CHECK (chunk_size = 8388608),
  total_chunks INTEGER NOT NULL CHECK (total_chunks >= 1),
  envelope_json TEXT,
  envelope_hash TEXT,
  state TEXT NOT NULL CHECK (state IN (
    'uploading','ready','receiving','consumed','revoked','expired','failed'
  )),
  live_claim_id TEXT,
  consumed_at_ms INTEGER,
  upload_deadline_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  cleanup_after_ms INTEGER,
  cleanup_cursor TEXT,
  cleanup_attempts INTEGER NOT NULL DEFAULT 0,
  cleanup_completed_at_ms INTEGER,
  tombstone_until_ms INTEGER
);
CREATE INDEX idx_transfer_expiry ON file_transfers(state, expires_at_ms);
CREATE INDEX idx_transfer_gc ON file_transfers(cleanup_after_ms);
CREATE INDEX idx_transfer_sender ON file_transfers(sender_user_id, state);

CREATE TABLE file_transfer_chunks (
  transfer_id TEXT NOT NULL REFERENCES file_transfers(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  cipher_size INTEGER NOT NULL CHECK (cipher_size >= 16),
  cipher_sha256 TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('pending','ready')),
  etag TEXT,
  updated_at_ms INTEGER NOT NULL,
  PRIMARY KEY (transfer_id, chunk_index)
);

CREATE TABLE file_transfer_claims (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL REFERENCES file_transfers(id) ON DELETE CASCADE,
  token_sha256 TEXT NOT NULL UNIQUE,
  token_key_version INTEGER NOT NULL,
  token_expires_at_ms INTEGER NOT NULL,
  lease_expires_at_ms INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active','released','acked')),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_transfer_one_active_claim
  ON file_transfer_claims(transfer_id) WHERE state = 'active';

CREATE TABLE file_transfer_quotas (
  sender_user_id INTEGER PRIMARY KEY,
  active_count INTEGER NOT NULL DEFAULT 0 CHECK (active_count >= 0),
  reserved_bytes INTEGER NOT NULL DEFAULT 0 CHECK (reserved_bytes >= 0),
  window_start_ms INTEGER NOT NULL,
  window_create_count INTEGER NOT NULL DEFAULT 0
);
```

大小上限和 chunk_index < total_chunks 由接口与条件 SQL 联合校验；跨表动态约束不能仅靠上面的 CHECK 完成。schema 为设计草案，迁移前需确定实际 users 主键/删除语义与 D1 transaction batch 支持。

建议用 DB.batch 的事务语义执行相关 SQL，所有步骤带明确条件/唯一约束并检查 affected rows。条件 UPDATE 影响 0 行本身不会使 batch 回滚：实施时要在 batch 内通过约束断言使必需前置步骤失败时整个事务失败，例如专用 operation guard 表的 CHECK(success=1) 配合紧邻前一语句的 changes()，完成后在同一 batch 删除 guard。不能仅在 batch 完成后检查 0 行并声称其他写入已回滚。不得保持跨 R2 网络请求的数据库事务。关键规则：

1. create：初始化 quota row；条件预留配额；只有预留成立才插入 session，失败通过约束/rollback 避免“预留但未插入”。同 ID 幂等分支先确认既有会话，不重复计数。
2. upload：条件 INSERT pending WHERE session uploading、envelope 已冻结、期限未到；冲突仅允许同 hash/大小。先读 body 实际 hash，再写 R2；只有 R2 完成才把 pending 改 ready。
3. complete：UPDATE uploading→ready WHERE 计数/ready数/尺寸之和符合预期、envelope 非空且期限有效；失败不发布半文件。
4. claim：batch 内释放已过期的 active claim，再条件占用 session；只有占用属于本 claimId 才 INSERT claim。部分唯一索引兜底并发；冲突回滚后读既有同 ID 验证幂等，不把别人的会话返回。
5. ack：条件 active→acked 和 receiving→consumed 必须同时发生；重复 ack 返回原成功结果，不再次释放 quota。
6. cleaner：quota 只在确认对象删除且首次设置 cleanup_completed_at_ms 时释放一次，直到那时占用存储预算。

实施时针对这些 batch 写并发集成测试；不把“SQLite 支持事务”误写为 R2/D1 共同事务。

## 5. 失败补偿矩阵

| 失败位置 | 持久状态 | 恢复方式 |
| --- | --- | --- |
| 创建响应丢失 | 会话与 quota 已提交 | 相同 transferId/参数重试返回原会话 |
| pending 成功，R2 失败 | pending row，无对象 | 同 hash PUT 重试 |
| R2 成功，ready 更新失败 | pending row，有对象 | HEAD 校验后修复 ready |
| 相同块并发 PUT | 固定 key + 条件写入 | 胜者提交；败者仅核对，不覆盖 |
| complete 回包丢失 | 已 ready | 再次 complete 返回原成功 |
| claim 回包丢失 | 已 active | 同 claimId/authSecret 返回稳定 token |
| 下载连接断开 | active lease | 重试该块，保持会话；必要时 renew |
| cleaner 删除部分对象失败 | revoked/expired/consumed，gc pending | 保存 cursor/backoff，继续删 |
| cleaner 后出现晚到 PUT | tombstone + 可能孤儿块 | 延迟二次 sweep + R2 生命周期 |

## 6. Binding 与资源配置

Pages：现有 DB，新增 `FILE_TRANSFER_BUCKET: R2Bucket` 与 `TransferReceiveTokenSecret`/token keyVersion/config 上限。R2 preview 与 production 使用独立私有 bucket；D1 已有 preview/production 分离，迁移也分别执行。

Cleanup Worker：独立 wrangler 配置和 scheduled handler，同环境 DB/R2 bindings 与每 5 分钟 Cron。不公开清理接口，不使用前端请求替代定时清理。

后续直传版本：S3 bucket 级最小权限凭据只放 Worker secret；预签名 URL 是可重放 bearer 能力，短 TTL 与 CORS 均不能防止 URL 持有者写入。需要不可变提交/对象版本核对并测试撤销，不能只替换上传 URL 后认为安全模型相同。

## 7. 协议演进

v1 对代码字母表、域标签、二进制端序、IV/AAD、字段尺寸和 HKDF info 固定。未知 version 拒绝，不自动换算法。每次新上传随机密钥；多文件扩展每文件独立 fileKey/fileId，不能共享 nonce 序列。

未来 multipart 单对象版必须在 manifest 加入容器版本和密文偏移；短 PIN/PAKE 用不同协议版本；断点持久化需增加本地状态认证与密钥存储决策。

## 8. WebRTC 直连接口补充

WebRTC 模式不使用 R2 chunk API，新增短期信令接口：

| 方法/路径 | 权限 | 用途 |
| --- | --- | --- |
| POST `/rtc/rooms` | sender JWT 或匿名配额 | 创建 room，返回 roomId、sender token、expiresAt |
| POST `/rtc/rooms/:id/join` | 配对码证明 | 加入 room，返回 receiver token；错误统一 room unavailable |
| POST `/rtc/rooms/:id/offer` | sender token | 写入一次 SDP offer |
| POST `/rtc/rooms/:id/answer` | receiver token | 写入一次 SDP answer |
| POST `/rtc/rooms/:id/candidates` | room token | 交换 ICE candidates，限制数量/大小 |
| GET `/rtc/rooms/:id/events` | room token | SSE/短轮询读取对端信令事件 |
| POST `/rtc/rooms/:id/close` | room token | 关闭房间并删除信令材料 |

推荐先用 SSE/短轮询验证协议，稳定后再引入 Durable Object WebSocket。signaling API 只能返回 SDP/ICE 和状态，不转发文件。房间材料必须设置短 TTL；日志只记录 room 的脱敏 hash 和 reason code。

WebRTC DataChannel 应用层消息：

```text
HELLO {version, transferId, fileId, envelope, chunkSize, totalChunks}
ACCEPT {transferId, receiverCapabilities}
DATA {index, cipherSize, cipherSha256, cipherBytes}
ACK {index}
NACK {index, reason}
PROGRESS {lastContiguousIndex, bufferedAmount}
COMPLETE {verifiedChunks, plainSize}
CANCEL {reason}
```

对 `DATA` 的 index/长度/哈希采用固定二进制 framing，不把每个块 JSON + Base64，以免产生约 33% 编码膨胀。单条消息上限同时受协商 maxMessageSize 和兼容性测试限制，首版建议不超过 16 KiB/frame（含 header），再由应用层有界聚合为约 8 MiB 密文 chunk。
