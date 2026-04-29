CREATE TABLE IF NOT EXISTS public.shop_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shop ratings"
ON public.shop_ratings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own shop ratings"
ON public.shop_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shop ratings"
ON public.shop_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage shop ratings"
ON public.shop_ratings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_shop_ratings_updated_at
BEFORE UPDATE ON public.shop_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_shop_ratings_shop_id ON public.shop_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_ratings_user_id ON public.shop_ratings(user_id);