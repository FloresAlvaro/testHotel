BEGIN;
ALTER TABLE web_session ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS user_mfa (
 user_id INT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 secret_ciphertext TEXT NOT NULL, enabled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 last_counter BIGINT NOT NULL DEFAULT -1
);
CREATE TABLE IF NOT EXISTS mfa_recovery_code (
 user_id INT NOT NULL REFERENCES user_mfa(user_id) ON DELETE CASCADE,
 code_hash CHAR(64) NOT NULL, used_at TIMESTAMPTZ, PRIMARY KEY(user_id,code_hash)
);
CREATE TABLE IF NOT EXISTS mfa_challenge (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 auth_version INT NOT NULL, browser_session BOOLEAN NOT NULL, attempts INT NOT NULL DEFAULT 0,
 pending_secret TEXT, pending_recovery JSONB, replace_existing BOOLEAN NOT NULL DEFAULT false, expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '10 minutes'
);
CREATE INDEX IF NOT EXISTS mfa_challenge_expiry ON mfa_challenge(expires_at);
-- Existing administrator credentials predate MFA and must never bypass enrollment.
UPDATE "user" SET auth_version=auth_version+1 WHERE role='admin';
DELETE FROM web_session WHERE user_id IN (SELECT id FROM "user" WHERE role='admin');
COMMIT;
