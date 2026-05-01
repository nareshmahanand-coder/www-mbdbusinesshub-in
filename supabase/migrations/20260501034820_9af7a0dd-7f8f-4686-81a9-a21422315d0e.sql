
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  mobile text NOT NULL,
  aadhaar_last4 text NOT NULL,
  full_name text NOT NULL,
  relation_type text NOT NULL DEFAULT 'father',
  relation_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  aadhaar_front_url text,
  aadhaar_back_url text,
  selfie_url text,
  status text NOT NULL DEFAULT 'verified',
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kyc"
  ON public.kyc_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kyc"
  ON public.kyc_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kyc"
  ON public.kyc_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all kyc"
  ON public.kyc_verifications FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-photos', 'kyc-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own kyc photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own kyc photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view kyc photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'kyc-photos');
