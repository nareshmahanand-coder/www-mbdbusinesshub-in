CREATE TABLE public.razorpay_subscription_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_order_id uuid NOT NULL REFERENCES public.payment_orders(id),
  module text NOT NULL,
  plan text NOT NULL,
  razorpay_subscription_id text NOT NULL UNIQUE,
  razorpay_plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'created',
  last_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.razorpay_subscription_mappings TO authenticated;
GRANT ALL ON public.razorpay_subscription_mappings TO service_role;
ALTER TABLE public.razorpay_subscription_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own Razorpay subscriptions" ON public.razorpay_subscription_mappings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage Razorpay subscriptions" ON public.razorpay_subscription_mappings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_razorpay_subscriptions_user ON public.razorpay_subscription_mappings(user_id, created_at DESC);
CREATE INDEX idx_razorpay_subscriptions_order ON public.razorpay_subscription_mappings(payment_order_id);

CREATE TABLE public.payment_attempt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_order_id uuid NOT NULL REFERENCES public.payment_orders(id),
  provider_event_id text,
  provider_payment_id text,
  event_type text NOT NULL,
  status text NOT NULL,
  safe_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_attempt_events TO authenticated;
GRANT ALL ON public.payment_attempt_events TO service_role;
ALTER TABLE public.payment_attempt_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payment attempts" ON public.payment_attempt_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage payment attempts" ON public.payment_attempt_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_payment_attempt_events_user_created ON public.payment_attempt_events(user_id, created_at DESC);
CREATE UNIQUE INDEX idx_payment_attempt_events_provider_event ON public.payment_attempt_events(provider_event_id) WHERE provider_event_id IS NOT NULL;
CREATE UNIQUE INDEX idx_payment_attempt_events_provider_payment ON public.payment_attempt_events(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX idx_agent_commissions_payment_once ON public.agent_commissions(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX idx_coordinator_commissions_payment_once ON public.coordinator_commissions(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can create own payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Users can insert own bharat gaurav membership" ON public.bharat_gaurav_memberships;
DROP POLICY IF EXISTS "Users can insert own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own user_profile" ON public.user_profiles;
REVOKE ALL ON TABLE public.payment_orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_orders TO authenticated;
GRANT ALL ON TABLE public.payment_orders TO service_role;
REVOKE ALL ON TABLE public.bharat_gaurav_memberships FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bharat_gaurav_memberships TO authenticated;
GRANT ALL ON TABLE public.bharat_gaurav_memberships TO service_role;
REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;

CREATE OR REPLACE FUNCTION public.protect_paid_entitlement_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_trusted boolean := current_setting('request.jwt.claim.role', true) = 'service_role'
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));
BEGIN
  IF v_trusted THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'coordinators' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending'; NEW.subscription_status := 'inactive'; NEW.subscription_plan := NULL;
      NEW.subscription_started_at := NULL; NEW.subscription_expires_at := NULL; NEW.wallet_balance := 0; NEW.admin_notes := '';
    ELSE
      NEW.status := OLD.status; NEW.subscription_status := OLD.subscription_status; NEW.subscription_plan := OLD.subscription_plan;
      NEW.subscription_started_at := OLD.subscription_started_at; NEW.subscription_expires_at := OLD.subscription_expires_at;
      NEW.wallet_balance := OLD.wallet_balance; NEW.admin_notes := OLD.admin_notes; NEW.coordinator_code := OLD.coordinator_code;
    END IF;
  ELSIF TG_TABLE_NAME = 'big_merchants' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending'; NEW.subscription_status := 'inactive'; NEW.subscription_plan := NULL;
      NEW.subscription_started_at := NULL; NEW.subscription_expires_at := NULL; NEW.admin_notes := '';
    ELSE
      NEW.status := OLD.status; NEW.subscription_status := OLD.subscription_status; NEW.subscription_plan := OLD.subscription_plan;
      NEW.subscription_started_at := OLD.subscription_started_at; NEW.subscription_expires_at := OLD.subscription_expires_at;
      NEW.admin_notes := OLD.admin_notes; NEW.big_merchant_id := OLD.big_merchant_id;
      IF OLD.coordinator_id IS NOT NULL THEN NEW.coordinator_id := OLD.coordinator_id; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'merchant_profiles' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := false; NEW.is_premium := false; NEW.premium_plan := NULL; NEW.premium_start_date := NULL;
      NEW.plan_ends_at := NULL; NEW.is_big_merchant := false; NEW.big_merchant_id := NULL;
    ELSE
      NEW.is_verified := OLD.is_verified; NEW.is_premium := OLD.is_premium; NEW.premium_plan := OLD.premium_plan;
      NEW.premium_start_date := OLD.premium_start_date; NEW.plan_ends_at := OLD.plan_ends_at;
      NEW.is_big_merchant := OLD.is_big_merchant; NEW.big_merchant_id := OLD.big_merchant_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'matrimony_profiles' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_published := false; NEW.subscription_plan := NULL; NEW.subscription_start := NULL; NEW.subscription_end := NULL;
    ELSE
      NEW.is_published := OLD.is_published; NEW.subscription_plan := OLD.subscription_plan;
      NEW.subscription_start := OLD.subscription_start; NEW.subscription_end := OLD.subscription_end;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_paid_entitlement_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_coordinator_paid_fields BEFORE INSERT OR UPDATE ON public.coordinators FOR EACH ROW EXECUTE FUNCTION public.protect_paid_entitlement_fields();
CREATE TRIGGER protect_big_merchant_paid_fields BEFORE INSERT OR UPDATE ON public.big_merchants FOR EACH ROW EXECUTE FUNCTION public.protect_paid_entitlement_fields();
CREATE TRIGGER protect_merchant_paid_fields BEFORE INSERT OR UPDATE ON public.merchant_profiles FOR EACH ROW EXECUTE FUNCTION public.protect_paid_entitlement_fields();
CREATE TRIGGER protect_matrimony_paid_fields BEFORE INSERT OR UPDATE ON public.matrimony_profiles FOR EACH ROW EXECUTE FUNCTION public.protect_paid_entitlement_fields();

CREATE OR REPLACE FUNCTION public.fulfill_razorpay_payment(
  p_payment_order_id uuid,
  p_payment_id text,
  p_provider_event_id text,
  p_amount_paise bigint,
  p_currency text,
  p_signature text DEFAULT NULL,
  p_source text DEFAULT 'razorpay'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order public.payment_orders%ROWTYPE;
  v_expected bigint;
  v_days integer;
  v_start timestamptz := now();
  v_end timestamptz;
  v_base_end timestamptz;
  v_inserted integer;
  v_agent public.agents%ROWTYPE;
  v_coordinator public.coordinators%ROWTYPE;
  v_big public.big_merchants%ROWTYPE;
  v_sub_id text;
  v_event_status text := 'captured';
BEGIN
  IF p_payment_order_id IS NULL OR coalesce(p_payment_id, '') !~ '^pay_[A-Za-z0-9]+' THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;
  SELECT * INTO v_order FROM public.payment_orders WHERE id = p_payment_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment order not found'; END IF;
  IF coalesce(upper(p_currency), '') <> 'INR' THEN RAISE EXCEPTION 'Payment currency mismatch'; END IF;
  v_expected := CASE v_order.module
    WHEN 'bharat_gaurav' THEN CASE v_order.plan WHEN 'monthly' THEN 1000 WHEN 'yearly' THEN 10000 ELSE NULL END
    WHEN 'merchant_premium' THEN CASE v_order.plan WHEN 'monthly' THEN 9900 WHEN 'yearly' THEN 99900 ELSE NULL END
    WHEN 'marriage_bureau' THEN CASE v_order.plan WHEN 'monthly' THEN 9900 WHEN 'yearly' THEN 99900 ELSE NULL END
    WHEN 'coordinator' THEN CASE v_order.plan WHEN 'monthly' THEN 10000 WHEN 'yearly' THEN 100000 ELSE NULL END
    WHEN 'big_merchant' THEN CASE v_order.plan WHEN 'monthly' THEN 160000 WHEN 'yearly' THEN 1600000 ELSE NULL END
    ELSE NULL END;
  IF v_expected IS NULL OR p_amount_paise <> v_expected OR round(v_order.amount * 100)::bigint <> v_expected THEN
    RAISE EXCEPTION 'Payment amount does not match this plan';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payment_orders WHERE razorpay_payment_id = p_payment_id AND id <> v_order.id)
     OR EXISTS (SELECT 1 FROM public.payment_attempt_events WHERE provider_payment_id = p_payment_id) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'user_id', v_order.user_id);
  END IF;
  IF v_order.module = 'merchant_premium' AND NOT EXISTS (SELECT 1 FROM public.merchant_profiles WHERE user_id = v_order.user_id) THEN RAISE EXCEPTION 'Merchant account not found'; END IF;
  IF v_order.module = 'marriage_bureau' AND NOT EXISTS (SELECT 1 FROM public.matrimony_profiles WHERE user_id = v_order.user_id) THEN RAISE EXCEPTION 'Marriage profile not found'; END IF;
  IF v_order.module = 'coordinator' AND NOT EXISTS (SELECT 1 FROM public.coordinators WHERE user_id = v_order.user_id) THEN RAISE EXCEPTION 'Coordinator account not found'; END IF;
  IF v_order.module = 'big_merchant' AND NOT EXISTS (SELECT 1 FROM public.big_merchants WHERE user_id = v_order.user_id) THEN RAISE EXCEPTION 'Golden Merchant account not found'; END IF;
  INSERT INTO public.payment_attempt_events(user_id,payment_order_id,provider_event_id,provider_payment_id,event_type,status,safe_message)
  VALUES(v_order.user_id,v_order.id,p_provider_event_id,p_payment_id,'payment.captured',v_event_status,NULL)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN RETURN jsonb_build_object('ok', true, 'duplicate', true, 'user_id', v_order.user_id); END IF;
  v_days := CASE v_order.plan WHEN 'yearly' THEN 365 ELSE 30 END;
  UPDATE public.payment_orders SET status='paid',razorpay_payment_id=p_payment_id,razorpay_signature=p_signature,
    unlocked_at=now(),error_message=NULL,metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('verified_source',left(coalesce(p_source,'razorpay'),40))
    WHERE id=v_order.id;
  IF v_order.module = 'bharat_gaurav' THEN
    SELECT max(expires_at) INTO v_base_end FROM public.bharat_gaurav_memberships WHERE user_id=v_order.user_id AND status='active';
    v_start := greatest(now(),coalesce(v_base_end,now())); v_end := v_start + make_interval(days=>v_days);
    INSERT INTO public.bharat_gaurav_memberships(user_id,plan,amount,currency,status,payment_order_id,razorpay_payment_id,razorpay_order_id,started_at,expires_at)
      VALUES(v_order.user_id,v_order.plan,v_order.amount,'INR','active',v_order.id,p_payment_id,v_order.razorpay_order_id,v_start,v_end);
    INSERT INTO public.user_profiles(user_id,membership_status,membership_type,plan_type,current_period_end,razorpay_payment_id,razorpay_subscription_id)
      VALUES(v_order.user_id,'active','bharat_gaurav',v_order.plan,v_end,p_payment_id,NULL)
      ON CONFLICT(user_id) DO UPDATE SET membership_status='active',membership_type='bharat_gaurav',plan_type=EXCLUDED.plan_type,
        current_period_end=EXCLUDED.current_period_end,razorpay_payment_id=EXCLUDED.razorpay_payment_id,updated_at=now();
  ELSIF v_order.module = 'merchant_premium' THEN
    SELECT greatest(now(),coalesce(plan_ends_at::timestamptz,now())) INTO v_start FROM public.merchant_profiles WHERE user_id=v_order.user_id FOR UPDATE;
    v_end := v_start + make_interval(days=>v_days);
    UPDATE public.merchant_profiles SET is_premium=true,premium_plan=v_order.plan,premium_start_date=now(),plan_ends_at=v_end::date,access_status='active'
      WHERE user_id=v_order.user_id;
  ELSIF v_order.module = 'marriage_bureau' THEN
    SELECT greatest(now(),coalesce(subscription_end::timestamp with time zone,now())) INTO v_start FROM public.matrimony_profiles WHERE user_id=v_order.user_id FOR UPDATE;
    v_end := v_start + make_interval(days=>v_days);
    UPDATE public.matrimony_profiles SET is_published=true,subscription_plan=v_order.plan,subscription_start=v_start::date,subscription_end=v_end::date
      WHERE user_id=v_order.user_id;
  ELSIF v_order.module = 'coordinator' THEN
    SELECT greatest(now(),coalesce(subscription_expires_at,now())) INTO v_start FROM public.coordinators WHERE user_id=v_order.user_id FOR UPDATE;
    v_end := v_start + make_interval(days=>v_days);
    UPDATE public.coordinators SET subscription_status='active',subscription_plan=v_order.plan,subscription_started_at=v_start,subscription_expires_at=v_end,updated_at=now()
      WHERE user_id=v_order.user_id;
  ELSIF v_order.module = 'big_merchant' THEN
    SELECT * INTO v_big FROM public.big_merchants WHERE user_id=v_order.user_id FOR UPDATE;
    v_start := greatest(now(),coalesce(v_big.subscription_expires_at,now())); v_end := v_start + make_interval(days=>v_days);
    UPDATE public.big_merchants SET subscription_status='active',subscription_plan=v_order.plan,subscription_started_at=v_start,subscription_expires_at=v_end,updated_at=now()
      WHERE id=v_big.id;
    UPDATE public.merchant_profiles SET is_big_merchant=true,big_merchant_id=v_big.big_merchant_id,is_premium=true,premium_plan=v_order.plan,premium_start_date=v_start,plan_ends_at=v_end::date,access_status='active'
      WHERE user_id=v_order.user_id;
  END IF;
  SELECT * INTO v_agent FROM public.agents a JOIN public.agent_referrals r ON r.agent_id=a.id WHERE r.merchant_user_id=v_order.user_id AND a.status='approved' ORDER BY r.created_at ASC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.agent_commissions(agent_id,merchant_user_id,payment_order_id,razorpay_payment_id,plan,amount,note)
      VALUES(v_agent.id,v_order.user_id,v_order.id,p_payment_id,v_order.plan,round(v_order.amount*0.10,2),'10% subscription commission') ON CONFLICT DO NOTHING;
    IF v_order.module <> 'big_merchant' AND v_agent.coordinator_id IS NOT NULL THEN
      SELECT * INTO v_coordinator FROM public.coordinators WHERE id=v_agent.coordinator_id FOR UPDATE;
      IF FOUND AND v_coordinator.status='approved' AND v_coordinator.subscription_status='active' AND (v_coordinator.subscription_expires_at IS NULL OR v_coordinator.subscription_expires_at>now()) THEN
        INSERT INTO public.coordinator_commissions(coordinator_id,agent_id,merchant_user_id,payment_order_id,razorpay_payment_id,plan,amount,note)
          VALUES(v_coordinator.id,v_agent.id,v_order.user_id,v_order.id,p_payment_id,v_order.plan,round(v_order.amount*0.02,2),'2% subscription commission') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  IF v_order.module='big_merchant' THEN
    SELECT coordinator_id INTO v_sub_id FROM public.big_merchants WHERE user_id=v_order.user_id;
    IF v_sub_id IS NOT NULL THEN
      INSERT INTO public.coordinator_commissions(coordinator_id,merchant_user_id,payment_order_id,razorpay_payment_id,plan,amount,note)
        VALUES(v_sub_id::uuid,v_order.user_id,v_order.id,p_payment_id,v_order.plan,600,'Golden Merchant coordinator commission') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  SELECT razorpay_subscription_id INTO v_sub_id FROM public.razorpay_subscription_mappings WHERE payment_order_id=v_order.id ORDER BY created_at DESC LIMIT 1;
  IF v_sub_id IS NOT NULL THEN
    UPDATE public.razorpay_subscription_mappings SET status='active',last_payment_id=p_payment_id,updated_at=now() WHERE razorpay_subscription_id=v_sub_id;
    IF v_order.module='bharat_gaurav' THEN
      UPDATE public.user_profiles SET razorpay_subscription_id=v_sub_id WHERE user_id=v_order.user_id;
    END IF;
  END IF;
  RETURN jsonb_build_object('ok',true,'duplicate',false,'user_id',v_order.user_id,'module',v_order.module,'plan',v_order.plan,'expires_at',v_end);
END;
$$;
REVOKE ALL ON FUNCTION public.fulfill_razorpay_payment(uuid,text,text,bigint,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_razorpay_payment(uuid,text,text,bigint,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_razorpay_payment_failure(p_payment_order_id uuid,p_payment_id text,p_provider_event_id text,p_safe_message text DEFAULT 'Payment failed at Razorpay')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_order public.payment_orders%ROWTYPE; v_rows integer;
BEGIN
  SELECT * INTO v_order FROM public.payment_orders WHERE id=p_payment_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','unknown_order'); END IF;
  INSERT INTO public.payment_attempt_events(user_id,payment_order_id,provider_event_id,provider_payment_id,event_type,status,safe_message)
  VALUES(v_order.user_id,v_order.id,p_provider_event_id,p_payment_id,'payment.failed','failed',left(coalesce(p_safe_message,'Payment failed at Razorpay'),160)) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  IF v_rows>0 AND v_order.status<>'paid' THEN
    UPDATE public.payment_orders SET status='failed',razorpay_payment_id=NULL,error_message='Payment failed' WHERE id=v_order.id;
  END IF;
  RETURN jsonb_build_object('ok',true,'recorded',v_rows>0,'user_id',v_order.user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.record_razorpay_payment_failure(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_razorpay_payment_failure(uuid,text,text,text) TO service_role;
