import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTS = {
  merchant_premium: {
    monthly: { amount: 99, amountPaise: 9900, days: 30, label: "Merchant Premium Monthly" },
    yearly: { amount: 999, amountPaise: 99900, days: 365, label: "Merchant Premium Yearly - Best Value" },
  },
  marriage_bureau: {
    monthly: { amount: 99, amountPaise: 9900, days: 30, label: "Mera Jeevansathi Monthly Premium" },
    yearly: { amount: 99, amountPaise: 9900, days: 365, label: "Mera Jeevansathi Yearly Premium" },
  },
  bharat_gaurav: {
    monthly: { amount: 10, amountPaise: 1000, days: 30, label: "Bharat Gaurav Membership Monthly ₹10" },
    yearly: { amount: 100, amountPaise: 10000, days: 365, label: "Bharat Gaurav Membership Yearly ₹100" },
  },
  coordinator: {
    monthly: { amount: 100, amountPaise: 10000, days: 30, label: "Coordinator Monthly Subscription ₹100 (Auto-Debit)" },
    yearly: { amount: 1000, amountPaise: 100000, days: 365, label: "Coordinator Yearly Subscription ₹1000" },
  },
  big_merchant: {
    monthly: { amount: 1600, amountPaise: 160000, days: 30, label: "Big Merchant Plus Monthly ₹1600" },
    yearly: { amount: 16000, amountPaise: 1600000, days: 365, label: "Big Merchant Plus Yearly ₹16000" },

  },
} as const;


type ModuleName = keyof typeof PRODUCTS;
type PlanName = "monthly" | "yearly";

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
    const module = String(body.module || "") as ModuleName;
    const plan = String(body.plan || "") as PlanName;
    const product = PRODUCTS[module]?.[plan];

    if (!product) {
      return new Response(JSON.stringify({ error: "Invalid payment module or plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const receipt = `mbd_${module}_${plan}_${Date.now()}`.slice(0, 40);
    const orderResp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: product.amountPaise,
        currency: "INR",
        receipt,
        notes: {
          user_id: userData.user.id,
          module,
          plan,
          label: product.label,
        },
      }),
    });

    const order = await orderResp.json();
    if (!orderResp.ok) {
      console.error("Razorpay order error", order);
      return new Response(JSON.stringify({ error: "Could not start payment. Please retry." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { error: insertError } = await admin.from("payment_orders").insert({
      user_id: userData.user.id,
      module,
      plan,
      amount: product.amount,
      currency: "INR",
      status: "created",
      razorpay_order_id: order.id,
      receipt,
      metadata: { days: product.days, label: product.label, plan_name: `${module}_${plan}` },
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "Mera Bharat Dukaan",
      description: product.label,
      prefill: {
        name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || "",
        email: userData.user.email || "",
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("create-razorpay-order error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
