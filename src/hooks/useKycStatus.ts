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
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setHasKyc(!!data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { hasKyc, loading };
};