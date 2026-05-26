
-- Remove broad public SELECT that exposed Aadhaar/PAN to all authenticated users
DROP POLICY IF EXISTS "Anyone can view published matrimony profiles" ON public.matrimony_profiles;

-- Public, sanitized view of published matrimony profiles (excludes Aadhaar/PAN fields)
CREATE OR REPLACE VIEW public.matrimony_profiles_public AS
SELECT
  id, user_id, name, gender, dob, height, education, profession, city,
  about_me, family_background, hobbies, job_details, photos,
  is_published, subscription_plan, subscription_end, moderation_status,
  created_at, updated_at
FROM public.matrimony_profiles
WHERE is_published = true;

GRANT SELECT ON public.matrimony_profiles_public TO authenticated, anon;
