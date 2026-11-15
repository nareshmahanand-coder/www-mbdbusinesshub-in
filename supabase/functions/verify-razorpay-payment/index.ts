import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";
import { validateCapturedPayment } from "../_shared/paymentCatalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const encoder = new TextEncoder();

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function fetchPayment(paymentId: string, keyId: string, keySecret: string) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  const payment = await response.json();
  if (!response.ok) throw new Error("Razorpay could not verify this payment reference");
  return payment;
}

async function fetchOrderPayments(orderId: string, keyId: string, keySecret: string) {
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}/payments`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Razorpay could not check this order yet");
  return Array.isArray(payload?.items) ? payload.items : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!supabaseUrl || !anonKey || !serviceKey || !keyId || !keySecret) throw new Error("Payment verification is not configured");

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const paymentOrderId = typeof body.payment_order_id === "string" ? body.payment_order_id : "";
    const callbackPaymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const callbackOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const callbackSubscriptionId = typeof body.subscription_id === "string" ? body.subscription_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    if (!paymentOrderId || !callbackPaymentId || !signature || (!callbackOrderId && !callbackSubscriptionId)) {
      return new Response(JSON.stringify({ error: "Missing payment reference" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: order, error: orderError } = await admin.from("payment_orders").select("*").eq("id", paymentOrderId).eq("user_id", authData.user.id).maybeSingle();
    if (orderError || !order) return new Response(JSON.stringify({ error: "Payment order not found for this account" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (order.status === "paid" && order.unlocked_at) return new Response(JSON.stringify({ ok: true, alreadyUnlocked: true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let signatureMessage = "";
    let expectedSubscriptionId = "";
    if (callbackSubscriptionId) {
      const { data: mapping } = await admin.from("razorpay_subscription_mappings").select("razorpay_subscription_id").eq("payment_order_id", order.id).eq("user_id", authData.user.id).eq("razorpay_subscription_id", callbackSubscriptionId).maybeSingle();
      if (!mapping) return new Response(JSON.stringify({ error: "Subscription does not belong to this account's order" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      expectedSubscriptionId = mapping.razorpay_subscription_id;
      signatureMessage = `${expectedSubscriptionId}|${callbackPaymentId}`;
    } else {
      if (!order.razorpay_order_id || callbackOrderId !== order.razorpay_order_id) return new Response(JSON.stringify({ error: "Razorpay order does not match this account's order" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      signatureMessage = `${callbackOrderId}|${callbackPaymentId}`;
    }
    const expectedSignature = await hmac(signatureMessage, keySecret);
    if (!safeEqual(expectedSignature, signature.toLowerCase())) return new Response(JSON.stringify({ error: "Payment verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const payment = await fetchPayment(callbackPaymentId, keyId, keySecret);
    const invalidPayment = validateCapturedPayment(order, {
      id: payment?.id,
      order_id: callbackSubscriptionId ? order.razorpay_order_id : payment?.order_id,
      status: payment?.status,
      amount: payment?.amount,
      currency: payment?.currency,
    });
    if (invalidPayment && !(callbackSubscriptionId && invalidPayment === "Provider order does not match this account's order")) {
      return new Response(JSON.stringify({ ok: false, pending: payment?.status !== "captured", error: invalidPayment }), { status: payment?.status === "captured" ? 400 : 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (callbackSubscriptionId && payment?.subscription_id !== expectedSubscriptionId) return new Response(JSON.stringify({ error: "Captured payment does not match this account's subscription" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: fulfillment, error: fulfillmentError } = await admin.rpc("fulfill_razorpay_payment", {
      p_payment_order_id: order.id,
      p_payment_id: payment.id,
      p_provider_event_id: `client:${payment.id}`,
      p_amount_paise: Number(payment.amount),
      p_currency: String(payment.currency || ""),
      p_signature: signature,
      p_source: callbackSubscriptionId ? "verified_subscription_callback" : "verified_order_callback",
    });
    if (fulfillmentError) {
      console.error("Razorpay fulfillment rejected", { orderId: order.id, paymentId: payment.id, message: fulfillmentError.message });
      return new Response(JSON.stringify({ error: "The captured payment could not be matched to this plan. Contact support with your order ID." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, unlocked: true, alreadyProcessed: fulfillment?.duplicate === true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    console.error("verify-razorpay-payment error", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});