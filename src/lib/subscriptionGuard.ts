/**
 * Central Subscription Guard — single source of truth for paid access.
 *
 * Replaces all previous ad-hoc "isActive" checks. Every module routes
 * through verifyUserSubscription() so the rules are identical everywhere:
 *
 *   1. The currently logged-in user's UUID must match the row's user_id.
 *   2. The row must carry a real Razorpay transaction_id (starts with "pay_").
 *   3. The amount must be one of the published plan prices (10/100/99/999).
 *   4. status must be "active" or "approved" and ends_at must be in the future.
 *   5. The auth user's email must match the profile email on file (defence
 *      in depth — blocks attempts to reuse a payment under another login).
 *
 * If ANY check fails the user is treated as unpaid and routed to /membership.
 */
import { supabase } from "@/integrations/supabase/client";

export type GuardModule = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";

const ALLOWED_AMOUNTS: Record<GuardModule, number[]> = {
  bharat_gaurav: [10, 100],
  merchant_premium: [99, 999],
  marriage_bureau: [99, 999],
};

const isRealRazorpayTxn = (txn: unknown) =>
  typeof txn === "string" && txn.trim().toLowerCase().startsWith("pay_");

const isAllowedAmount = (mod: GuardModule, amount: unknown) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return false;
  return ALLOWED_AMOUNTS[mod].some((base) => Math.abs(n - base) < 0.5 || Math.abs(n - base * 1.18) < 0.5);
};

export type GuardResult = {
  paid: boolean;
  pending: boolean;
  reason?: string;
};

async function emailMatchesProfile(userId: string, authEmail: string | null | undefined) {
  if (!authEmail) return true; // phone-only accounts have no email — skip this check
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  const profileEmail = String(data?.email || "").trim().toLowerCase();
  if (!profileEmail) return true;
  return profileEmail === authEmail.trim().toLowerCase();
}

export async function verifyUserSubscription(
  userId: string,
  authEmail: string | null | undefined,
  module: GuardModule,
): Promise<GuardResult> {
  if (!userId) return { paid: false, pending: false, reason: "not_logged_in" };

  if (!(await emailMatchesProfile(userId, authEmail))) {
    return { paid: false, pending: false, reason: "email_mismatch" };
  }

  const today = new Date().toISOString().slice(0, 10);

  if (module === "bharat_gaurav") {
    const { data } = await supabase
      .from("memberships")
      .select("id, transaction_id, amount, status, ends_at")
      .eq("user_id", userId)
      .in("status", ["active", "approved"])
      .gte("ends_at", today);

    const verified = (data || []).find(
      (m) => isRealRazorpayTxn(m.transaction_id) && isAllowedAmount("bharat_gaurav", m.amount),
    );
    if (verified) return { paid: true, pending: false };

    const { data: pend } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(1);
    return { paid: false, pending: (pend?.length || 0) > 0 };
  }

  // For merchant_premium and marriage_bureau, the proof of payment lives in
  // payment_orders (status='paid', razorpay_payment_id starts with 'pay_').
  const { data: orders } = await supabase
    .from("payment_orders")
    .select("id, amount, status, razorpay_payment_id, unlocked_at")
    .eq("user_id", userId)
    .eq("module", module)
    .eq("status", "paid");

  const verifiedOrder = (orders || []).find(
    (o) =>
      isRealRazorpayTxn(o.razorpay_payment_id) &&
      isAllowedAmount(module, o.amount) &&
      !!o.unlocked_at,
  );
  if (!verifiedOrder) {
    const { data: pend } = await supabase
      .from("payment_orders")
      .select("id")
      .eq("user_id", userId)
      .eq("module", module)
      .in("status", ["created", "pending"])
      .limit(1);
    return { paid: false, pending: (pend?.length || 0) > 0 };
  }

  // Cross-check the module-specific table still reflects an unexpired plan.
  if (module === "merchant_premium") {
    const { data } = await supabase
      .from("merchant_profiles")
      .select("plan_ends_at, access_status, is_premium")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data || data.access_status === "suspended") return { paid: false, pending: false };
    if (!data.is_premium) return { paid: false, pending: false };
    if (data.plan_ends_at && new Date(data.plan_ends_at) < new Date()) return { paid: false, pending: false };
    return { paid: true, pending: false };
  }

  if (module === "marriage_bureau") {
    const { data } = await supabase
      .from("matrimony_profiles")
      .select("subscription_end, is_published")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data || !data.is_published) return { paid: false, pending: false };
    if (data.subscription_end && new Date(data.subscription_end) < new Date()) return { paid: false, pending: false };
    return { paid: true, pending: false };
  }

  return { paid: false, pending: false };
}