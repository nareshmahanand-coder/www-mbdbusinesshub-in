CREATE TABLE public.account_delete_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  user_phone text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewer_notes text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_delete_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own delete requests"
ON public.account_delete_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own delete requests"
ON public.account_delete_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all delete requests"
ON public.account_delete_requests FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update delete requests"
ON public.account_delete_requests FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete delete requests"
ON public.account_delete_requests FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_account_delete_requests_updated_at
BEFORE UPDATE ON public.account_delete_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_account_delete_requests_status ON public.account_delete_requests(status, created_at DESC);