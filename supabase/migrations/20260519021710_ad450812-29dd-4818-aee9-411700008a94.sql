DROP POLICY IF EXISTS "Allow public users to view KYC photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own kyc photos" ON storage.objects;

CREATE POLICY "Users can read own kyc photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);