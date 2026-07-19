# Passkey 表迁移说明

Passkey 需要两类数据库变更：

- `passkeys.sql`: 创建 `passkey_credentials`、`passkey_challenges` 以及对应索引，可重复执行。
- `passkeys_user_column.sql`: 给 `users` 增加 `passkeyUserId` 并创建唯一索引，只能在每个 D1 数据库执行一次。

## 推荐执行顺序

先执行可重复的表结构 SQL：

```bash
wrangler d1 execute DB --env=preview --file=./lib/hono/SQL/passkeys.sql
wrangler d1 execute DB --env=production --file=./lib/hono/SQL/passkeys.sql
```

再执行一次用户字段 SQL：

```bash
wrangler d1 execute DB --env=preview --file=./lib/hono/SQL/passkeys_user_column.sql
wrangler d1 execute DB --env=production --file=./lib/hono/SQL/passkeys_user_column.sql
```

如果 `passkeys_user_column.sql` 报 `duplicate column name: passkeyUserId`，说明这个数据库已经加过字段，不需要重复执行。

## 检查状态

可在 D1 控制台或 Wrangler 中执行：

```bash
wrangler d1 execute DB --env=preview --command="PRAGMA table_info(users);"
wrangler d1 execute DB --env=preview --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'passkey_%';"
```

应该能看到：

- `users` 表包含 `passkeyUserId`
- 存在 `passkey_credentials`
- 存在 `passkey_challenges`

本地调试如果使用 Wrangler 本地 D1，将 `--env=preview` 换成 `--local` 或按当前启动方式执行即可。
