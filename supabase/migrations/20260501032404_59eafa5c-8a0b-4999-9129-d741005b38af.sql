ALTER TABLE public.merchant_profiles
  DROP COLUMN IF EXISTS aadhar_url,
  DROP COLUMN IF EXISTS pan_url,
  DROP COLUMN IF EXISTS gst_url,
  DROP COLUMN IF EXISTS fssai_url;

ALTER TABLE public.matrimony_profiles
  DROP COLUMN IF EXISTS aadhar_url,
  DROP COLUMN IF EXISTS pan_url;