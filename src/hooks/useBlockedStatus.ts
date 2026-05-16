import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBlockedStatus = () => {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setBlocked(false); setReason(""); setLoading(false); return; }
    let active = true;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("blocked, block_reason")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setBlocked(!!data?.blocked);
      setReason((data as any)?.block_reason || "");
      setLoading(false);
    };
    check();
    const id = window.setInterval(check, 15000);
    return () => { active = false; window.clearInterval(id); };
  }, [user]);

  return { blocked, reason, loading };
};