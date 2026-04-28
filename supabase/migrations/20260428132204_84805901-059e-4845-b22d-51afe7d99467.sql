REVOKE EXECUTE ON FUNCTION public.touch_classified_conversation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_classified_conversation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_classified_conversation() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;