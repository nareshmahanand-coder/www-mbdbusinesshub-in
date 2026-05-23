-- Make sensitive document buckets private; access only via signed URLs.
UPDATE storage.buckets SET public = false WHERE id IN ('kyc-photos', 'blood-proof');

-- Drop existing policies that target these buckets to avoid duplicates / overly-permissive rules.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        coalesce(qual, '') ILIKE '%kyc-photos%'
        OR coalesce(with_check, '') ILIKE '%kyc-photos%'
        OR coalesce(qual, '') ILIKE '%blood-proof%'
        OR coalesce(with_check, '') ILIKE '%blood-proof%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- kyc-photos: owner can read/write own folder; admin can read all.
CREATE POLICY "kyc_photos owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_photos admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "kyc_photos owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_photos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kyc-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'kyc-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_photos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kyc-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- blood-proof: owner can read/write own folder; admin can read all.
CREATE POLICY "blood_proof owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "blood_proof admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'blood-proof' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "blood_proof owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "blood_proof owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "blood_proof owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text);
