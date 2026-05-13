import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const enc = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

type ModuleName = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
type PlanName = "monthly" | "yearly";

async function hmacSha256(message: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

function addDays(days: number) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return { start: now.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function isAmountMatch(actualPaise: number, baseRupees: number) {
  const basePaise = Math.round(baseRupees * 100);
  const taxedPaise = Math.round(baseRupees * 118);
  return Math.abs(actualPaise - basePaise) <= 2 || Math.abs(actualPaise - taxedPaise) <= 2;
}

async function ensureMembership(admin: any, order: any, paymentId: string, dates: { start: string; end: string }) {
  const { data: existing } = await admin.from("memberships").select("id").eq("transaction_id", paymentId).maybeSingle();
  if (existing?.id) {
    const { error } = await admin.from("memberships").update({ status: "active", starts_at: dates.start, ends_at: dates.end, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await admin.from("memberships").insert({
    user_id: order.user_id,
    plan: order.plan,
    amount: order.amount,
    transaction_id: paymentId,
    status: "active",
    starts_at: dates.start,
    ends_at: dates.end,
  });
  if (error) throw error;
}

async function unlock(admin: any, order: any, paymentId: string, signature: string, source: string) {
  if (order.status === "paid" && order.unlocked_at) return;
  const days = Number(order.metadata?.days || (order.plan === "yearly" ? 365 : 30));
  const dates = addDays(days);

  if (order.module === "bharat_gaurav") {
    await ensureMembership(admin, order, paymentId, dates);
  } else if (order.module === "merchant_premium") {
    const { error } = await admin.from("merchant_profiles").update({
      is_premium: true,
      premium_plan: order.plan,
      premium_start_date: new Date().toISOString(),
      plan_ends_at: dates.end,
      access_status: "active",
    }).eq("user_id", order.user_id);
    if (error) throw error;
  } else if (order.module === "marriage_bureau") {
    const { error } = await admin.from("matrimony_profiles").update({
      is_published: true,
      subscription_plan: order.plan,
      subscription_start: dates.start,
      subscription_end: dates.end,
    }).eq("user_id", order.user_id);
    if (error) throw error;
  }

  const { error } = await admin.from("payment_orders").update({
    status: "paid",
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    unlocked_at: new Date().toISOString(),
    error_message: null,
    metadata: {
      ...(order.metadata || {}),
      plan_name: order.metadata?.plan_name || `${order.module}_${order.plan}`,
      unlock_source: source,
    },
  }).eq("id", order.id);
  if (error) throw error;
}

async function fetchRazorpayPayment(paymentId: string, keyId: string, keySecret: string) {
  const resp = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.description || "Unable to verify Razorpay payment");
  return data;
}

async function findCapturedPaymentForOrder(order: any, user: any, keyId: string, keySecret: string) {
  const createdAt = Math.floor(new Date(order.created_at).getTime() / 1000) - 900;
  const resp = await fetch(`https://api.razorpay.com/v1/payments?from=${Math.max(0, createdAt)}&count=100`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.description || "Unable to sync Razorpay payment");

  // SECURITY (HARDENED): never match by email / phone / amount alone. The Razorpay payment
  // link is SHARED across all users, so any non-cryptographic match would let user B
  // unlock user A's premium. We only accept two proofs:
  //   1. Same Razorpay order_id (set only in the create-razorpay-order checkout flow,
  //      which is also signature-verified before this fallback ever runs).
  //   2. notes.reference_id === our payment_orders.id, which we attach to the link URL
  //      when *this* user opens it. Razorpay echoes it back on the captured payment.
  // Anything else => treat as unpaid and force the user to actually pay.
  const baseAmount = Number(order.amount || 0);
  const orderId = String(order.razorpay_order_id || "");

  return (data.items || []).find((payment: any) => {
    if (payment.status !== "captured") return false;

    if (orderId && payment.order_id === orderId) {
      return isAmountMatch(Number(payment.amount || 0), baseAmount);
    }

    const noteReference = String(
      payment.reference_id ||
      payment.notes?.reference_id ||
      payment.notes?.payment_link_reference_id ||
      ""
    );
    if (noteReference && noteReference === order.id) {
      return isAmountMatch(Number(payment.amount || 0), baseAmount);
    }

    return false;
  }) || null;
}

async function getOwnedOrder(admin: any, userId: string, body: any) {
  const paymentOrderId = String(body.payment_order_id || body.paymentOrderId || "");
  const orderId = String(body.razorpay_order_id || "");
  const module = String(body.module || "") as ModuleName;
  const plan = String(body.plan || "") as PlanName;

  if (paymentOrderId) {
    const { data } = await admin.from("payment_orders").select("*").eq("id", paymentOrderId).eq("user_id", userId).maybeSingle();
    if (data) return data;
  }

  if (orderId) {
    const { data } = await admin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).eq("user_id", userId).maybeSingle();
    if (data) return data;
  }

  if (module && plan) {
    const { data } = await admin
      .from("payment_orders")
      .select("*")
      .eq("module", module)
      .eq("plan", plan)
      .eq("user_id", userId)
      .in("status", ["created", "pending", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  const { data } = await admin
    .from("payment_orders")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["created", "pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = String(body.razorpay_payment_id || "");
    const orderId = String(body.razorpay_order_id || "");
    const signature = String(body.razorpay_signature || "");

    const admin = createClient(supabaseUrl, serviceKey);
    const order = await getOwnedOrder(admin, userData.user.id, body);
    if (!order) {
      return new Response(JSON.stringify({ error: "Payment order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (order.status === "paid" && order.unlocked_at) {
      return new Response(JSON.stringify({ ok: true, alreadyUnlocked: true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (paymentId && orderId && signature) {
      const expected = await hmacSha256(`${orderId}|${paymentId}`, keySecret);
      if (expected !== signature) {
        return new Response(JSON.stringify({ error: "Payment verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const payment = await fetchRazorpayPayment(paymentId, keyId, keySecret);
      if (payment.status !== "captured") {
        return new Response(JSON.stringify({ ok: false, pending: true, module: order.module }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await unlock(admin, order, paymentId, signature, "client_verified_razorpay_api");
      return new Response(JSON.stringify({ ok: true, unlocked: true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payment = await findCapturedPaymentForOrder(order, userData.user, keyId, keySecret);
    if (!payment) {
      return new Response(JSON.stringify({ ok: false, pending: true, module: order.module }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: duplicate } = await admin.from("payment_orders").select("id, user_id").eq("razorpay_payment_id", payment.id).neq("id", order.id).maybeSingle();
    if (duplicate) {
      return new Response(JSON.stringify({ error: "This Razorpay payment is already linked to another order" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await unlock(admin, order, payment.id, "manual_sync_verified_by_razorpay_api", "manual_sync_razorpay_api");
    return new Response(JSON.stringify({ ok: true, unlocked: true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-razorpay-payment error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
