
-- Duplicate attempts log
CREATE TABLE IF NOT EXISTS public.duplicate_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  value text NOT NULL,
  attempted_user_id uuid,
  existing_user_id uuid,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_attempts_created_at ON public.duplicate_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_duplicate_attempts_kind ON public.duplicate_attempts (kind);

ALTER TABLE public.duplicate_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view duplicate attempts" ON public.duplicate_attempts;
CREATE POLICY "Admins view duplicate attempts"
  ON public.duplicate_attempts FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Signup duplicate checker (email + phone via auth.users + profiles)
CREATE OR REPLACE FUNCTION public.check_signup_duplicate(p_email text, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text := NULLIF(lower(trim(coalesce(p_email, ''))), '');
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_existing uuid;
BEGIN
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_existing FROM auth.users WHERE lower(email) = v_email LIMIT 1;
    IF v_existing IS NOT NULL THEN
      INSERT INTO public.duplicate_attempts (kind, value, attempted_user_id, existing_user_id, context)
      VALUES ('signup_email', v_email, auth.uid(), v_existing, jsonb_build_object('phone', v_phone));
      RETURN jsonb_build_object('duplicate', true, 'field', 'email',
        'message', 'यह ईमेल पहले से registered है / This email is already registered');
    END IF;
  END IF;

  IF length(v_phone) >= 7 THEN
    SELECT id INTO v_existing FROM auth.users
      WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone LIMIT 1;
    IF v_existing IS NULL THEN
      SELECT id INTO v_existing FROM public.profiles
        WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone LIMIT 1;
    END IF;
    IF v_existing IS NOT NULL THEN
      INSERT INTO public.duplicate_attempts (kind, value, attempted_user_id, existing_user_id, context)
      VALUES ('signup_phone', v_phone, auth.uid(), v_existing, jsonb_build_object('email', v_email));
      RETURN jsonb_build_object('duplicate', true, 'field', 'phone',
        'message', 'यह मोबाइल नंबर पहले से इस्तेमाल में है / This mobile number is already in use');
    END IF;
  END IF;

  RETURN jsonb_build_object('duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_signup_duplicate(text, text) TO anon, authenticated;

-- KYC duplicate checker (aadhaar + mobile) — excludes caller's own row
CREATE OR REPLACE FUNCTION public.check_kyc_duplicate(p_aadhaar text, p_mobile text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aadhaar text := regexp_replace(coalesce(p_aadhaar, ''), '\D', '', 'g');
  v_mobile text := regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g');
  v_caller uuid := auth.uid();
  v_existing uuid;
BEGIN
  IF length(v_aadhaar) = 12 THEN
    SELECT user_id INTO v_existing FROM public.kyc_verifications
      WHERE regexp_replace(coalesce(aadhaar_full, ''), '\D', '', 'g') = v_aadhaar
        AND (v_caller IS NULL OR user_id <> v_caller)
      LIMIT 1;
    IF v_existing IS NOT NULL THEN
      INSERT INTO public.duplicate_attempts (kind, value, attempted_user_id, existing_user_id, context)
      VALUES ('kyc_aadhaar', v_aadhaar, v_caller, v_existing, jsonb_build_object('mobile', v_mobile));
      RETURN jsonb_build_object('duplicate', true, 'field', 'aadhaar',
        'message', 'यह आधार कार्ड पहले से registered है / This Aadhaar is already registered');
    END IF;
  END IF;

  IF length(v_mobile) >= 7 THEN
    SELECT user_id INTO v_existing FROM public.kyc_verifications
      WHERE regexp_replace(coalesce(mobile, ''), '\D', '', 'g') = v_mobile
        AND (v_caller IS NULL OR user_id <> v_caller)
      LIMIT 1;
    IF v_existing IS NOT NULL THEN
      INSERT INTO public.duplicate_attempts (kind, value, attempted_user_id, existing_user_id, context)
      VALUES ('kyc_mobile', v_mobile, v_caller, v_existing, jsonb_build_object('aadhaar', v_aadhaar));
      RETURN jsonb_build_object('duplicate', true, 'field', 'mobile',
        'message', 'यह मोबाइल नंबर पहले से इस्तेमाल में है / This mobile number is already in use');
    END IF;
  END IF;

  RETURN jsonb_build_object('duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_kyc_duplicate(text, text) TO authenticated;
