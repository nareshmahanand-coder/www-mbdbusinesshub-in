import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { verifyUserSubscription } from "@/lib/subscriptionGuard";

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

    const result = await verifyUserSubscription(user.id, user.email ?? null, "bharat_gaurav");
    setIsActive(result.paid);
    setIsPending(result.pending);
    setLoading(false);
  };

  useEffect(() => {
    checkMembership();
  }, [user]);

  return { isActive, isPending, loading, refresh: checkMembership };
};
