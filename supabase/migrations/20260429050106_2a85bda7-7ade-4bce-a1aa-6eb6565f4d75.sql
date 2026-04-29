ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS job_category TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS exact_location TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS shift_timings TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS qualifications TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS responsibilities TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.job_contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  recruiter_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (job_id, seeker_id)
);

CREATE TABLE IF NOT EXISTS public.job_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  recruiter_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_by UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (job_id, seeker_id, recruiter_id)
);

CREATE TABLE IF NOT EXISTS public.job_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job seekers can create contact requests" ON public.job_contact_requests;
CREATE POLICY "Job seekers can create contact requests"
ON public.job_contact_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seeker_id
  AND seeker_id <> recruiter_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_contact_requests.job_id
      AND j.user_id = job_contact_requests.recruiter_id
      AND j.is_active IS NOT FALSE
  )
);

DROP POLICY IF EXISTS "Job request parties can view contact requests" ON public.job_contact_requests;
CREATE POLICY "Job request parties can view contact requests"
ON public.job_contact_requests
FOR SELECT
TO authenticated
USING (auth.uid() = seeker_id OR auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Recruiters can update job contact requests" ON public.job_contact_requests;
CREATE POLICY "Recruiters can update job contact requests"
ON public.job_contact_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Job seekers can start conversations" ON public.job_conversations;
CREATE POLICY "Job seekers can start conversations"
ON public.job_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seeker_id AND seeker_id <> recruiter_id);

DROP POLICY IF EXISTS "Job conversation members can view conversations" ON public.job_conversations;
CREATE POLICY "Job conversation members can view conversations"
ON public.job_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = seeker_id OR auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Job conversation members can update conversations" ON public.job_conversations;
CREATE POLICY "Job conversation members can update conversations"
ON public.job_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = seeker_id OR auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = seeker_id OR auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Job conversation members can delete conversations" ON public.job_conversations;
CREATE POLICY "Job conversation members can delete conversations"
ON public.job_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = seeker_id OR auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Job conversation members can view messages" ON public.job_messages;
CREATE POLICY "Job conversation members can view messages"
ON public.job_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_conversations c
    WHERE c.id = job_messages.conversation_id
      AND (c.seeker_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Job conversation members can send messages" ON public.job_messages;
CREATE POLICY "Job conversation members can send messages"
ON public.job_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.job_conversations c
    WHERE c.id = job_messages.conversation_id
      AND (c.seeker_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.touch_job_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.job_conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_job_conversation_on_message ON public.job_messages;
CREATE TRIGGER touch_job_conversation_on_message
AFTER INSERT ON public.job_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_job_conversation();

DROP TRIGGER IF EXISTS update_job_contact_requests_updated_at ON public.job_contact_requests;
CREATE TRIGGER update_job_contact_requests_updated_at
BEFORE UPDATE ON public.job_contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();