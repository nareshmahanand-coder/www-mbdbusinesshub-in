import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";
import { getPaymentProduct } from "../_shared/paymentCatalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PLANS: Record<string, { membership_type: string; plan_type: "monthly" | "yearly"; total_count: number }> = {
  plan_Sonz8QMSYJQ8cx: { module: "bharat_gaurav", plan: "monthly", total_count: 12 },
  plan_Soo38x1j9KMuTU: { module: "bharat_gaurav", plan: "yearly", total_count: 5 },
  plan_SoftV7FRW88Nyw: { module: "marriage_bureau", plan: "monthly", total_count: 12 },
  plan_Sofym9Nx6NwKm2: { module: "marriage_bureau", plan: "yearly", total_count: 5 },
  plan_Sog3FYTMTLP6pf: { module: "merchant_premium", plan: "monthly", total_count: 12 },
  plan_Sog7TMDdTEJMge: { module: "merchant_premium", plan: "yearly", total_count: 5 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const planId = String(body.plan_id || "");
    const meta = ALLOWED_PLANS[planId];
    if (!meta) {
      return new Response(JSON.stringify({ error: "Invalid plan_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const product = getPaymentProduct(meta.module, meta.plan);
    if (!product) return new Response(JSON.stringify({ error: "Invalid subscription plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const receipt = `mbd_${meta.module}_${meta.plan}_${crypto.randomUUID()}`.slice(0, 40);
    const { data: paymentOrder, error: orderError } = await admin.from("payment_orders").insert({
      user_id: userData.user.id, module: meta.module, plan: meta.plan, amount: product.amount,
      currency: "INR", status: "created", receipt,
      metadata: { days: product.days, label: product.label, plan_name: `${meta.module}_${meta.plan}`, checkout_type: "subscription" },
    }).select("id").single();
    if (orderError || !paymentOrder) throw orderError || new Error("Could not create payment record");

    const subResp = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: meta.total_count,
        customer_notify: 1,
        notes: {
          user_id: userData.user.id,
          payment_order_id: paymentOrder.id,
          module: meta.module,
          plan: meta.plan,
        },
      }),
    });

    const sub = await subResp.json();
    if (!subResp.ok) {
      await admin.from("payment_orders").update({ status: "failed", error_message: "Could not create Razorpay subscription" }).eq("id", paymentOrder.id).eq("user_id", userData.user.id);
      console.error("Razorpay subscription error", sub);
      return new Response(JSON.stringify({ error: sub?.error?.description || "Could not create subscription" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: providerOrderError } = await admin.from("payment_orders").update({ razorpay_order_id: sub.id }).eq("id", paymentOrder.id).eq("user_id", userData.user.id);
    if (providerOrderError) throw providerOrderError;
    const { error: mappingError } = await admin.from("razorpay_subscription_mappings").insert({
      user_id: userData.user.id, payment_order_id: paymentOrder.id, module: meta.module, plan: meta.plan,
      razorpay_subscription_id: sub.id, razorpay_plan_id: planId, status: "created",
    });
    if (mappingError) throw mappingError;

    return new Response(JSON.stringify({
      keyId,
      subscriptionId: sub.id,
      paymentOrderId: paymentOrder.id,
      membership_type: meta.module,
      plan_type: meta.plan,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-subscription error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});