ALTER TABLE users ADD COLUMN passkeyUserId TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_passkeyUserId
  ON users(passkeyUserId);
