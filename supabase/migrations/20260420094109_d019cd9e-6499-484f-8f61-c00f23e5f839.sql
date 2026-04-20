-- 1. Donor registry
CREATE TABLE public.blood_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  weight_kg numeric NOT NULL,
  height_cm numeric,
  blood_group text NOT NULL,
  aadhaar_last4 text,
  photo_url text,
  address text,
  city text,
  phone text NOT NULL,
  is_eligible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  donation_count integer NOT NULL DEFAULT 0,
  last_donation_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active donors"
  ON public.blood_donors FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Donor can manage own record"
  ON public.blood_donors FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_blood_donors_updated
  BEFORE UPDATE ON public.blood_donors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Blood requests (seekers)
CREATE TABLE public.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_name text,
  requester_phone text,
  blood_group text NOT NULL,
  city text,
  message text,
  status text NOT NULL DEFAULT 'open',
  matched_donor_id uuid REFERENCES public.blood_donors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view requests"
  ON public.blood_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Requester can manage own request"
  ON public.blood_requests FOR ALL
  TO authenticated
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

CREATE TRIGGER trg_blood_requests_updated
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Donations (issued when seeker confirms receipt)
CREATE TABLE public.blood_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.blood_donors(id) ON DELETE CASCADE,
  donor_user_id uuid NOT NULL,
  request_id uuid REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  requester_id uuid NOT NULL,
  blood_group text NOT NULL,
  city text,
  certificate_no text NOT NULL DEFAULT ('NGO-LSESS-' || to_char(now(),'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  donated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donor can read own donations"
  ON public.blood_donations FOR SELECT
  TO authenticated
  USING (auth.uid() = donor_user_id);

CREATE POLICY "Requester can read donations they confirmed"
  ON public.blood_donations FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

CREATE POLICY "Requester can create donation on confirmation"
  ON public.blood_donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Indexes
CREATE INDEX idx_blood_donors_group_city ON public.blood_donors(blood_group, city) WHERE is_active = true;
CREATE INDEX idx_blood_requests_status_city ON public.blood_requests(status, city);
CREATE INDEX idx_blood_donations_donor ON public.blood_donations(donor_user_id);