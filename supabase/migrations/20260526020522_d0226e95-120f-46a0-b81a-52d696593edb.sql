
-- Drop the view (linter flagged it as security-definer)
DROP VIEW IF EXISTS public.matrimony_profiles_public;

-- Sanitized RPC for public browsing of published matrimony profiles.
-- Returns only non-sensitive fields. Aadhaar/PAN and document URLs are NEVER returned.
CREATE OR REPLACE FUNCTION public.list_published_matrimony_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  gender text,
  dob date,
  height text,
  education text,
  profession text,
  city text,
  about_me text,
  family_background text,
  hobbies text,
  job_details text,
  photos text[],
  is_published boolean,
  subscription_plan text,
  subscription_end date,
  moderation_status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, user_id, name, gender, dob, height, education, profession, city,
    about_me, family_background, hobbies, job_details, photos,
    is_published, subscription_plan, subscription_end, moderation_status,
    created_at, updated_at
  FROM public.matrimony_profiles
  WHERE is_published = true
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_published_matrimony_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_published_matrimony_profiles() TO authenticated;
