CREATE OR REPLACE FUNCTION public.agent_transaction_log(
  p_agent_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 200,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  agent_id uuid,
  agent_code text,
  agent_name text,
  merchant_user_id uuid,
  merchant_name text,
  shop_name text,
  plan text,
  module text,
  amount numeric,
  razorpay_payment_id text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
  v_agent uuid;
  v_search text := NULLIF(trim(coalesce(p_search, '')), '');
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  v_is_admin := public.has_role(v_uid, 'admin');

  IF v_is_admin THEN
    v_agent := p_agent_id;
  ELSE
    SELECT a.id INTO v_agent FROM public.agents a WHERE a.user_id = v_uid LIMIT 1;
    IF v_agent IS NULL THEN RETURN; END IF;
  END IF;

  RETURN QUERY
  WITH rows AS (
    SELECT
      c.id,
      c.created_at,
      c.agent_id,
      a.agent_code,
      a.name AS agent_name,
      c.merchant_user_id,
      coalesce(NULLIF(p.display_name, ''), p.email, '') AS merchant_name,
      coalesce(m.shop_name, '') AS shop_name,
      c.plan,
      coalesce(o.module, '') AS module,
      c.amount,
      c.razorpay_payment_id
    FROM public.agent_commissions c
    JOIN public.agents a ON a.id = c.agent_id
    LEFT JOIN public.profiles p ON p.id = c.merchant_user_id
    LEFT JOIN public.merchant_profiles m ON m.user_id = c.merchant_user_id
    LEFT JOIN public.payment_orders o ON o.id = c.payment_order_id
    WHERE (v_agent IS NULL OR c.agent_id = v_agent)
      AND (p_from IS NULL OR c.created_at >= p_from)
      AND (p_to IS NULL OR c.created_at <= p_to)
      AND (
        v_search IS NULL
        OR a.agent_code ILIKE '%' || v_search || '%'
        OR a.name ILIKE '%' || v_search || '%'
        OR coalesce(p.display_name, '') ILIKE '%' || v_search || '%'
        OR coalesce(p.email, '') ILIKE '%' || v_search || '%'
        OR coalesce(m.shop_name, '') ILIKE '%' || v_search || '%'
        OR coalesce(c.plan, '') ILIKE '%' || v_search || '%'
      )
  )
  SELECT r.*, (SELECT count(*) FROM rows) AS total_count
  FROM rows r
  ORDER BY r.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 200), 1000))
  OFFSET greatest(0, coalesce(p_offset, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.agent_transaction_log(uuid, text, timestamptz, timestamptz, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_transaction_log(uuid, text, timestamptz, timestamptz, integer, integer) TO authenticated, service_role;