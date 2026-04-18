
-- Create kyc_requests table
CREATE TABLE public.kyc_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  aadhaar_number TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  aadhaar_front_url TEXT NOT NULL,
  aadhaar_back_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT kyc_status_check CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX idx_kyc_requests_user_id ON public.kyc_requests(user_id);
CREATE INDEX idx_kyc_requests_status ON public.kyc_requests(status);

ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own KYC
CREATE POLICY "Users can view their own KYC requests"
ON public.kyc_requests FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all KYC requests"
ON public.kyc_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own
CREATE POLICY "Users can create their own KYC requests"
ON public.kyc_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own rejected submissions (re-submit)
CREATE POLICY "Users can resubmit rejected KYC"
ON public.kyc_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'rejected')
WITH CHECK (auth.uid() = user_id);

-- Admins can update any
CREATE POLICY "Admins can update KYC requests"
ON public.kyc_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_kyc_requests_updated_at
BEFORE UPDATE ON public.kyc_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents','kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files stored under {user_id}/...
CREATE POLICY "Users can view own KYC files"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC files"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upload own KYC files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own KYC files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
