INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-photos', 'kyc-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Users can upload own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload KYC photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update KYC photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public users to view KYC photos" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload KYC photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-photos');

CREATE POLICY "Allow authenticated users to update KYC photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');

CREATE POLICY "Allow public users to view KYC photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'kyc-photos');