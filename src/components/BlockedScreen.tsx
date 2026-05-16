import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Ban, LogOut, Send } from "lucide-react";
import { toast } from "sonner";

interface Props { reason: string; }

const BlockedScreen = ({ reason }: Props) => {
  const { user, signOut } = useAuth();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const sendAppeal = async () => {
    if (!msg.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email || "",
      user_phone: user.phone || "",
      complaint_text: `[APPEAL — BLOCKED USER]\n${msg.trim()}`,
    });
    setSending(false);
    if (error) { toast.error("Failed to send"); return; }
    toast.success("Appeal sent to admin");
    setMsg("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-destructive/40 bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Ban className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-destructive">Account Blocked</h1>
          <p className="mt-2 font-hindi text-foreground">आपका अकाउंट ब्लॉक कर दिया गया है।</p>
          <div className="mt-3 w-full rounded-md border bg-muted/40 p-3 text-left text-sm">
            <p className="font-semibold">कारण / Reason:</p>
            <p className="mt-1 text-muted-foreground">{reason || "Admin द्वारा ब्लॉक किया गया।"}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium">Appeal / Support Message भेजें:</p>
          <Textarea
            placeholder="अपना संदेश या appeal यहाँ लिखें..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
          />
          <Button onClick={sendAppeal} disabled={sending || !msg.trim()} className="w-full">
            <Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send Appeal to Admin"}
          </Button>
        </div>

        <Button variant="outline" className="mt-4 w-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />Logout
        </Button>
      </div>
    </div>
  );
};

export default BlockedScreen;