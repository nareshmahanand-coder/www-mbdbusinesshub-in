DROP POLICY IF EXISTS "Authenticated users can read public site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Everyone can read public site settings" ON public.site_settings;
CREATE POLICY "Everyone can read public site settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);