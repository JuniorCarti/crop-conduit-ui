CREATE TABLE IF NOT EXISTS asha_session_state (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  intent TEXT DEFAULT 'general',
  last_listing_id TEXT,
  last_market TEXT,
  farm_id TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
