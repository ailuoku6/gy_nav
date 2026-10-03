CREATE TABLE IF NOT EXISTS rtc_rooms_v1 (
  id TEXT PRIMARY KEY,
  sender_user_id INTEGER NOT NULL,
  sender_token_hash TEXT NOT NULL,
  receiver_verifier TEXT NOT NULL,
  receiver_token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  expires_at_ms INTEGER NOT NULL,
  max_expires_at_ms INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rtc_signals_v1 (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL REFERENCES rtc_rooms_v1(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sender','receiver')),
  payload TEXT NOT NULL,
  UNIQUE(room_id, role, event_id)
);
CREATE INDEX IF NOT EXISTS idx_rtc_signals_room ON rtc_signals_v1(room_id, seq);
CREATE INDEX IF NOT EXISTS idx_rtc_expiry ON rtc_rooms_v1(expires_at_ms);
CREATE TABLE IF NOT EXISTS rtc_limits_v1 (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at_ms INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS rtc_join_limits_v1 (room_id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at_ms INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_rtc_join_expiry ON rtc_join_limits_v1(expires_at_ms);
