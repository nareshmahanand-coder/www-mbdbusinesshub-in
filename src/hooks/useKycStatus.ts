import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useKycStatus = () => {
  const { user } = useAuth();
  const [hasKyc, setHasKyc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setHasKyc(false); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("kyc_verifications")
        .select("id,status,kyc_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const valid =
        !!data &&
        data.status === "verified" &&
        (!data.kyc_expires_at || new Date(data.kyc_expires_at).getTime() > Date.now());
      // Local fallback: if DB read is stale right after submit, honor the
      // "verified" marker so the route guard never loops user back to /ekyc.
      let effective = valid;
      if (!effective) {
        try {
          const marker = localStorage.getItem(`mbd-kyc-verified-${user.id}`);
          if (marker && Date.now() - Number(marker) < 1000 * 60 * 60 * 24) {
            effective = true;
          }
        } catch {}
      }
      setHasKyc(effective);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { hasKyc, loading };
};