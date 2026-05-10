import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMembership = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMembership = async () => {
    if (!user) {
      setIsActive(null);
      setIsPending(false);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Check for approved/active membership
    const { data: approved } = await supabase
      .from("memberships")
      .select("id, transaction_id, amount")
      .eq("user_id", user.id)
      .in("status", ["approved", "active"])
      .gte("ends_at", today)
      .limit(1);

    const verified = (approved || []).find(
      (m) =>
        typeof m.transaction_id === "string" &&
        m.transaction_id.trim().length > 0 &&
        Number(m.amount) >= 10,
    );

    if (verified) {
      setIsActive(true);
      setIsPending(false);
      setLoading(false);
      return;
    }

    // Check for pending
    const { data: pending } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1);

    setIsPending(pending !== null && pending.length > 0);
    setIsActive(false);
    setLoading(false);
  };

  useEffect(() => {
    checkMembership();
  }, [user]);

  return { isActive, isPending, loading, refresh: checkMembership };
};
