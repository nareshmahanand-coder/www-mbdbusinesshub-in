ALTER TABLE public.merchant_profiles
  ADD COLUMN IF NOT EXISTS category_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_tags text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.big_merchants
  ADD COLUMN IF NOT EXISTS category_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS merchant_profiles_service_tags_idx ON public.merchant_profiles USING gin (service_tags);
CREATE INDEX IF NOT EXISTS merchant_profiles_category_idx ON public.merchant_profiles (category);