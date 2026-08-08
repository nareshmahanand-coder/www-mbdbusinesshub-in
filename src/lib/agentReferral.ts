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

/** Look up an approved agent by their public Agent ID code. */
export const lookupAgentByCode = async (code: string) => {
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return null;
  const { data } = await supabase.rpc("lookup_agent_by_code", { p_code: clean });
  const match = Array.isArray(data) ? data[0] : data;
  return match?.id ? match : null;
};

/**
 * Link a freshly logged-in / registered user to the agent whose Agent ID they
 * entered on the login screen. No-ops when the code is invalid or a link exists.
 */
export const linkUserToAgentCode = async (userId: string, code: string) => {
  const match = await lookupAgentByCode(code);
  if (!match) return { ok: false as const, reason: "invalid" as const };

  const { data: existing } = await supabase
    .from("agent_referrals")
    .select("id")
    .eq("merchant_user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true as const, agent: match };

  const { error } = await supabase.from("agent_referrals").insert({
    agent_id: match.id,
    merchant_user_id: userId,
    source: "login_agent_id",
  });
  if (error) return { ok: false as const, reason: "insert" as const };
  clearStoredAgentReferral();
  return { ok: true as const, agent: match };
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