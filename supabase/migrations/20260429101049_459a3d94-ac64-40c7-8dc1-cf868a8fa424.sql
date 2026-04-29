CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated;

DO $$
DECLARE
  pol record;
  next_sql text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual LIKE '%has_role(%'
        OR with_check LIKE '%has_role(%'
      )
  LOOP
    next_sql := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    IF pol.qual IS NOT NULL THEN
      next_sql := next_sql || format(' USING (%s)', replace(pol.qual, 'has_role(', 'private.has_role('));
    END IF;

    IF pol.with_check IS NOT NULL THEN
      next_sql := next_sql || format(' WITH CHECK (%s)', replace(pol.with_check, 'has_role(', 'private.has_role('));
    END IF;

    EXECUTE next_sql;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

COMMENT ON FUNCTION private.has_role(uuid, public.app_role) IS 'Internal role checker used by access rules; not exposed through the public API schema.';