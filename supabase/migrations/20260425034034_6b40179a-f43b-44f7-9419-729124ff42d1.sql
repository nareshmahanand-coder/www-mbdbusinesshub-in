ALTER TABLE public.merchant_profiles
ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS aadhaar_last4 text DEFAULT '',
ADD COLUMN IF NOT EXISTS access_status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS suspension_reason text DEFAULT '',
ADD COLUMN IF NOT EXISTS plan_override text DEFAULT '',
ADD COLUMN IF NOT EXISTS plan_ends_at date;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_mode boolean NOT NULL DEFAULT false,
  merchant_registrations_enabled boolean NOT NULL DEFAULT true,
  razorpay_key_reference text DEFAULT '',
  ai_key_reference text DEFAULT '',
  admin_security_updated_at timestamp with time zone DEFAULT now(),
  merchant_area_label text NOT NULL DEFAULT 'Merchant Dashboard',
  admin_area_label text NOT NULL DEFAULT 'Admin Portal',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can read public site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read public site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.site_settings (merchant_area_label, admin_area_label)
SELECT 'Merchant Dashboard', 'Admin Portal'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

DROP TRIGGER IF EXISTS update_merchant_profiles_updated_at ON public.merchant_profiles;
CREATE TRIGGER update_merchant_profiles_updated_at
BEFORE UPDATE ON public.merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();