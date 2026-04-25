import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type MerchantAccessState = "loading" | "none" | "active" | "suspended" | "expired";

export const useMerchantAccess = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MerchantAccessState>("loading");
  const [reason, setReason] = useState("");

  const refresh = async () => {
    if (!user) {
      setState("none");
      return;
    }

    const { data } = await supabase
      .from("merchant_profiles")
      .select("id, access_status, suspension_reason, plan_override, plan_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      setState("none");
      return;
    }

    if (data.access_status === "suspended") {
      setReason(data.suspension_reason || "Your shop access is temporarily suspended.");
      setState("suspended");
      return;
    }

    if (data.plan_ends_at && new Date(data.plan_ends_at) < new Date()) {
      setReason("Your merchant subscription has ended. Please renew to continue.");
      setState("expired");
      return;
    }

    setReason("");
    setState("active");
  };

  useEffect(() => {
    void refresh();
  }, [user]);

  return { state, reason, refresh };
};
