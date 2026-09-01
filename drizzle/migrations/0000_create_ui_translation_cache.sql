CREATE TABLE IF NOT EXISTS public.ui_translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_text, target_lang)
);

GRANT SELECT ON public.ui_translation_cache TO anon;
GRANT SELECT ON public.ui_translation_cache TO authenticated;
GRANT ALL ON public.ui_translation_cache TO service_role;

ALTER TABLE public.ui_translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UI translations are publicly readable"
ON public.ui_translation_cache
FOR SELECT
USING (true);