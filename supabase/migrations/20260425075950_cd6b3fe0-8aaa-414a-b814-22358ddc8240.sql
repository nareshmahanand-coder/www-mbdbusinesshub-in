DROP POLICY IF EXISTS "Public read access for uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read skill PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read blood proof" ON storage.objects;

CREATE POLICY "Users can view own uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own blood proof files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'blood-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view blood proof files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'blood-proof' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view skill PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'skill-pdfs');