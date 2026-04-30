INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users can upload own KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users update own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins view all KYC documents" ON storage.objects;

CREATE POLICY "Authenticated users upload own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users view own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users update own KYC documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND private.has_role(auth.uid(), 'admin'::app_role)
);