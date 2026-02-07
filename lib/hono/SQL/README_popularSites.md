# popularSites 表迁移说明

新增 popularSites 表后，需要在 D1 数据库中执行以下 SQL 创建表：

```bash
# 开发/预览环境
wrangler d1 execute DB --env=preview --file=./lib/hono/SQL/popularSites.sql

# 生产环境
wrangler d1 execute DB --env=production --file=./lib/hono/SQL/popularSites.sql
```

或直接在 D1 控制台执行 `popularSites.sql` 中的 SQL。
