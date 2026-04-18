import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export const useKycStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<KycStatus>("none");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setStatus("none");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("kyc_requests")
      .select("status, rejection_reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setStatus(data.status as KycStatus);
      setRejectionReason(data.rejection_reason ?? null);
    } else {
      setStatus("none");
      setRejectionReason(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { status, rejectionReason, loading, refresh };
};
