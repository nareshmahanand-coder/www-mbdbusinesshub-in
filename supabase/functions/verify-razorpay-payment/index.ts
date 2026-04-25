import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const days = Number(order.metadata?.days || (order.plan === "yearly" ? 365 : 30));
  const dates = addDays(days);

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
  }

  if (order.module === "merchant_premium") {
    await admin.from("merchant_profiles").update({
      is_premium: true,
      premium_plan: order.plan,
      premium_start_date: new Date().toISOString(),
      plan_ends_at: dates.end,
      access_status: "active",
    }).eq("user_id", order.user_id);
  }

  if (order.module === "marriage_bureau") {
    await admin.from("matrimony_profiles").update({
      is_published: true,
      subscription_plan: order.plan,
      subscription_start: dates.start,
      subscription_end: dates.end,
    }).eq("user_id", order.user_id);
  }

  await admin.from("payment_orders").update({
    status: "paid",
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    unlocked_at: new Date().toISOString(),
    error_message: null,
  }).eq("id", order.id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) throw new Error("Razorpay secret is not configured");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");
    if (!orderId || !paymentId || !signature) {
      return new Response(JSON.stringify({ error: "Missing Razorpay payment details" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const expected = await hmacSha256(`${orderId}|${paymentId}`, keySecret);
    if (expected !== signature) {
      return new Response(JSON.stringify({ error: "Payment verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: order, error: orderError } = await admin.from("payment_orders").select("*").eq("razorpay_order_id", orderId).eq("user_id", userData.user.id).maybeSingle();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Payment order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (order.status === "paid") {
      return new Response(JSON.stringify({ ok: true, alreadyUnlocked: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await unlock(admin, order, paymentId, signature);
    return new Response(JSON.stringify({ ok: true, module: order.module }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-razorpay-payment error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
