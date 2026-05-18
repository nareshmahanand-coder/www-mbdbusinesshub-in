INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-photos', 'kyc-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own kyc photos" ON storage.objects;

CREATE POLICY "Users can upload own kyc photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(name) ~ ('^' || auth.uid()::text || '/[0-9]+-(selfie|aadhaar-front|aadhaar-back)\.jpg$')
);

CREATE POLICY "Users can update own kyc photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kyc-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(name) ~ ('^' || auth.uid()::text || '/[0-9]+-(selfie|aadhaar-front|aadhaar-back)\.jpg$')
);

CREATE POLICY "Users can read own kyc photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view kyc photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'kyc-photos');