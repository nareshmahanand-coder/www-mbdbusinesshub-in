CREATE TABLE public.big_merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  big_merchant_id text NOT NULL DEFAULT '',
  coordinator_id uuid REFERENCES public.coordinators(id),
  registration_type text NOT NULL DEFAULT 'self',
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  email text,
  city text,
  address text,
  pincode text,
  gst_number text NOT NULL,
  gst_certificate_url text,
  food_license_number text,
  food_license_url text,
  aadhaar_number text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  pan_number text,
  pan_url text,
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  subscription_status text NOT NULL DEFAULT 'inactive',
  subscription_plan text,
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE UNIQUE INDEX big_merchants_code_key ON public.big_merchants (big_merchant_id) WHERE big_merchant_id <> '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.big_merchants TO authenticated;
GRANT ALL ON public.big_merchants TO service_role;

ALTER TABLE public.big_merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Big merchants can view own record"
  ON public.big_merchants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR coordinator_id IN (SELECT c.id FROM public.coordinators c WHERE c.user_id = auth.uid())
  );

CREATE POLICY "Big merchants can create own record"
  ON public.big_merchants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Big merchants can update own record"
  ON public.big_merchants FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.generate_big_merchant_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_code text;
BEGIN
  LOOP
    v_code := 'BM' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.big_merchants WHERE big_merchant_id = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_big_merchant_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.big_merchant_id IS NULL OR NEW.big_merchant_id = '' THEN
    NEW.big_merchant_id := public.generate_big_merchant_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_big_merchant_code
BEFORE INSERT ON public.big_merchants
FOR EACH ROW EXECUTE FUNCTION public.set_big_merchant_code();

CREATE OR REPLACE FUNCTION public.protect_big_merchant_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.big_merchant_id := OLD.big_merchant_id;
    NEW.status := OLD.status;
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.subscription_started_at := OLD.subscription_started_at;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
    NEW.admin_notes := OLD.admin_notes;
    IF OLD.coordinator_id IS NOT NULL THEN
      NEW.coordinator_id := OLD.coordinator_id;
      NEW.registration_type := OLD.registration_type;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_big_merchants_protect
BEFORE UPDATE ON public.big_merchants
FOR EACH ROW EXECUTE FUNCTION public.protect_big_merchant_privileged_columns();

ALTER TABLE public.merchant_profiles
  ADD COLUMN IF NOT EXISTS is_big_merchant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS big_merchant_id text;

CREATE OR REPLACE FUNCTION public.lookup_big_merchant_by_id(p_code text)
RETURNS TABLE(id uuid, big_merchant_id text, shop_name text, status text, subscription_status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.big_merchant_id, b.shop_name, b.status, b.subscription_status
  FROM public.big_merchants b
  WHERE upper(b.big_merchant_id) = upper(trim(coalesce(p_code, '')))
  LIMIT 1;
$$;

ALTER TABLE public.big_merchants REPLICA IDENTITY FULL;