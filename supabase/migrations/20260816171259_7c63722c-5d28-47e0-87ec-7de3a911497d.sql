-- 1. Coordinators
CREATE TABLE public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  coordinator_code text NOT NULL UNIQUE,
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
  subscription_status text NOT NULL DEFAULT 'inactive',
  subscription_plan text,
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  auto_debit boolean NOT NULL DEFAULT false,
  wallet_balance numeric NOT NULL DEFAULT 0,
  account_holder_name text,
  bank_account_number text,
  ifsc_code text,
  upi_id text,
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators view own record" ON public.coordinators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own coordinator record" ON public.coordinators
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Coordinators update own record" ON public.coordinators
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 2. Code generator
CREATE OR REPLACE FUNCTION public.generate_coordinator_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_code text;
BEGIN
  LOOP
    v_code := 'CO' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.coordinators WHERE coordinator_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_coordinator_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.coordinator_code IS NULL OR NEW.coordinator_code = '' THEN
    NEW.coordinator_code := public.generate_coordinator_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coordinator_code
BEFORE INSERT ON public.coordinators
FOR EACH ROW EXECUTE FUNCTION public.set_coordinator_code();

-- 3. Protect privileged columns
CREATE OR REPLACE FUNCTION public.protect_coordinator_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.coordinator_code := OLD.coordinator_code;
    NEW.wallet_balance := OLD.wallet_balance;
    NEW.admin_notes := OLD.admin_notes;
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.subscription_started_at := OLD.subscription_started_at;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coordinators_protect
BEFORE UPDATE ON public.coordinators
FOR EACH ROW EXECUTE FUNCTION public.protect_coordinator_privileged_columns();

-- 4. Agents linked to coordinators
ALTER TABLE public.agents
  ADD COLUMN coordinator_id uuid REFERENCES public.coordinators(id),
  ADD COLUMN registration_type text NOT NULL DEFAULT 'self';

CREATE INDEX idx_agents_coordinator ON public.agents(coordinator_id);

CREATE OR REPLACE FUNCTION public.protect_agent_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.agent_code := OLD.agent_code;
    NEW.wallet_balance := OLD.wallet_balance;
    NEW.admin_notes := OLD.admin_notes;
    -- coordinator binding is permanent once set
    IF OLD.coordinator_id IS NOT NULL THEN
      NEW.coordinator_id := OLD.coordinator_id;
      NEW.registration_type := OLD.registration_type;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 5. Coordinator commissions (2% passive)
CREATE TABLE public.coordinator_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL REFERENCES public.coordinators(id),
  agent_id uuid REFERENCES public.agents(id),
  merchant_user_id uuid NOT NULL,
  payment_order_id uuid,
  razorpay_payment_id text,
  plan text NOT NULL,
  amount numeric NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coordinator_commissions TO authenticated;
GRANT ALL ON public.coordinator_commissions TO service_role;
ALTER TABLE public.coordinator_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators view own commissions" ON public.coordinator_commissions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.coordinators c WHERE c.id = coordinator_id AND c.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.apply_coordinator_commission_to_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coordinators
  SET wallet_balance = wallet_balance + NEW.amount, updated_at = now()
  WHERE id = NEW.coordinator_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coordinator_commission_wallet
AFTER INSERT ON public.coordinator_commissions
FOR EACH ROW EXECUTE FUNCTION public.apply_coordinator_commission_to_wallet();

-- 6. Coordinator withdrawals (min 1000)
CREATE TABLE public.coordinator_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL REFERENCES public.coordinators(id),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  account_holder_name text,
  bank_account_number text,
  ifsc_code text,
  upi_id text,
  admin_notes text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.coordinator_withdrawals TO authenticated;
GRANT ALL ON public.coordinator_withdrawals TO service_role;
ALTER TABLE public.coordinator_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators view own withdrawals" ON public.coordinator_withdrawals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coordinators request withdrawals" ON public.coordinator_withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update withdrawals" ON public.coordinator_withdrawals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_coordinator_withdrawal_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance numeric;
BEGIN
  SELECT wallet_balance INTO v_balance FROM public.coordinators WHERE id = NEW.coordinator_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Coordinator not found'; END IF;
  IF NEW.amount < 1000 THEN RAISE EXCEPTION 'Minimum withdrawal amount is 1000'; END IF;
  IF NEW.amount > v_balance THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  UPDATE public.coordinators
    SET wallet_balance = wallet_balance - NEW.amount, updated_at = now()
    WHERE id = NEW.coordinator_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coordinator_withdrawal_request
BEFORE INSERT ON public.coordinator_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_coordinator_withdrawal_request();

CREATE OR REPLACE FUNCTION public.handle_coordinator_withdrawal_refund()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    UPDATE public.coordinators
      SET wallet_balance = wallet_balance + OLD.amount, updated_at = now()
      WHERE id = OLD.coordinator_id;
  END IF;
  IF NEW.status = 'paid' AND OLD.status <> 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coordinator_withdrawal_refund
BEFORE UPDATE ON public.coordinator_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_coordinator_withdrawal_refund();

-- 7. Lookup + team overview
CREATE OR REPLACE FUNCTION public.lookup_coordinator_by_code(p_code text)
RETURNS TABLE(id uuid, coordinator_code text, name text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.coordinator_code, c.name, c.status
  FROM public.coordinators c
  WHERE upper(c.coordinator_code) = upper(trim(coalesce(p_code, '')))
    AND c.status = 'approved'
    AND c.subscription_status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.coordinator_team_overview(p_coordinator_id uuid DEFAULT NULL)
RETURNS TABLE(
  agent_id uuid, agent_code text, agent_name text, agent_mobile text, agent_city text,
  agent_status text, joined_at timestamptz, shops_count bigint,
  merchant_subscriptions bigint, agent_commission_total numeric, coordinator_earned numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_coordinator uuid;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  IF public.has_role(v_uid, 'admin') AND p_coordinator_id IS NOT NULL THEN
    v_coordinator := p_coordinator_id;
  ELSE
    SELECT c.id INTO v_coordinator FROM public.coordinators c WHERE c.user_id = v_uid LIMIT 1;
  END IF;
  IF v_coordinator IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    a.id, a.agent_code, a.name, a.mobile, a.city, a.status, a.created_at,
    (SELECT count(*) FROM public.agent_referrals r WHERE r.agent_id = a.id),
    (SELECT count(*) FROM public.agent_commissions ac WHERE ac.agent_id = a.id),
    coalesce((SELECT sum(ac.amount) FROM public.agent_commissions ac WHERE ac.agent_id = a.id), 0),
    coalesce((SELECT sum(cc.amount) FROM public.coordinator_commissions cc WHERE cc.agent_id = a.id AND cc.coordinator_id = v_coordinator), 0)
  FROM public.agents a
  WHERE a.coordinator_id = v_coordinator
  ORDER BY a.created_at DESC;
END;
$$;

CREATE TRIGGER trg_coordinators_updated_at
BEFORE UPDATE ON public.coordinators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();