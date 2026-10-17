BEGIN;
CREATE TABLE IF NOT EXISTS web_session (
 token_hash CHAR(64) PRIMARY KEY,
 user_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 auth_version INT NOT NULL,
 csrf_token CHAR(64) NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS web_session_expiry ON web_session(expires_at);
CREATE TABLE IF NOT EXISTS user_invitation (
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(200) NOT NULL,
 email VARCHAR(200) NOT NULL,
 role user_role NOT NULL,
 client_id INT REFERENCES client(id) ON DELETE CASCADE,
 token_hash CHAR(64) NOT NULL UNIQUE,
 created_by INT NOT NULL REFERENCES "user"(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 CHECK ((role='customer')=(client_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS invitation_pending_email ON user_invitation(lower(email)) WHERE used_at IS NULL;
COMMIT;
