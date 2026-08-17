-- Coordinators can view agents bound to them
DROP POLICY IF EXISTS "Coordinators can view their team agents" ON public.agents;
CREATE POLICY "Coordinators can view their team agents"
ON public.agents FOR SELECT TO authenticated
USING (
  coordinator_id IS NOT NULL
  AND coordinator_id IN (SELECT c.id FROM public.coordinators c WHERE c.user_id = auth.uid())
);

-- Agents can view referrals of their team? (coordinators view team referrals)
DROP POLICY IF EXISTS "Coordinators can view team referrals" ON public.agent_referrals;
CREATE POLICY "Coordinators can view team referrals"
ON public.agent_referrals FOR SELECT TO authenticated
USING (
  agent_id IN (
    SELECT a.id FROM public.agents a
    JOIN public.coordinators c ON c.id = a.coordinator_id
    WHERE c.user_id = auth.uid()
  )
);

-- Realtime
ALTER TABLE public.coordinators REPLICA IDENTITY FULL;
ALTER TABLE public.coordinator_commissions REPLICA IDENTITY FULL;
ALTER TABLE public.coordinator_withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.agent_referrals REPLICA IDENTITY FULL;
ALTER TABLE public.agent_withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.agents REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='coordinators') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinators;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='coordinator_commissions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinator_commissions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='coordinator_withdrawals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinator_withdrawals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='agent_referrals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_referrals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='agent_withdrawals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_withdrawals;
  END IF;
END $$;