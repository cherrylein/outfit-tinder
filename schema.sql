CREATE TABLE IF NOT EXISTS review_states (
  project TEXT NOT NULL,
  user_name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project, user_name)
);
