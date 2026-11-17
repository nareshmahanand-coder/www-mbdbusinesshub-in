import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";
import { validateCapturedPayment, validateCapturedSubscriptionPayment } from "../_shared/paymentCatalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};
const encoder = new TextEncoder();

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function findMappedOrder(admin: any, referenceId: unknown, providerOrderId: unknown) {
  const reference = typeof referenceId === "string" ? referenceId : "";
  const providerOrder = typeof providerOrderId === "string" ? providerOrderId : "";
  if (reference) {
    const { data } = await admin.from("payment_orders").select("*").eq("id", reference).maybeSingle();
    if (data && (!providerOrder || data.razorpay_order_id === providerOrder)) return data;
  }
  if (providerOrder) {
    const { data } = await admin.from("payment_orders").select("*").eq("razorpay_order_id", providerOrder).maybeSingle();
    return data || null;
  }
  return null;
}

async function recordEvent(admin: any, order: any, providerEventId: string | null, paymentId: string | null, eventType: string, status: string, message: string | null) {
  if (!order?.id || !order?.user_id) return;
  const { error } = await admin.from("payment_attempt_events").insert({
    user_id: order.user_id,
    payment_order_id: order.id,
    provider_event_id: providerEventId,
    provider_payment_id: paymentId,
    event_type: eventType,
    status,
    safe_message: message?.slice(0, 160) || null,
  });
  if (error && !String(error.code || "").startsWith("23")) console.error("payment attempt log rejected", error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!webhookSecret || !supabaseUrl || !serviceKey) throw new Error("Payment webhook is not configured");
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expectedSignature = await hmac(rawBody, webhookSecret);
    if (!signature || !constantTimeEqual(expectedSignature, signature.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const event = JSON.parse(rawBody);
    const admin = createClient(supabaseUrl, serviceKey);
    const eventId = typeof event?.id === "string" ? event.id : null;

    if (event.event === "payment.captured" || event.event === "subscription.charged") {
      const payment = event.payload?.payment?.entity;
      const subscription = event.payload?.subscription?.entity;
      const subscriptionId = typeof subscription?.id === "string" ? subscription.id : "";
      const paymentId = typeof payment?.id === "string" ? payment.id : "";
      if (!paymentId || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) return new Response(JSON.stringify({ ok: true, ignored: "invalid_payment_reference" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      let order: any = null;
      let mappedSubscriptionId = "";
      if (subscriptionId) {
        const { data: mapping } = await admin.from("razorpay_subscription_mappings").select("payment_order_id,razorpay_subscription_id,user_id").eq("razorpay_subscription_id", subscriptionId).maybeSingle();
        if (mapping) {
          mappedSubscriptionId = mapping.razorpay_subscription_id;
          const { data } = await admin.from("payment_orders").select("*").eq("id", mapping.payment_order_id).eq("user_id", mapping.user_id).maybeSingle();
          order = data;
        }
      }
      if (!order) order = await findMappedOrder(admin, payment?.reference_id || payment?.notes?.payment_order_id || payment?.notes?.reference_id, payment?.order_id);
      if (!order) {
        console.warn("Razorpay captured payment had no exact local mapping", { eventId, paymentId });
        return new Response(JSON.stringify({ ok: true, ignored: "unmapped_payment" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const invalid = mappedSubscriptionId
        ? validateCapturedSubscriptionPayment(order, payment, mappedSubscriptionId)
        : validateCapturedPayment(order, payment);
      if (invalid) {
        await recordEvent(admin, order, eventId, paymentId, event.event, "rejected", invalid);
        console.warn("Razorpay captured payment rejected", { eventId, paymentId, orderId: order.id, reason: invalid });
        return new Response(JSON.stringify({ ok: true, ignored: "payment_mismatch" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await admin.rpc("fulfill_razorpay_payment", {
        p_payment_order_id: order.id,
        p_payment_id: paymentId,
        p_provider_event_id: eventId || `razorpay:${paymentId}`,
        p_amount_paise: Number(payment.amount),
        p_currency: String(payment.currency || ""),
        p_signature: null,
        p_source: event.event,
      });
      if (error) {
        console.error("Razorpay fulfillment failed", { eventId, paymentId, orderId: order.id, message: error.message });
        return new Response(JSON.stringify({ error: "Payment fulfillment failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true, processed: event.event }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      const order = await findMappedOrder(admin, payment?.reference_id || payment?.notes?.payment_order_id || payment?.notes?.reference_id, payment?.order_id);
      if (order) {
        const paymentId = typeof payment?.id === "string" ? payment.id : null;
        await recordEvent(admin, order, eventId, paymentId, "payment.failed", "failed", payment?.error_description || "Payment failed at Razorpay");
        if (order.status !== "paid") await admin.from("payment_orders").update({ status: "failed", error_message: "Payment failed" }).eq("id", order.id);
      } else {
        console.warn("Razorpay failed payment was not mapped", { eventId });
      }
      return new Response(JSON.stringify({ ok: true, processed: "payment.failed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "subscription.activated") {
      const subscription = event.payload?.subscription?.entity;
      const subscriptionId = typeof subscription?.id === "string" ? subscription.id : "";
      if (subscriptionId) {
        const { data: mapping } = await admin.from("razorpay_subscription_mappings").select("id,status").eq("razorpay_subscription_id", subscriptionId).maybeSingle();
        if (mapping && mapping.status !== "cancelled") await admin.from("razorpay_subscription_mappings").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", mapping.id);
      }
      return new Response(JSON.stringify({ ok: true, processed: "subscription.activated_without_unlock" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (event.event === "subscription.cancelled" || event.event === "subscription.halted" || event.event === "subscription.paused" || event.event === "subscription.completed") {
      const subscription = event.payload?.subscription?.entity;
      const subscriptionId = typeof subscription?.id === "string" ? subscription.id : "";
      if (subscriptionId) {
        const status = event.event.replace("subscription.", "");
        await admin.from("razorpay_subscription_mappings").update({ status, updated_at: new Date().toISOString() }).eq("razorpay_subscription_id", subscriptionId);
      }
      return new Response(JSON.stringify({ ok: true, processed: event.event }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, ignored: event.event }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("razorpay-webhook error", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "Payment webhook could not process the event" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});