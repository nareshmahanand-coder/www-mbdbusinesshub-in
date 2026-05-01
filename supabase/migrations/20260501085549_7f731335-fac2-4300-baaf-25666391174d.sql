
ALTER TABLE public.merchant_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
  ADD COLUMN IF NOT EXISTS pan_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan_url text,
  ADD COLUMN IF NOT EXISTS gst_certificate_url text,
  ADD COLUMN IF NOT EXISTS food_license_url text;

ALTER TABLE public.matrimony_profiles
  ADD COLUMN IF NOT EXISTS aadhaar_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
  ADD COLUMN IF NOT EXISTS pan_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan_url text;
