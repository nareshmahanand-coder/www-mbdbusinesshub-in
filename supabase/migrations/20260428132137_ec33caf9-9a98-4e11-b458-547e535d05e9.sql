ALTER TABLE public.classified_conversations
ADD COLUMN IF NOT EXISTS archived_by uuid[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "Conversation members can delete conversations" ON public.classified_conversations;

CREATE POLICY "Conversation members can delete conversations"
ON public.classified_conversations
FOR DELETE
TO authenticated
USING ((auth.uid() = buyer_id) OR (auth.uid() = seller_id));