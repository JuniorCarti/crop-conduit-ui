CREATE TABLE IF NOT EXISTS sessions (
  sessionId TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  stateJson TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT NOT NULL,
  uid TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session_time
  ON messages (sessionId, createdAt);

CREATE INDEX IF NOT EXISTS idx_sessions_uid_time
  ON sessions (uid, updatedAt);
