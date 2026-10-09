ALTER TABLE "user" ADD COLUMN password_setup_required BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX user_email_normalized ON "user" (lower(email));
CREATE TABLE auth_session (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent VARCHAR(500),
  ip_address VARCHAR(45)
);
CREATE INDEX auth_session_user ON auth_session(user_id);
CREATE TABLE auth_action_token (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  purpose VARCHAR(10) NOT NULL CHECK (purpose IN ('invite', 'reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX auth_action_token_user ON auth_action_token(user_id);
