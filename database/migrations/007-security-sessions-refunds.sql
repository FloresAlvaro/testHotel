BEGIN;
ALTER TABLE web_session ADD COLUMN IF NOT EXISTS public_id UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS web_session_public_id ON web_session(public_id);
ALTER TABLE online_payment ADD COLUMN IF NOT EXISTS provider_refund TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS online_payment_provider_refund ON online_payment(provider_refund) WHERE provider_refund IS NOT NULL;
COMMIT;
