
-- Create public storage bucket for skill development PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('skill-pdfs', 'skill-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to skill PDFs
CREATE POLICY "Anyone can read skill PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'skill-pdfs');

-- Allow authenticated users to upload skill PDFs (admin use)
CREATE POLICY "Authenticated users can upload skill PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'skill-pdfs' AND auth.role() = 'authenticated');
