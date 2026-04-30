
ALTER TABLE public.kyc_requests
  ADD COLUMN IF NOT EXISTS surepass_client_id text,
  ADD COLUMN IF NOT EXISTS surepass_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS surepass_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS surepass_data jsonb;
