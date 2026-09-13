CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  public_code text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  jitsi_room text NOT NULL UNIQUE DEFAULT ('MBD-' || replace(gen_random_uuid()::text, '-', '')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their meetings"
ON public.meetings FOR SELECT TO authenticated
USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create meetings"
ON public.meetings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their meetings"
ON public.meetings FOR UPDATE TO authenticated
USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts can delete their meetings"
ON public.meetings FOR DELETE TO authenticated
USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX meetings_host_scheduled_idx ON public.meetings (host_id, scheduled_at DESC);
CREATE INDEX meetings_public_code_idx ON public.meetings (public_code);

CREATE TRIGGER meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.public_meeting_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  scheduled_at timestamptz,
  public_code text,
  jitsi_room text,
  status text,
  host_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.title,
    m.description,
    m.scheduled_at,
    m.public_code,
    m.jitsi_room,
    m.status,
    COALESCE(NULLIF(p.display_name, ''), 'Mera Bharat Dukaan Host') AS host_name
  FROM public.meetings m
  LEFT JOIN public.profiles p ON p.id = m.host_id
  WHERE m.public_code = trim(COALESCE(p_code, ''))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.public_meeting_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_meeting_by_code(text) TO anon, authenticated, service_role;