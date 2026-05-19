-- Remove the broad all-access policy so kyc-photos has no listing/read policy.
DROP POLICY IF EXISTS "kyc_photos_authenticated_unrestricted_access" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "kyc_photos_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own kyc photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view kyc photos" ON storage.objects;

-- Keep the KYC photos bucket public for direct object URLs.
UPDATE storage.buckets
SET public = true
WHERE id = 'kyc-photos';

-- Authenticated users can upload any file path in kyc-photos with no folder/name/user restriction.
CREATE POLICY "kyc_photos_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-photos');

-- Authenticated users can overwrite/update any file in kyc-photos with no folder/name/user restriction.
CREATE POLICY "kyc_photos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');

-- Authenticated users can delete any file in kyc-photos with no folder/name/user restriction.
CREATE POLICY "kyc_photos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'kyc-photos');