import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { readKycVerifiedMarker } from "@/lib/capacitorSessionBridge";

const KYC_MARKER_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 35;

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
        .select("id,status,kyc_expires_at,re_kyc_requested_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const valid =
        !!data &&
        data.status === "verified" &&
        !data.re_kyc_requested_at &&
        (!data.kyc_expires_at || new Date(data.kyc_expires_at).getTime() > Date.now());
      // Local fallback: if DB read is stale right after submit, honor the
      // "verified" marker so the route guard never loops user back to /ekyc.
      let effective = valid;
      if (!effective) {
        const marker = await readKycVerifiedMarker(user.id);
        if (!data?.re_kyc_requested_at && marker && Date.now() - marker < KYC_MARKER_MAX_AGE_MS) {
          effective = true;
        }
      }
      setHasKyc(effective);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { hasKyc, loading };
};