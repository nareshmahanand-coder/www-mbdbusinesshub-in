import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BharatGauravMembership {
  id: string;
  plan: "monthly" | "yearly";
  status: string;
  started_at: string | null;
  expires_at: string | null;
}

export const useBharatGauravMembership = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<BharatGauravMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("bharat_gaurav_memberships")
      .select("id, plan, status, started_at, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
      setMembership(data as BharatGauravMembership);
    } else {
      setMembership(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { membership, isMember: !!membership, loading, refresh };
};