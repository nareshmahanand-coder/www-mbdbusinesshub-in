import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserMembershipProfile {
  membership_status: string;
  membership_type: string | null;
  plan_type: string | null;
  current_period_end: string | null;
}

/**
 * STRICT per-user membership check against the unified `user_profiles` table.
 * Reads ONLY the row where user_id = auth.uid() — no cross-user leak.
 */
export const useUserMembershipProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserMembershipProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("membership_status, membership_type, plan_type, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as UserMembershipProfile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const isActive =
    profile?.membership_status === "active" &&
    (!profile.current_period_end || new Date(profile.current_period_end) > new Date());

  return { profile, isActive, loading, refresh };
};