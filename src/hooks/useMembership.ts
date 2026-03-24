import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMembership = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkMembership = async () => {
    if (!user) {
      setIsActive(null);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("ends_at", today)
      .limit(1);

    if (error) {
      setIsActive(false);
    } else {
      setIsActive(data && data.length > 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkMembership();
  }, [user]);

  return { isActive, loading, refresh: checkMembership };
};
