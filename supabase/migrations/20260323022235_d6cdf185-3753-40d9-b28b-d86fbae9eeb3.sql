-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Public read access for uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add new columns to matrimony_profiles
ALTER TABLE public.matrimony_profiles
ADD COLUMN IF NOT EXISTS family_background text DEFAULT '',
ADD COLUMN IF NOT EXISTS hobbies text DEFAULT '',
ADD COLUMN IF NOT EXISTS job_details text DEFAULT '';
