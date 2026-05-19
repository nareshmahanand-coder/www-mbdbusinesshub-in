-- Backfill profiles.phone from kyc_verifications.mobile when missing
UPDATE public.profiles p
SET phone = regexp_replace(k.mobile, '\D', '', 'g'),
    phone_verified = true,
    phone_verified_at = COALESCE(p.phone_verified_at, k.verified_at, now()),
    updated_at = now()
FROM public.kyc_verifications k
WHERE k.user_id = p.id
  AND k.mobile IS NOT NULL
  AND length(regexp_replace(k.mobile, '\D', '', 'g')) >= 7
  AND (p.phone IS NULL OR p.phone = '');

-- Backfill profiles.phone from merchant_profiles.phone when missing
UPDATE public.profiles p
SET phone = regexp_replace(m.phone, '\D', '', 'g'),
    updated_at = now()
FROM public.merchant_profiles m
WHERE m.user_id = p.id
  AND m.phone IS NOT NULL
  AND length(regexp_replace(m.phone, '\D', '', 'g')) >= 7
  AND (p.phone IS NULL OR p.phone = '');

-- Trigger: keep profiles.phone in sync whenever kyc_verifications row is inserted/updated
CREATE OR REPLACE FUNCTION public.sync_kyc_mobile_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := regexp_replace(coalesce(NEW.mobile, ''), '\D', '', 'g');
BEGIN
  IF length(v_phone) >= 7 THEN
    UPDATE public.profiles
    SET phone = v_phone,
        phone_verified = true,
        phone_verified_at = COALESCE(phone_verified_at, NEW.verified_at, now()),
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_kyc_mobile_to_profile ON public.kyc_verifications;
CREATE TRIGGER trg_sync_kyc_mobile_to_profile
AFTER INSERT OR UPDATE OF mobile ON public.kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION public.sync_kyc_mobile_to_profile();