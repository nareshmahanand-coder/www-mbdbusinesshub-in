import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const enc = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

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

    if (!orderId || !paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: "no_payment_order" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await admin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).maybeSingle();

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
