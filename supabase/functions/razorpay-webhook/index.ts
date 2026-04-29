import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const enc = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

const PAYMENT_LINKS: Record<string, { module: "bharat_gaurav" | "merchant_premium" | "marriage_bureau"; plan: "monthly" | "yearly"; amount: number; days: number; label: string }> = {
  "0kTh9x8o": { module: "bharat_gaurav", plan: "monthly", amount: 10, days: 30, label: "भारत गौरव मेंबरशिप ₹10 प्लान" },
  "3jBvEwl": { module: "bharat_gaurav", plan: "yearly", amount: 100, days: 365, label: "भारत गौरव मेंबरशिप ₹100 प्लान" },
  PKPblN5t: { module: "merchant_premium", plan: "monthly", amount: 99, days: 30, label: "Merchant Portal ₹99 Monthly Plan" },
  CmLBI4u: { module: "merchant_premium", plan: "yearly", amount: 999, days: 365, label: "Merchant Portal ₹999 Yearly Plan" },
  sub_ShLRDyN197vaFh: { module: "merchant_premium", plan: "monthly", amount: 99, days: 30, label: "Merchant Portal ₹99 Monthly Plan" },
  sub_ShLXB2CbEc64Un: { module: "merchant_premium", plan: "yearly", amount: 999, days: 365, label: "Merchant Portal ₹999 Yearly Plan" },
  d6TAK5F: { module: "marriage_bureau", plan: "monthly", amount: 99, days: 30, label: "Marriage Bureau ₹99 Monthly Plan" },
  WY2NejZi: { module: "marriage_bureau", plan: "yearly", amount: 999, days: 365, label: "Marriage Bureau ₹999 Yearly Plan" },
};

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

function getPaymentLinkPlan(payment: any) {
  const notes = payment?.notes || {};
  const candidates = [
    payment?.payment_link_id,
    payment?.subscription_id,
    notes.payment_link_id,
    notes.payment_link_reference_id,
    notes.subscription_id,
  ].filter(Boolean).map(String);
  return candidates.map((id) => PAYMENT_LINKS[id]).find(Boolean) || null;
}

async function findExistingPaymentOrder(admin: any, payment: any) {
  const notes = payment?.notes || {};
  const paymentId = String(payment?.id || "");
  if (paymentId) {
    const { data } = await admin.from("payment_orders").select("*").eq("razorpay_payment_id", paymentId).maybeSingle();
    if (data) return data;
  }

  const referenceId = String(payment?.reference_id || notes.reference_id || notes.payment_link_reference_id || "");
  if (referenceId) {
    const { data } = await admin.from("payment_orders").select("*").eq("id", referenceId).maybeSingle();
    if (data) return data;
  }

  return null;
}

async function findPaymentLinkOrder(admin: any, payment: any, linkPlan: { module: "bharat_gaurav" | "merchant_premium" | "marriage_bureau"; plan: "monthly" | "yearly"; amount: number; days: number; label: string }) {
  const notes = payment?.notes || {};
  const existingByReference = await findExistingPaymentOrder(admin, payment);
  if (existingByReference) return existingByReference;

  const email = String(payment?.email || notes.email || notes.customer_email || "").toLowerCase();
  if (!email) return null;

  const { data: profile } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile?.id) return null;

  const { data: existing } = await admin
    .from("payment_orders")
    .select("*")
    .eq("user_id", profile.id)
    .eq("module", linkPlan.module)
    .eq("plan", linkPlan.plan)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  const { data: created } = await admin.from("payment_orders").insert({
    user_id: profile.id,
    module: linkPlan.module,
    plan: linkPlan.plan,
    amount: linkPlan.amount,
    currency: "INR",
    status: "created",
    razorpay_order_id: payment?.order_id || null,
    receipt: `mbd_link_${linkPlan.plan}_${Date.now()}`.slice(0, 40),
    metadata: { days: linkPlan.days, label: linkPlan.label, plan_name: `${linkPlan.module}_${linkPlan.plan}`, source: "razorpay_payment_link" },
  }).select("*").single();
  return created || null;
}

async function unlock(admin: any, order: any, paymentId: string, signature: string) {
  if (order.status === "paid") return;
  const days = Number(order.metadata?.days || (order.plan === "yearly" ? 365 : 30));
  const dates = addDays(days);
  const basePaymentUpdate = {
    status: "paid",
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    unlocked_at: new Date().toISOString(),
    error_message: null,
    metadata: {
      ...(order.metadata || {}),
      plan_name: order.metadata?.plan_name || `${order.module}_${order.plan}`,
      unlock_source: "razorpay_webhook",
    },
  };

  if (order.module === "bharat_gaurav") {
    await admin.from("memberships").upsert({
      user_id: order.user_id,
      plan: order.plan,
      amount: order.amount,
      transaction_id: paymentId,
      status: "approved",
      starts_at: dates.start,
      ends_at: dates.end,
    }, { onConflict: "transaction_id" });
  } else if (order.module === "merchant_premium") {
    await admin.from("merchant_profiles").update({
      is_premium: true,
      premium_plan: order.plan,
      premium_start_date: new Date().toISOString(),
      plan_ends_at: dates.end,
      access_status: "active",
    }).eq("user_id", order.user_id);
  } else if (order.module === "marriage_bureau") {
    await admin.from("matrimony_profiles").update({
      is_published: true,
      subscription_plan: order.plan,
      subscription_start: dates.start,
      subscription_end: dates.end,
    }).eq("user_id", order.user_id);
  }

  await admin.from("payment_orders").update(basePaymentUpdate).eq("id", order.id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("Webhook secret is not configured");

    const rawBody = await req.text();
    const receivedSignature = req.headers.get("x-razorpay-signature") || "";
    const expectedSignature = await hmacSha256(rawBody, webhookSecret);

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const event = JSON.parse(rawBody);
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    const status = payment?.status;
    const linkPlan = getPaymentLinkPlan(payment);

    if (!orderId || !paymentId) {
      if (!paymentId) {
        return new Response(JSON.stringify({ ok: true, ignored: "no_payment_order" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: orderByOrderId } = orderId
      ? await admin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).maybeSingle()
      : { data: null } as any;
    const order = orderByOrderId || await findExistingPaymentOrder(admin, payment) || (linkPlan ? await findPaymentLinkOrder(admin, payment, linkPlan) : null);

    if (!order) {
      return new Response(JSON.stringify({ ok: true, ignored: "unknown_order" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "payment.captured" && status === "captured") {
      await unlock(admin, order, paymentId, receivedSignature);
    } else if (event.event === "payment.failed" || status === "failed") {
      await admin.from("payment_orders").update({ status: "failed", razorpay_payment_id: paymentId, error_message: payment?.error_description || "Payment failed" }).eq("id", order.id);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("razorpay-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
