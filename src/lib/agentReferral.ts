import { supabase } from "@/integrations/supabase/client";

export const AGENT_REF_KEY = "mbd-agent-ref";

/** Capture ?ref=AGENT_CODE from the URL and remember it for later merchant signup. */
export const captureAgentReferralFromUrl = () => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref") || params.get("agent");
  if (code && code.trim()) {
    localStorage.setItem(AGENT_REF_KEY, code.trim().toUpperCase());
  }
};

export const getStoredAgentReferral = () =>
  (typeof window === "undefined" ? null : localStorage.getItem(AGENT_REF_KEY));

export const clearStoredAgentReferral = () => localStorage.removeItem(AGENT_REF_KEY);

/** Build the public referral link an agent can share. */
export const buildAgentReferralLink = (code: string) => {
  const origin =
    typeof window !== "undefined" && window.location.origin.startsWith("http")
      ? window.location.origin
      : "https://shop.mbdbusinesshub.in";
  return `${origin}/merchant?ref=${encodeURIComponent(code)}`;
};

/**
 * Attach the stored referral code to a freshly registered merchant.
 * Safe to call always — it silently no-ops when there is no referral.
 */
export const attachAgentReferral = async (params: {
  merchantUserId: string;
  merchantProfileId?: string | null;
  shopName?: string | null;
}) => {
  const code = getStoredAgentReferral();
  if (!code) return;

  const { data: agent } = await supabase.rpc("lookup_agent_by_code", { p_code: code });
  const match = Array.isArray(agent) ? agent[0] : agent;
  if (!match?.id) return;

  await supabase.from("agent_referrals").insert({
    agent_id: match.id,
    merchant_user_id: params.merchantUserId,
    merchant_profile_id: params.merchantProfileId ?? null,
    shop_name: params.shopName ?? null,
  });

  clearStoredAgentReferral();
};

export const buildAgentReferralLink = (agentCode: string) =>
  `${window.location.origin}/merchant?ref=${encodeURIComponent(agentCode)}`;