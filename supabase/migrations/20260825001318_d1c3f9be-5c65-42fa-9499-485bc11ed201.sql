CREATE OR REPLACE FUNCTION public.shop_media_cards(shop_ids uuid[])
RETURNS TABLE (
  id uuid,
  shop_name text,
  shop_name_hindi text,
  city text,
  category text,
  photo_url text,
  whatsapp text,
  is_big_merchant boolean,
  video_ad_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.shop_name,
    m.shop_name_hindi,
    m.city,
    m.category,
    (CASE WHEN m.photos IS NOT NULL AND array_length(m.photos, 1) > 0 THEN m.photos[1] ELSE NULL END)::text,
    m.whatsapp,
    COALESCE(m.is_big_merchant, false),
    bm.video_ad_url
  FROM public.merchant_profiles m
  LEFT JOIN public.big_merchants bm ON bm.id::text = m.big_merchant_id::text
  WHERE m.id = ANY(shop_ids);
$$;

GRANT EXECUTE ON FUNCTION public.shop_media_cards(uuid[]) TO anon, authenticated, service_role;