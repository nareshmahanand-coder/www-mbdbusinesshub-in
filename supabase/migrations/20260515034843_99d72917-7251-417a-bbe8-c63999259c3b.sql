-- Create unified user_profiles table for membership status
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  membership_status TEXT NOT NULL DEFAULT 'inactive',
  membership_type TEXT,
  plan_type TEXT,
  current_period_end TIMESTAMPTZ,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage user_profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);