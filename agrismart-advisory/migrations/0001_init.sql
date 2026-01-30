CREATE TABLE IF NOT EXISTS asha_conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_time
  ON asha_conversations (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_user_session
  ON asha_conversations (user_id, session_id);
