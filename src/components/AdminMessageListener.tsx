import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AdminMessage = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

type AdminMessageQueryClient = {
  from: (table: "admin_messages") => {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: AdminMessage[] | null }>;
      };
    };
  };
};

const AdminMessageListener = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const getActionLink = (text: string) => text.match(/\/ekyc\?mode=upload[^\s]*/)?.[0] || "";

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const { data } = await (supabase as unknown as AdminMessageQueryClient)
        .from("admin_messages")
        .select("id, title, message, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      setMessages(data ?? []);
    };

    void loadMessages();
    const channel = supabase
      .channel("admin-message-listener")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_messages" }, () => void loadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!messages.length) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-2">
      {messages.map((message) => (
        <Alert key={message.id} className="border-primary/30 bg-background shadow-lg">
          <Bell className="h-4 w-4" />
          <AlertTitle className="pr-8">{message.title}</AlertTitle>
          <AlertDescription className="text-xs">{message.message}</AlertDescription>
          {getActionLink(message.message) && (
            <Button size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => { window.location.href = getActionLink(message.message); }}>
              e-KYC upload form खोलें
            </Button>
          )}
          <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs" onClick={() => setMessages((prev) => prev.filter((m) => m.id !== message.id))}>Dismiss</Button>
        </Alert>
      ))}
    </div>
  );
};

export default AdminMessageListener;