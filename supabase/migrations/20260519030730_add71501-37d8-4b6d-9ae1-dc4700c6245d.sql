-- Remove broad public listing policy while keeping kyc-photos bucket public for public file URLs.
DROP POLICY IF EXISTS "kyc_photos_public_read" ON storage.objects;

-- Keep authenticated full access scoped only to kyc-photos.
DROP POLICY IF EXISTS "kyc_photos_authenticated_full_access" ON storage.objects;

CREATE POLICY "kyc_photos_authenticated_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');

UPDATE storage.buckets
SET public = true
WHERE id = 'kyc-photos';