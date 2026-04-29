GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Keep the helper callable by policies and client queries while preserving security-definer behavior.
COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS 'Safely checks application roles for RLS policies without exposing the user_roles table.';