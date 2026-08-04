CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_code text;
BEGIN
  LOOP
    v_code := 'AG' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.agents WHERE agent_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  agent_code text NOT NULL UNIQUE,
  name text NOT NULL,
  mobile text NOT NULL,
  email text,
  city text,
  address text,
  photo_url text,
  aadhaar_number text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  pan_number text,
  pan_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text NOT NULL DEFAULT '',
  wallet_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ALTER COLUMN agent_code SET DEFAULT public.generate_agent_code();

CREATE TABLE public.agent_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  merchant_user_id uuid NOT NULL UNIQUE,
  merchant_profile_id uuid,
  shop_name text,
  source text NOT NULL DEFAULT 'referral_link',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  merchant_user_id uuid NOT NULL,
  payment_order_id uuid UNIQUE,
  razorpay_payment_id text,
  plan text NOT NULL,
  amount numeric NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_referrals_agent ON public.agent_referrals(agent_id);
CREATE INDEX idx_agent_commissions_agent ON public.agent_commissions(agent_id);

GRANT SELECT, INSERT, UPDATE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
GRANT SELECT, INSERT ON public.agent_referrals TO authenticated;
GRANT ALL ON public.agent_referrals TO service_role;
GRANT SELECT ON public.agent_commissions TO authenticated;
GRANT ALL ON public.agent_commissions TO service_role;

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own record" ON public.agents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own agent record" ON public.agents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Agents update own record" ON public.agents FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents view own referrals" ON public.agent_referrals FOR SELECT TO authenticated
  USING (
    merchant_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_referrals.agent_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Merchants attach own referral" ON public.agent_referrals FOR INSERT TO authenticated
  WITH CHECK (merchant_user_id = auth.uid());

CREATE POLICY "Agents view own commissions" ON public.agent_commissions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_commissions.agent_id AND a.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.protect_agent_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.agent_code := OLD.agent_code;
    NEW.wallet_balance := OLD.wallet_balance;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agents_protect BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.protect_agent_privileged_columns();

CREATE OR REPLACE FUNCTION public.apply_agent_commission_to_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.agents
  SET wallet_balance = wallet_balance + NEW.amount, updated_at = now()
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_commission_wallet AFTER INSERT ON public.agent_commissions
FOR EACH ROW EXECUTE FUNCTION public.apply_agent_commission_to_wallet();

CREATE OR REPLACE FUNCTION public.lookup_agent_by_code(p_code text)
RETURNS TABLE(id uuid, agent_code text, name text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.agent_code, a.name, a.status
  FROM public.agents a
  WHERE upper(a.agent_code) = upper(trim(coalesce(p_code, '')))
    AND a.status = 'approved'
  LIMIT 1;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_commissions;