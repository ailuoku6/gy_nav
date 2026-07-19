CREATE TABLE IF NOT EXISTS passkey_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  credentialId TEXT UNIQUE NOT NULL,
  publicKey TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  deviceType TEXT,
  backedUp INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_userId
  ON passkey_credentials(userId);

CREATE TABLE IF NOT EXISTS passkey_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge_type
  ON passkey_challenges(challenge, type);
