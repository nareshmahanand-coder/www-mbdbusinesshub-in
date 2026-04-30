DROP POLICY IF EXISTS "Users can complete pending KYC uploads" ON public.kyc_requests;
CREATE POLICY "Users can complete pending KYC uploads"
ON public.kyc_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');