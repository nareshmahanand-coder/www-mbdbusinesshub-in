-- Make kyc-photos storage access permissive while keeping it scoped to only this bucket.
-- Do not disable RLS globally on storage.objects because that would expose every storage bucket.

-- Ensure the KYC photos bucket exists and is public for certificate image rendering.
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-photos', 'kyc-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove every existing policy on storage.objects that targets the kyc-photos bucket.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Authenticated users can upload/overwrite/read/delete any object in kyc-photos.
CREATE POLICY "kyc_photos_authenticated_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'kyc-photos')
WITH CHECK (bucket_id = 'kyc-photos');

-- Public read is required for public certificate URLs to render real images.
CREATE POLICY "kyc_photos_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'kyc-photos');