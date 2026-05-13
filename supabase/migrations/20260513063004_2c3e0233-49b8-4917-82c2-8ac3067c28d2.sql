CREATE TABLE public.bharat_gaurav_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('monthly','yearly')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),
  payment_order_id uuid,
  razorpay_payment_id text,
  razorpay_order_id text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bgm_user_id ON public.bharat_gaurav_memberships(user_id);
CREATE INDEX idx_bgm_status ON public.bharat_gaurav_memberships(status);

ALTER TABLE public.bharat_gaurav_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bharat gaurav membership"
  ON public.bharat_gaurav_memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bharat gaurav membership"
  ON public.bharat_gaurav_memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage bharat gaurav memberships"
  ON public.bharat_gaurav_memberships FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_bgm_updated_at
  BEFORE UPDATE ON public.bharat_gaurav_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();