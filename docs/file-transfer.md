# WebRTC 文件传输：使用、运行与上线

## 使用

入口为首页工具面板的「传输文件」，或 `/transfer`。

1. 发送方先登录，选一个文件，点击「生成配对码并发送」。
2. 将 26 位随机配对码通过可信渠道交给接收方。
3. 接收方打开同一站点的 `/transfer`，切换到「接收」，输入配对码加入。
4. 加密连接建立后，接收方确认文件信息，点击「选择保存位置并接收」或「确认接收文件」。
5. 支持 File System Access 的浏览器直接流式写文件；其余浏览器接收完成后点击「下载文件」。

双方需要同时在线并保持页面打开。同一页面断线后最多重建 8 代连接，从接收方已写入的块继续；刷新页面不能恢复会话。取消会关闭连接、停止 Worker、终止未完成的写入并关闭信令房间。

当前限制：单文件 1 GiB；内存保存模式桌面最多 100 MiB、移动端最多 32 MiB。配对等待期限 10 分钟，配对后的活动租约通过心跳续期，整个会话最长 2 小时。

## 数据路径

- 文件仅通过 WebRTC DataChannel 传输，额外使用 AES-256-GCM 加密与认证。
- 文件密钥、配对码和续传进度仅在浏览器内存中保存。
- 服务端 D1 只保存房间 capability 的 SHA-256、接收证明的 SHA-256 和短期 SDP 信令。
- SDP 包括 DTLS 指纹，由从配对码派生的 HMAC 密钥认证。
- 不使用 R2、服务端文件上传或服务端文件缓存。
- 默认 STUN 尝试互联网直连。受限 NAT/防火墙可能无法直连；可选 TURN 仍使用 WebRTC，仅转发加密流量，不提供文件存储。

## 本地运行

使用 Node.js 22.13+（SQLite API 测试需要），建议项目当前使用的 Node.js 24；安装 pnpm 锁定的依赖。

```bash
pnpm install
npm run rtc:db:local
npm run rtc:dev
```

本地地址 `http://127.0.0.1:8789/transfer`。`rtc:dev` 的 JWT secret 仅供本地测试；正常网页登录还需要既有用户表及既有登录功能环境变量。下面的 E2E 脚本使用仅适用于本地数据库的测试 JWT，不依赖创建真实用户。

本地 HTTP 的 localhost 属于安全上下文；公网必须 HTTPS。

## 验证

```bash
npm run build
npm test -- --run
npm exec eslint -- src/pages/FileTransfer.tsx src/utils/rtc*.ts src/workers/rtc-transfer.worker.ts lib/hono/service/rtcService.ts lib/hono/service/rtcService.test.ts
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types @cloudflare/workers-types lib/hono/index.ts lib/hono/service/rtcService.ts
git diff --check
```

双浏览器验证需要本机 Chrome，先启动上面的本地服务，然后：

```bash
RTC_E2E_HOST_ONLY=1 npm run test:rtc:e2e
```

`RTC_E2E_HOST_ONLY=1` 仅在测试脚本中将 ICE 配置替换为本机候选，加快本地验证；生产代码没有该开关。去掉该环境变量可使用服务端提供的 STUN/TURN 配置。没有 Chrome 时，执行 `pnpm exec playwright install chromium` 后用 `RTC_BROWSER_CHANNEL=chromium` 运行。

测试覆盖：0 B、1 KiB、1 MiB、1 MiB+1 B、4 MiB+1 B 的实际下载及 SHA-256 比对，丢失块 ACK 后断线续传、丢失最终保存确认后恢复、篡改密文拒绝保存、原生保存对话框取消和对端取消、无效配对码。

## 云端准备

代码尚未部署，远程数据库尚未执行此 schema。本地验证不能替代两台设备不同网络的验收。

### D1

`rtc.sql` 只新增 `rtc_*_v1` 表和索引，重复执行安全。按目标环境执行：

```bash
pnpm exec wrangler d1 execute DB --env preview --remote --file lib/hono/SQL/rtc.sql
pnpm exec wrangler d1 execute DB --env production --remote --file lib/hono/SQL/rtc.sql
```

随后通过现有 Pages 部署流程发布前端和 Functions。发送方沿用应用既有 `TokenSecret`；不需要新文件存储 binding。

### 可选 TURN

不配置 TURN 时，接口返回 STUN，能穿透的网络直接通信。若需要覆盖对称 NAT、蜂窝或公司网络，在 Cloudflare Realtime TURN 创建 key，在 Pages 对应环境配置：

- `RTC_TURN_KEY_ID`：TURN key 的 ID。
- `RTC_TURN_KEY_SECRET`：该 TURN key 的 secret；不是通用 Cloudflare 账户 API token。

后端生成 2 小时临时 ICE 凭据；secret 不返回浏览器。已兼容 provider 的单对象/数组形状，并过滤浏览器不接受的 53 端口。配置了 TURN 但服务异常时显示错误，避免静默降级掩盖配置故障。

### 跨网络验收

发布 preview 后，两台设备分别使用家庭宽带/手机蜂窝网络验证发送、接收、保存、取消、短暂断网及恢复。再测试公司网络和配置 TURN 后的中继路径。Safari/移动浏览器的保存限制需要在真机确认。

当前已验证本地两个独立 Chrome 上下文的真实 DataChannel、Worker 加解密、D1 信令和下载内容。尚未宣称跨运营商连接或真实 TURN 中继验收通过。
