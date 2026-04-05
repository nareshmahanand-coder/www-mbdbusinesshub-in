
ALTER TABLE public.merchant_profiles
  ADD COLUMN aadhar_url text DEFAULT null,
  ADD COLUMN pan_url text DEFAULT null,
  ADD COLUMN gst_url text DEFAULT null,
  ADD COLUMN fssai_url text DEFAULT null;

ALTER TABLE public.matrimony_profiles
  ADD COLUMN aadhar_url text DEFAULT null,
  ADD COLUMN pan_url text DEFAULT null;
