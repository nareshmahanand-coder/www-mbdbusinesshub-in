
-- Matrimony profiles table
CREATE TABLE public.matrimony_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  dob date,
  height text DEFAULT '',
  education text DEFAULT '',
  profession text DEFAULT '',
  city text DEFAULT '',
  about_me text DEFAULT '',
  photos text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  subscription_plan text DEFAULT NULL,
  subscription_start date DEFAULT NULL,
  subscription_end date DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.matrimony_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own matrimony profile"
  ON public.matrimony_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view published matrimony profiles"
  ON public.matrimony_profiles FOR SELECT TO authenticated
  USING (is_published = true);

-- Classifieds / Buy-Sell ads table
CREATE TABLE public.classifieds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric DEFAULT 0,
  category text DEFAULT '',
  city text DEFAULT '',
  photos text[] DEFAULT '{}',
  condition text DEFAULT 'used',
  contact_phone text DEFAULT '',
  is_sold boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view classifieds"
  ON public.classifieds FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own classifieds"
  ON public.classifieds FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  company_name text DEFAULT '',
  city text DEFAULT '',
  salary_range text DEFAULT '',
  job_type text DEFAULT 'full-time',
  contact_phone text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own jobs"
  ON public.jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service providers (Bharat Mitra directory)
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  service_type text NOT NULL DEFAULT '',
  city text DEFAULT '',
  phone text DEFAULT '',
  description text DEFAULT '',
  rating numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view service providers"
  ON public.service_providers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own service provider profile"
  ON public.service_providers FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Contact requests for matrimony
CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.matrimony_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contact requests"
  ON public.contact_requests FOR ALL TO authenticated
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Profile owners can view requests for their profile"
  ON public.contact_requests FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.matrimony_profiles WHERE user_id = auth.uid()));
