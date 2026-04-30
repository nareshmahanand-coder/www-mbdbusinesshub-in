import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export const kycSubmittedKey = (userId: string) => `mbd-kyc-submitted-${userId}`;

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
      if (data.status === "pending" || data.status === "approved") {
        try { localStorage.setItem(kycSubmittedKey(user.id), data.status); } catch {}
      } else if (data.status === "rejected") {
        try { localStorage.removeItem(kycSubmittedKey(user.id)); } catch {}
      }
    } else {
      // Fallback: if a local marker exists from a recent submit, treat as pending
      // to avoid the redirect loop while the DB row propagates.
      let localMarker: string | null = null;
      try { localMarker = localStorage.getItem(kycSubmittedKey(user.id)); } catch {}
      if (localMarker === "pending" || localMarker === "approved") {
        setStatus(localMarker as KycStatus);
      } else {
        setStatus("none");
      }
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
