ALTER TABLE public.complaints ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Admins can update complaints"
  ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));