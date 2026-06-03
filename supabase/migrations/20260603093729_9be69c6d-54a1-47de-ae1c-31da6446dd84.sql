CREATE OR REPLACE FUNCTION public.dispatch_admin_message_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://tkenjzcyvnqnhgntmmen.supabase.co/functions/v1/send-push';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZW5qemN5dm5xbmhnbnRtbWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzM4NjUsImV4cCI6MjA4OTQwOTg2NX0.GmN1flaYiYGXxCui8GtMdBJ1Ym4XDZE8DsYvl2Gy7tc';
  v_link text;
  v_payload jsonb;
BEGIN
  v_link := (regexp_match(coalesce(NEW.message,''), '/(ekyc\?mode=upload[^\s]*|membership|merchant|matrimony)(\?[^\s]*)?'))[1];
  IF v_link IS NOT NULL THEN
    v_link := '/' || v_link;
  END IF;

  v_payload := jsonb_build_object(
    'title', NEW.title,
    'message', NEW.message,
    'link', coalesce(v_link, '/'),
    'severity', NEW.severity,
    'recipient_group', coalesce(NEW.recipient_group, 'all')
  );

  IF NEW.recipient_user_id IS NOT NULL THEN
    v_payload := v_payload || jsonb_build_object('user_id', NEW.recipient_user_id);
  END IF;

  PERFORM extensions.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'dispatch_admin_message_push failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_messages_push_trigger ON public.admin_messages;
CREATE TRIGGER admin_messages_push_trigger
AFTER INSERT ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.dispatch_admin_message_push();