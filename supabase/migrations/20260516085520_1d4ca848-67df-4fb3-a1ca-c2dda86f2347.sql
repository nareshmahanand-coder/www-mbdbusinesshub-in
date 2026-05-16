
ALTER TABLE public.kyc_verifications
  ADD COLUMN IF NOT EXISTS kyc_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS re_kyc_requested_at timestamptz;

UPDATE public.kyc_verifications
  SET kyc_expires_at = COALESCE(verified_at, created_at) + interval '30 days'
  WHERE kyc_expires_at IS NULL;
