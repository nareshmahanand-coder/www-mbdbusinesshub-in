
-- Allow admins to update memberships (for approval)
CREATE POLICY "Admins can update memberships"
  ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all memberships
CREATE POLICY "Admins can read all memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
