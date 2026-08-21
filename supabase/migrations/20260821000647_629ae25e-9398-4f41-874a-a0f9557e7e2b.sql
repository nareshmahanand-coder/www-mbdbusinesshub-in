REVOKE EXECUTE ON FUNCTION public.lookup_big_merchant_by_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_big_merchant_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_big_merchant_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_big_merchant_privileged_columns() FROM anon, authenticated;