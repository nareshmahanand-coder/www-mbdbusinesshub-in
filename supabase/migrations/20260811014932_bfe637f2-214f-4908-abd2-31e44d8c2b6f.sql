CREATE OR REPLACE FUNCTION public.agent_binding_for_email(p_email text)
RETURNS TABLE(bound boolean, agent_code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_uid uuid;
  v_code text;
  v_email text := lower(trim(coalesce(p_email, '')));
BEGIN
  IF v_email = '' THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  SELECT u.id INTO v_uid FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  SELECT a.agent_code INTO v_code
  FROM public.agent_referrals r
  JOIN public.agents a ON a.id = r.agent_id
  WHERE r.merchant_user_id = v_uid
  ORDER BY r.created_at ASC
  LIMIT 1;

  RETURN QUERY SELECT (v_code IS NOT NULL), v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_binding_for_email(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.agent_binding_for_user(p_user_id uuid)
RETURNS TABLE(bound boolean, agent_code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_code text;
BEGIN
  SELECT a.agent_code INTO v_code
  FROM public.agent_referrals r
  JOIN public.agents a ON a.id = r.agent_id
  WHERE r.merchant_user_id = p_user_id
  ORDER BY r.created_at ASC
  LIMIT 1;
  RETURN QUERY SELECT (v_code IS NOT NULL), v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_binding_for_user(uuid) TO anon, authenticated;