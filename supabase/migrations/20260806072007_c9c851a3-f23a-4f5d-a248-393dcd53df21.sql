ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS account_holder_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS ifsc_code text,
  ADD COLUMN IF NOT EXISTS upi_id text;

CREATE TABLE IF NOT EXISTS public.agent_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
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

GRANT SELECT, INSERT ON public.agent_withdrawals TO authenticated;
GRANT ALL ON public.agent_withdrawals TO service_role;

ALTER TABLE public.agent_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own withdrawals"
  ON public.agent_withdrawals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents create own withdrawals"
  ON public.agent_withdrawals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.agents a WHERE a.id = agent_id AND a.user_id = auth.uid() AND a.status = 'approved'
  ));

CREATE POLICY "Admins update withdrawals"
  ON public.agent_withdrawals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_agent_withdrawals_updated_at
  BEFORE UPDATE ON public.agent_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_agent_withdrawal_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_balance numeric;
BEGIN
  SELECT wallet_balance INTO v_balance FROM public.agents WHERE id = NEW.agent_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;
  IF NEW.amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 1000';
  END IF;
  IF NEW.amount > v_balance THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  UPDATE public.agents
    SET wallet_balance = wallet_balance - NEW.amount, updated_at = now()
    WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_withdrawal_request
  BEFORE INSERT ON public.agent_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.handle_agent_withdrawal_request();

CREATE OR REPLACE FUNCTION public.handle_agent_withdrawal_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    UPDATE public.agents
      SET wallet_balance = wallet_balance + OLD.amount, updated_at = now()
      WHERE id = OLD.agent_id;
  END IF;
  IF NEW.status = 'paid' AND OLD.status <> 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_withdrawal_refund
  BEFORE UPDATE ON public.agent_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.handle_agent_withdrawal_refund();