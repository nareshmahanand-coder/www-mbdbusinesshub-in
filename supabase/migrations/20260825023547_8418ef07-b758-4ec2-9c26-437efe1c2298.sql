
-- Slug support for SEO-friendly public URLs
ALTER TABLE public.merchant_profiles ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(
      trim(both '-' from regexp_replace(lower(regexp_replace(_input, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')),
      ''
    ),
    'item'
  )
$$;

CREATE OR REPLACE FUNCTION public.set_merchant_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND TG_OP = 'UPDATE' AND NEW.shop_name IS NOT DISTINCT FROM OLD.shop_name THEN
    RETURN NEW;
  END IF;
  base := public.slugify(COALESCE(NEW.shop_name,'store') || '-' || COALESCE(NEW.city,''));
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.merchant_profiles m WHERE m.slug = candidate AND m.id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merchant_slug ON public.merchant_profiles;
CREATE TRIGGER trg_merchant_slug
BEFORE INSERT OR UPDATE ON public.merchant_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_merchant_slug();

CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND TG_OP = 'UPDATE' AND NEW.name IS NOT DISTINCT FROM OLD.name THEN
    RETURN NEW;
  END IF;
  base := public.slugify(COALESCE(NEW.name,'product'));
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products p WHERE p.slug = candidate AND p.id <> NEW.id) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_slug ON public.products;
CREATE TRIGGER trg_product_slug
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_product_slug();

UPDATE public.merchant_profiles SET slug = NULL WHERE slug IS NULL;
UPDATE public.products SET slug = NULL WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS merchant_profiles_slug_key ON public.merchant_profiles (slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);

-- Public, safe read surface for search engines and visitors (no KYC/ID fields)
CREATE OR REPLACE FUNCTION public.public_store_by_slug(p_slug text)
RETURNS TABLE (
  id uuid, slug text, shop_name text, shop_name_hindi text, category text,
  description text, address text, city text, pincode text, phone text, whatsapp text,
  photos text[], latitude numeric, longitude numeric,
  is_verified boolean, is_premium boolean, is_big_merchant boolean,
  rating numeric, review_count bigint, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.slug, m.shop_name, m.shop_name_hindi, m.category, m.description,
         m.address, m.city, m.pincode, m.phone, m.whatsapp, m.photos,
         m.latitude::numeric, m.longitude::numeric,
         m.is_verified, m.is_premium, m.is_big_merchant,
         COALESCE(round(avg(r.rating)::numeric, 1), 0) AS rating,
         count(r.id) AS review_count,
         m.updated_at
  FROM public.merchant_profiles m
  LEFT JOIN public.shop_ratings r ON r.shop_id = m.id::text
  WHERE m.slug = p_slug AND m.is_verified = true
  GROUP BY m.id
$$;

CREATE OR REPLACE FUNCTION public.public_store_products(p_store_id uuid)
RETURNS TABLE (id uuid, slug text, name text, name_hindi text, description text, price numeric, image_url text, in_stock boolean, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, p.name, p.name_hindi, p.description, p.price::numeric, p.image_url, p.in_stock, p.updated_at
  FROM public.products p
  JOIN public.merchant_profiles m ON m.id = p.merchant_id
  WHERE p.merchant_id = p_store_id AND m.is_verified = true AND p.moderation_status = 'approved'
  ORDER BY p.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.public_product_by_slug(p_slug text)
RETURNS TABLE (
  id uuid, slug text, name text, name_hindi text, description text, price numeric,
  image_url text, in_stock boolean, updated_at timestamptz,
  store_id uuid, store_slug text, store_name text, store_city text, store_address text, store_whatsapp text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, p.name, p.name_hindi, p.description, p.price::numeric, p.image_url, p.in_stock, p.updated_at,
         m.id, m.slug, m.shop_name, m.city, m.address, COALESCE(m.whatsapp, m.phone)
  FROM public.products p
  JOIN public.merchant_profiles m ON m.id = p.merchant_id
  WHERE p.slug = p_slug AND m.is_verified = true AND p.moderation_status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.public_seo_routes()
RETURNS TABLE (path text, lastmod timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT '/store/' || m.slug, m.updated_at FROM public.merchant_profiles m WHERE m.is_verified = true AND m.slug IS NOT NULL
  UNION ALL
  SELECT '/product/' || p.slug, p.updated_at
  FROM public.products p JOIN public.merchant_profiles m ON m.id = p.merchant_id
  WHERE m.is_verified = true AND p.moderation_status = 'approved' AND p.slug IS NOT NULL
$$;

GRANT EXECUTE ON FUNCTION public.public_store_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_store_products(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_product_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_seo_routes() TO anon, authenticated;
