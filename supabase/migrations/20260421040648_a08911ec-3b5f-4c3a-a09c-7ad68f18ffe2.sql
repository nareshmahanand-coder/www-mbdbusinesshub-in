
-- Relax NOT NULL on donor_id and requester_id so self-registered donors can create rows
ALTER TABLE public.blood_donations ALTER COLUMN donor_id DROP NOT NULL;
ALTER TABLE public.blood_donations ALTER COLUMN requester_id DROP NOT NULL;

-- Add verification + proof columns
ALTER TABLE public.blood_donations
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS hospital_name TEXT,
  ADD COLUMN IF NOT EXISTS hospital_address TEXT,
  ADD COLUMN IF NOT EXISTS donation_date_text TEXT,
  ADD COLUMN IF NOT EXISTS donor_live_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS hospital_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receiver_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS receiver_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_verified_by UUID,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';

-- Allow donor to insert their own self-registration row
DROP POLICY IF EXISTS "Donor can self-register donation" ON public.blood_donations;
CREATE POLICY "Donor can self-register donation"
  ON public.blood_donations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_user_id);

-- Allow donor to update their own donation row (to upload proofs)
DROP POLICY IF EXISTS "Donor can update own donation" ON public.blood_donations;
CREATE POLICY "Donor can update own donation"
  ON public.blood_donations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = donor_user_id)
  WITH CHECK (auth.uid() = donor_user_id);

-- Receiver can update receiver_confirmed flag on their own request
DROP POLICY IF EXISTS "Receiver can confirm donation" ON public.blood_donations;
CREATE POLICY "Receiver can confirm donation"
  ON public.blood_donations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

-- Admins: full read + update for verification
DROP POLICY IF EXISTS "Admins can view all donations" ON public.blood_donations;
CREATE POLICY "Admins can view all donations"
  ON public.blood_donations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update donations" ON public.blood_donations;
CREATE POLICY "Admins can update donations"
  ON public.blood_donations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger (add updated_at column if missing)
ALTER TABLE public.blood_donations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_blood_donations_updated_at ON public.blood_donations;
CREATE TRIGGER update_blood_donations_updated_at
  BEFORE UPDATE ON public.blood_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for blood-donation proof (live photo + hospital receipt)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blood-proof', 'blood-proof', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users upload to their own user_id folder
DROP POLICY IF EXISTS "Anyone can read blood proof" ON storage.objects;
CREATE POLICY "Anyone can read blood proof"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blood-proof');

DROP POLICY IF EXISTS "Users upload blood proof to own folder" ON storage.objects;
CREATE POLICY "Users upload blood proof to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blood-proof'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own blood proof" ON storage.objects;
CREATE POLICY "Users update own blood proof"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blood-proof'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
