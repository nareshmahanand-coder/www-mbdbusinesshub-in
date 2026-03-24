
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'monthly',
  amount numeric NOT NULL DEFAULT 1,
  transaction_id text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'active',
  starts_at date NOT NULL DEFAULT CURRENT_DATE,
  ends_at date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own membership"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON public.memberships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
