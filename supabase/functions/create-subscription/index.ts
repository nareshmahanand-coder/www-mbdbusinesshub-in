import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PLANS: Record<string, { membership_type: string; plan_type: "monthly" | "yearly"; total_count: number }> = {
  // Bharat Gaurav
  plan_Sonz8QMSYJQ8cx: { membership_type: "bharat_gaurav", plan_type: "monthly", total_count: 12 },
  plan_Soo38x1j9KMuTU: { membership_type: "bharat_gaurav", plan_type: "yearly", total_count: 5 },
  // Marriage Bureau
  plan_SoftV7FRW88Nyw: { membership_type: "marriage_bureau", plan_type: "monthly", total_count: 12 },
  plan_Sofym9Nx6NwKm2: { membership_type: "marriage_bureau", plan_type: "yearly", total_count: 5 },
  // Merchant Portal
  plan_Sog3FYTMTLP6pf: { membership_type: "merchant_portal", plan_type: "monthly", total_count: 12 },
  plan_Sog7TMDdTEJMge: { membership_type: "merchant_portal", plan_type: "yearly", total_count: 5 },
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
          membership_type: meta.membership_type,
          plan_type: meta.plan_type,
        },
      }),
    });

    const sub = await subResp.json();
    if (!subResp.ok) {
      console.error("Razorpay subscription error", sub);
      return new Response(JSON.stringify({ error: sub?.error?.description || "Could not create subscription" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      keyId,
      subscriptionId: sub.id,
      membership_type: meta.membership_type,
      plan_type: meta.plan_type,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-subscription error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});