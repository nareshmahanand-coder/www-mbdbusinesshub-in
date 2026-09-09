GRANT SELECT ON public.merchant_profiles TO anon;

CREATE POLICY "Public can view active verified merchants"
ON public.merchant_profiles
FOR SELECT
TO anon
USING (is_verified = true AND access_status = 'active');