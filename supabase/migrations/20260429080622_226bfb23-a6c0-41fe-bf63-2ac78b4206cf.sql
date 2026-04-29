ALTER TABLE public.kyc_requests
ADD COLUMN IF NOT EXISTS aadhaar_linked_mobile text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS selfie_with_aadhaar_url text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_kyc_requests_user_status_created
ON public.kyc_requests (user_id, status, created_at DESC);