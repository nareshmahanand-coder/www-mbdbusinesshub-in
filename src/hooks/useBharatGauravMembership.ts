import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { verifyUserSubscription } from "@/lib/subscriptionGuard";

export const useBharatGauravMembership = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setIsActive(false); setLoading(false); return; }
    setLoading(true);
    const result = await verifyUserSubscription(user.id, user.email, "bharat_gaurav");
    setIsActive(result.paid);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { isActive, loading, refresh };
};