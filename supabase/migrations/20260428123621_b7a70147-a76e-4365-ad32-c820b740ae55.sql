CREATE TABLE IF NOT EXISTS public.classified_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id uuid NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classified_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS public.classified_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.classified_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation members can view conversations" ON public.classified_conversations;
CREATE POLICY "Conversation members can view conversations"
ON public.classified_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can start conversations" ON public.classified_conversations;
CREATE POLICY "Buyers can start conversations"
ON public.classified_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);

DROP POLICY IF EXISTS "Conversation members can update conversations" ON public.classified_conversations;
CREATE POLICY "Conversation members can update conversations"
ON public.classified_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Conversation members can view messages" ON public.classified_messages;
CREATE POLICY "Conversation members can view messages"
ON public.classified_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classified_conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Conversation members can send messages" ON public.classified_messages;
CREATE POLICY "Conversation members can send messages"
ON public.classified_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.classified_conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.touch_classified_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.classified_conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_classified_conversation_on_message ON public.classified_messages;
CREATE TRIGGER touch_classified_conversation_on_message
AFTER INSERT ON public.classified_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_classified_conversation();

DROP TRIGGER IF EXISTS update_classified_conversations_updated_at ON public.classified_conversations;
CREATE TRIGGER update_classified_conversations_updated_at
BEFORE UPDATE ON public.classified_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_classified_conversations_members ON public.classified_conversations (buyer_id, seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_conversations_classified ON public.classified_conversations (classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_messages_conversation_created ON public.classified_messages (conversation_id, created_at);