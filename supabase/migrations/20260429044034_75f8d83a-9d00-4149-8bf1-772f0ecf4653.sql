CREATE TABLE IF NOT EXISTS public.classified_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT classified_contact_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT classified_contact_requests_no_self_request CHECK (buyer_id <> seller_id),
  CONSTRAINT classified_contact_requests_unique UNIQUE (classified_id, buyer_id)
);

ALTER TABLE public.classified_contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can create contact requests"
ON public.classified_contact_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND buyer_id <> seller_id
  AND EXISTS (
    SELECT 1 FROM public.classifieds c
    WHERE c.id = classified_contact_requests.classified_id
      AND c.user_id = classified_contact_requests.seller_id
      AND c.is_sold IS NOT TRUE
  )
);

CREATE POLICY "Request parties can view contact requests"
ON public.classified_contact_requests
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can update contact request status"
ON public.classified_contact_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_classified_contact_requests_updated_at
BEFORE UPDATE ON public.classified_contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_classified_contact_requests_buyer ON public.classified_contact_requests(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_classified_contact_requests_seller ON public.classified_contact_requests(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_classified_contact_requests_classified ON public.classified_contact_requests(classified_id);