-- Permanently remove every existing storage policy that targets the kyc-photos bucket.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%kyc%photo%'
        OR coalesce(qual, '') ILIKE '%kyc-photos%'
        OR coalesce(with_check, '') ILIKE '%kyc-photos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
  END LOOP;
END $$;

-- Keep the KYC photos bucket public for direct image rendering.
UPDATE storage.buckets
SET public = true
WHERE id = 'kyc-photos';

-- Give authenticated users unrestricted object access within only the kyc-photos bucket.
-- No folder, filename, ownership, or document-type checks are applied.
CREATE POLICY "kyc_photos_authenticated_unrestricted_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');