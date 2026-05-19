-- Avoid broad SELECT/listing access while keeping uploads permissive for authenticated users.
DROP POLICY IF EXISTS "kyc_photos_authenticated_full_access" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_delete" ON storage.objects;

CREATE POLICY "kyc_photos_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-photos');

CREATE POLICY "kyc_photos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');

CREATE POLICY "kyc_photos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'kyc-photos');

UPDATE storage.buckets
SET public = true
WHERE id = 'kyc-photos';