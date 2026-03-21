
DROP POLICY "Anyone can insert analytics" ON public.shop_analytics;
CREATE POLICY "Authenticated users can insert analytics" ON public.shop_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
