DROP POLICY IF EXISTS "Job seekers can start conversations" ON public.job_conversations;
CREATE POLICY "Job seekers can start conversations"
ON public.job_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seeker_id
  AND seeker_id <> recruiter_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_conversations.job_id
      AND j.user_id = job_conversations.recruiter_id
      AND j.is_active IS NOT FALSE
  )
);