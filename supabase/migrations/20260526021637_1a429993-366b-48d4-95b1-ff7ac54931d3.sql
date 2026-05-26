
-- Make previously private buckets public again
UPDATE storage.buckets SET public = true WHERE id IN ('kyc-photos', 'blood-proof');

-- Drop restrictive storage policies added during lockdown (names from prior migration)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%kyc%'
        OR policyname ILIKE '%blood-proof%'
        OR policyname ILIKE '%blood_proof%'
        OR policyname ILIKE '%private bucket%'
        OR policyname ILIKE '%owner can%'
        OR policyname ILIKE '%admin can read%kyc%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Ensure public read on these buckets
DROP POLICY IF EXISTS "Public read kyc-photos" ON storage.objects;
CREATE POLICY "Public read kyc-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-photos');

DROP POLICY IF EXISTS "Public read blood-proof" ON storage.objects;
CREATE POLICY "Public read blood-proof" ON storage.objects
  FOR SELECT USING (bucket_id = 'blood-proof');

-- Authenticated users can upload/update/delete in these buckets (restore prior behavior)
DROP POLICY IF EXISTS "Authenticated upload kyc-photos" ON storage.objects;
CREATE POLICY "Authenticated upload kyc-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-photos');

DROP POLICY IF EXISTS "Authenticated update kyc-photos" ON storage.objects;
CREATE POLICY "Authenticated update kyc-photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'kyc-photos') WITH CHECK (bucket_id = 'kyc-photos');

DROP POLICY IF EXISTS "Authenticated upload blood-proof" ON storage.objects;
CREATE POLICY "Authenticated upload blood-proof" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blood-proof');

DROP POLICY IF EXISTS "Authenticated update blood-proof" ON storage.objects;
CREATE POLICY "Authenticated update blood-proof" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'blood-proof') WITH CHECK (bucket_id = 'blood-proof');
