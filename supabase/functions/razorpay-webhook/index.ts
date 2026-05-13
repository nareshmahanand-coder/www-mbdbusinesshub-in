import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const enc = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

type ModuleName = "merchant_premium" | "marriage_bureau";
type PlanName = "monthly" | "yearly";
type LinkPlan = { module: ModuleName; plan: PlanName; amount: number; days: number; label: string };

const PAYMENT_LINKS: Record<string, LinkPlan> = {
  PKPblN5t: { module: "merchant_premium", plan: "monthly", amount: 99, days: 30, label: "Merchant Portal ₹99 Monthly Plan" },
  CmLBI4u: { module: "merchant_premium", plan: "yearly", amount: 999, days: 365, label: "Merchant Portal ₹999 Yearly Plan" },
  sub_ShLRDyN197vaFh: { module: "merchant_premium", plan: "monthly", amount: 99, days: 30, label: "Merchant Portal ₹99 Monthly Plan" },
  sub_ShLXB2CbEc64Un: { module: "merchant_premium", plan: "yearly", amount: 999, days: 365, label: "Merchant Portal ₹999 Yearly Plan" },
  d6TAK5F: { module: "marriage_bureau", plan: "monthly", amount: 99, days: 30, label: "Marriage Bureau ₹99 Monthly Plan" },
  WY2NejZi: { module: "marriage_bureau", plan: "yearly", amount: 999, days: 365, label: "Marriage Bureau ₹999 Yearly Plan" },
  // New verified payment links (zero-GST)
  md63vYt8: { module: "merchant_premium", plan: "monthly", amount: 99, days: 30, label: "Merchant Portal ₹99 Monthly" },
  gdhg7YC4: { module: "merchant_premium", plan: "yearly", amount: 999, days: 365, label: "Merchant Portal ₹999 Yearly" },
  JPhHPAU: { module: "marriage_bureau", plan: "monthly", amount: 99, days: 30, label: "Marriage Bureau ₹99 Monthly" },
  "8PAlZmT": { module: "marriage_bureau", plan: "yearly", amount: 999, days: 365, label: "Marriage Bureau ₹999 Yearly" },
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

function amountInRupees(payment: any) {
  return Number(payment?.amount || 0) / 100;
}

function isAmountMatch(actual: number, base: number) {
  return Math.abs(actual - base) < 0.02 || Math.abs(actual - base * 1.18) < 0.02;
}

function getPaymentLinkPlan(payment: any) {
  const notes = payment?.notes || {};
  const candidates = [
    payment?.payment_link_id,
    payment?.payment_link?.id,
    payment?.payment_link?.short_url,
    payment?.payment_link?.short_url?.split("/").pop(),
    payment?.short_url,
    payment?.short_url?.split("/").pop(),
    payment?.subscription_id,
    notes.payment_link_id,
    notes.payment_link_reference_id,
    notes.payment_link_short_url,
    notes.payment_link_short_url?.split("/").pop(),
    notes.subscription_id,
  ].filter(Boolean).map(String);
  return candidates.map((id) => PAYMENT_LINKS[id]).find(Boolean) || null;
}

function getSubscriptionPlan(subscription: any) {
  const notes = subscription?.notes || {};
  const candidates = [subscription?.id, subscription?.plan_id, notes.subscription_id, notes.payment_link_subscription_id].filter(Boolean).map(String);
  return candidates.map((id) => PAYMENT_LINKS[id]).find(Boolean) || null;
}

function inferPaymentLinkPlan(payment: any): LinkPlan | null {
  const amount = amountInRupees(payment);
  const description = `${payment?.description || ""} ${payment?.notes?.label || ""}`.toLowerCase();
  if (isAmountMatch(amount, 10) || description.includes("₹10")) return PAYMENT_LINKS["0kTh9x8o"];
  if (isAmountMatch(amount, 100) || description.includes("₹100")) return PAYMENT_LINKS["3jBvEwl"];
  if (isAmountMatch(amount, 99) || description.includes("₹99")) return description.includes("marriage") ? PAYMENT_LINKS.d6TAK5F : PAYMENT_LINKS.PKPblN5t;
  if (isAmountMatch(amount, 999) || description.includes("₹999")) return description.includes("marriage") ? PAYMENT_LINKS.WY2NejZi : PAYMENT_LINKS.CmLBI4u;
  return null;
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

async function findOrderByUserOrEmail(admin: any, source: any, linkPlan: LinkPlan) {
  const notes = source?.notes || {};
  const userId = String(notes.user_id || "");
  const email = String(source?.email || notes.email || notes.customer_email || "").toLowerCase();
  const contact = String(source?.contact || notes.contact || "").replace(/\D/g, "");
  const amount = source?.amount ? amountInRupees(source) : linkPlan.amount;

  if (userId) {
    const { data } = await admin.from("payment_orders").select("*").eq("user_id", userId).eq("module", linkPlan.module).eq("plan", linkPlan.plan).in("status", ["created", "pending", "failed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) return data;
  }

  // SECURITY: never attribute a webhook payment to an order by amount alone — payment links
  // are shared across users so an amount-only match would activate the most recent pending
  // order regardless of who actually paid. Require an email or phone match against the order
  // owner's profile.
  if (!email && !contact) return null;

  let profile: any = null;
  if (email) {
    const { data } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
    profile = data;
  }
  if (!profile?.id && contact) {
    const last10 = contact.slice(-10);
    const { data } = await admin
      .from("profiles")
      .select("id, phone")
      .ilike("phone", `%${last10}`)
      .limit(1)
      .maybeSingle();
    profile = data;
  }
  if (!profile?.id) return null;

  const { data: existing } = await admin
    .from("payment_orders")
    .select("*")
    .eq("user_id", profile.id)
    .eq("module", linkPlan.module)
    .eq("plan", linkPlan.plan)
    .in("status", ["created", "pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  const { data: created, error } = await admin.from("payment_orders").insert({
    user_id: profile.id,
    module: linkPlan.module,
    plan: linkPlan.plan,
    amount: linkPlan.amount,
    currency: "INR",
    status: "created",
    razorpay_order_id: source?.order_id || null,
    receipt: `mbd_link_${linkPlan.plan}_${Date.now()}`.slice(0, 40),
    metadata: { days: linkPlan.days, label: linkPlan.label, plan_name: `${linkPlan.module}_${linkPlan.plan}`, source: "razorpay_webhook" },
  }).select("*").single();
  if (error) throw error;
  return created || null;
}

async function findPaymentLinkOrder(admin: any, payment: any, linkPlan: LinkPlan) {
  const existingByReference = await findExistingPaymentOrder(admin, payment);
  if (existingByReference) return existingByReference;
  return await findOrderByUserOrEmail(admin, payment, linkPlan);
}

async function findSubscriptionOrder(admin: any, subscription: any, linkPlan: LinkPlan) {
  const notes = subscription?.notes || {};
  const referenceId = String(subscription?.reference_id || notes.reference_id || notes.payment_link_reference_id || "");
  if (referenceId) {
    const { data } = await admin.from("payment_orders").select("*").eq("id", referenceId).maybeSingle();
    if (data) return data;
  }

  const subscriptionId = String(subscription?.id || "");
  if (subscriptionId) {
    const { data } = await admin
      .from("payment_orders")
      .select("*")
      .eq("module", linkPlan.module)
      .eq("plan", linkPlan.plan)
      .eq("metadata->>payment_link_subscription_id", subscriptionId)
      .in("status", ["created", "pending", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  return await findOrderByUserOrEmail(admin, subscription, linkPlan);
}

async function unlock(admin: any, order: any, paymentId: string, signature: string, source = "razorpay_webhook") {
  if (order.status === "paid" && order.unlocked_at) return;
  const days = Number(order.metadata?.days || (order.plan === "yearly" ? 365 : 30));
  const dates = addDays(days);

  if (order.module === "merchant_premium") {
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

  const { error: paymentError } = await admin.from("payment_orders").update({
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
  if (paymentError) throw paymentError;
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
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;
      const status = payment?.status;
      const linkPlan = getPaymentLinkPlan(payment) || inferPaymentLinkPlan(payment);

      if (!paymentId) {
        return new Response(JSON.stringify({ ok: true, ignored: "no_payment_id" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: orderByOrderId } = orderId
        ? await admin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).maybeSingle()
        : { data: null } as any;
      const order = orderByOrderId || await findExistingPaymentOrder(admin, payment) || (linkPlan ? await findPaymentLinkOrder(admin, payment, linkPlan) : null);

      if (!order) {
        console.warn("razorpay-webhook unknown captured payment", { paymentId, orderId, linkPlan });
        return new Response(JSON.stringify({ ok: true, ignored: "unknown_order" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (status === "captured") await unlock(admin, order, paymentId, receivedSignature);
      return new Response(JSON.stringify({ ok: true, processed: "payment.captured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "subscription.activated") {
      const subscription = event.payload?.subscription?.entity;
      const subscriptionId = subscription?.id;
      const linkPlan = getSubscriptionPlan(subscription);
      if (!subscriptionId || !linkPlan) {
        return new Response(JSON.stringify({ ok: true, ignored: "unknown_subscription" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const order = await findSubscriptionOrder(admin, subscription, linkPlan);
      if (!order) {
        console.warn("razorpay-webhook unknown activated subscription", { subscriptionId, linkPlan });
        return new Response(JSON.stringify({ ok: true, ignored: "unknown_subscription_order" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await unlock(admin, order, subscriptionId, receivedSignature, "razorpay_subscription_webhook");
      return new Response(JSON.stringify({ ok: true, processed: "subscription.activated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      const paymentId = payment?.id;
      const order = payment ? await findExistingPaymentOrder(admin, payment) : null;
      if (order) {
        await admin.from("payment_orders").update({ status: "failed", razorpay_payment_id: paymentId, error_message: payment?.error_description || "Payment failed" }).eq("id", order.id);
      }
      return new Response(JSON.stringify({ ok: true, processed: "payment.failed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, ignored: event.event }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("razorpay-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
