CREATE OR REPLACE FUNCTION public.golden_merchant_video_ads()
RETURNS TABLE (
  id uuid,
  big_merchant_id text,
  shop_name text,
  city text,
  category text,
  video_ad_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.big_merchant_id, b.shop_name, b.city, b.category, b.video_ad_url
  FROM public.big_merchants b
  WHERE b.status = 'approved'
    AND COALESCE(b.video_ad_url, '') <> ''
  ORDER BY b.created_at DESC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.golden_merchant_video_ads() TO anon, authenticated;