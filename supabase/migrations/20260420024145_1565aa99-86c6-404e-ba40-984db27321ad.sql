-- 1. family_members
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  member_phone TEXT NOT NULL,
  member_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, member_phone)
);

CREATE INDEX idx_family_members_owner ON public.family_members(owner_id);
CREATE INDEX idx_family_members_phone ON public.family_members(member_phone);
CREATE INDEX idx_family_members_token ON public.family_members(invite_token);

-- Enforce max 5 members per owner
CREATE OR REPLACE FUNCTION public.enforce_family_member_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.family_members WHERE owner_id = NEW.owner_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 family members allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_family_member_limit
  BEFORE INSERT ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_family_member_limit();

CREATE TRIGGER trg_family_members_updated
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their family members"
  ON public.family_members FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can read entries pointing to them"
  ON public.family_members FOR SELECT TO authenticated
  USING (auth.uid() = member_user_id);

CREATE POLICY "Members can accept their invite"
  ON public.family_members FOR UPDATE TO authenticated
  USING (auth.uid() = member_user_id) WITH CHECK (auth.uid() = member_user_id);

-- 2. last_known_locations
CREATE TABLE public.last_known_locations (
  user_id UUID PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  battery_level INTEGER,
  reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.last_known_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own location"
  ON public.last_known_locations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Accepted family members can read location"
  ON public.last_known_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.owner_id = last_known_locations.user_id
        AND fm.member_user_id = auth.uid()
        AND fm.status = 'accepted'
    )
  );

-- 3. sos_alerts
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_sos_alerts_user ON public.sos_alerts(user_id, created_at DESC);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SOS alerts"
  ON public.sos_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can read SOS alerts of owner"
  ON public.sos_alerts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.owner_id = sos_alerts.user_id
        AND fm.member_user_id = auth.uid()
        AND fm.status = 'accepted'
    )
  );

-- 4. sos_alert_recipients
CREATE TABLE public.sos_alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL, -- 'family' or 'merchant'
  recipient_user_id UUID,
  recipient_merchant_id UUID,
  recipient_phone TEXT,
  recipient_name TEXT,
  distance_meters DOUBLE PRECISION,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sos_recipients_alert ON public.sos_alert_recipients(alert_id);
CREATE INDEX idx_sos_recipients_merchant ON public.sos_alert_recipients(recipient_merchant_id);

ALTER TABLE public.sos_alert_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SOS owner can manage recipients"
  ON public.sos_alert_recipients FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sos_alerts WHERE id = sos_alert_recipients.alert_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.sos_alerts WHERE id = sos_alert_recipients.alert_id AND user_id = auth.uid())
  );

CREATE POLICY "Merchants can read alerts they were notified about"
  ON public.sos_alert_recipients FOR SELECT TO authenticated
  USING (
    recipient_merchant_id IN (
      SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alert_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;