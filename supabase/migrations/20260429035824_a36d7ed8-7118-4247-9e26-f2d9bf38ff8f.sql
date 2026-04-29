CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_user_id uuid,
  recipient_group text NOT NULL DEFAULT 'all',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_messages' AND policyname = 'Admins can create admin messages'
  ) THEN
    CREATE POLICY "Admins can create admin messages"
    ON public.admin_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_messages' AND policyname = 'Admins can view all admin messages'
  ) THEN
    CREATE POLICY "Admins can view all admin messages"
    ON public.admin_messages
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_messages' AND policyname = 'Users can view addressed admin messages'
  ) THEN
    CREATE POLICY "Users can view addressed admin messages"
    ON public.admin_messages
    FOR SELECT
    TO authenticated
    USING (
      recipient_user_id = auth.uid()
      OR recipient_group = 'all'
      OR (recipient_group = 'merchants' AND EXISTS (SELECT 1 FROM public.merchant_profiles mp WHERE mp.user_id = auth.uid()))
      OR (recipient_group = 'customers' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()))
    );
  END IF;
END $$;

ALTER TABLE public.matrimony_profiles
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS admin_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

ALTER TABLE public.merchant_profiles
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient_user ON public.admin_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_group_created ON public.admin_messages(recipient_group, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matrimony_profiles_moderation ON public.matrimony_profiles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_family_members_admin_status ON public.family_members(admin_status);