import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { verifyUserSubscription } from "@/lib/subscriptionGuard";

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

    // CRITICAL: existence of a merchant_profiles row only proves the user
    // completed the free registration form — NOT that they paid for the
    // Premium subscription. Cross-check the central subscription guard,
    // which requires a verified Razorpay transaction tied to THIS user_id.
    const verified = await verifyUserSubscription(user.id, user.email, "merchant_premium");
    if (!verified.paid) {
      setReason("Premium subscription required. Please complete payment to access the dashboard.");
      setState("none");
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
