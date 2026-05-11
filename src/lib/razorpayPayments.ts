import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (response: unknown) => void) => void };
  }
}

export type PaymentModule = "merchant_premium" | "marriage_bureau";
export type PaymentPlan = "monthly" | "yearly";

const PAYMENT_LINKS: Record<PaymentModule, Record<PaymentPlan, { url: string; amount: number; planName: string; subscriptionId: string }>> = {
  merchant_premium: {
    monthly: { url: "https://rzp.io/rzp/PKPblN5t", amount: 99, planName: "Merchant Portal ₹99 Monthly Plan", subscriptionId: "sub_ShLRDyN197vaFh" },
    yearly: { url: "https://rzp.io/rzp/CmLBI4u", amount: 999, planName: "Merchant Portal ₹999 Yearly Plan", subscriptionId: "sub_ShLXB2CbEc64Un" },
  },
  marriage_bureau: {
    monthly: { url: "https://rzp.io/rzp/d6TAK5F", amount: 99, planName: "Marriage Bureau ₹99 Monthly Plan", subscriptionId: "" },
    yearly: { url: "https://rzp.io/rzp/WY2NejZi", amount: 999, planName: "Marriage Bureau ₹999 Yearly Plan", subscriptionId: "" },
  },
};

let razorpayScriptPromise: Promise<void> | null = null;

const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load"));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

interface StartPaymentOptions {
  module: PaymentModule;
  plan: PaymentPlan;
  onSuccess: () => void;
  onFailure?: () => void;
}

type RazorpaySuccessResponse = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type SyncPaymentOptions = {
  module?: PaymentModule;
  plan?: PaymentPlan;
  paymentOrderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

const waitForWebhookUnlock = async (orderId: string) => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await supabase
      .from("payment_orders")
      .select("status, razorpay_payment_id, unlocked_at")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (data?.status === "paid" && data.razorpay_payment_id && data.unlocked_at) return true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return false;
};

const waitForPaymentOrderUnlock = async (paymentOrderId: string) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data } = await supabase
      .from("payment_orders")
      .select("status, razorpay_payment_id, unlocked_at")
      .eq("id", paymentOrderId)
      .maybeSingle();

    if (data?.status === "paid" && data.razorpay_payment_id && data.unlocked_at) return true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return false;
};

const waitForActiveMembership = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;

  const today = new Date().toISOString().split("T")[0];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["approved", "active"])
      .gte("ends_at", today)
      .limit(1);

    if (data && data.length > 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return false;
};

export const syncLatestRazorpayPayment = async ({ module, plan, paymentOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }: SyncPaymentOptions) => {
  const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
    body: {
      module,
      plan,
      payment_order_id: paymentOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    },
  });

  if (error) return { ok: false, error: error.message || "Payment sync failed" };
  return { ok: Boolean(data?.ok), module: data?.module as PaymentModule | undefined, error: data?.error as string | undefined };
};

const startPaymentLink = async ({ module, plan, onSuccess, onFailure }: StartPaymentOptions) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Login required");

  const link = PAYMENT_LINKS[module][plan];
  const receipt = `mbd_${module}_link_${Date.now()}`.slice(0, 40);
  const { data: order, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      module,
      plan,
      amount: link.amount,
      currency: "INR",
      status: "created",
      receipt,
      metadata: {
        days: plan === "yearly" ? 365 : 30,
        label: link.planName,
        plan_name: `${module}_${plan}`,
        payment_link_url: link.url,
        payment_link_subscription_id: link.subscriptionId,
        customer_email: user.email || "",
      },
    })
    .select("id")
    .single();

  if (error || !order) throw new Error(error?.message || "Could not start payment");

  const paymentUrl = new URL(link.url);
  if (user.email) paymentUrl.searchParams.set("email", user.email);
  paymentUrl.searchParams.set("reference_id", order.id);

  const popup = window.open(paymentUrl.toString(), "_blank", "noopener,noreferrer");
  if (!popup) window.location.href = paymentUrl.toString();

  let unlocked = await waitForPaymentOrderUnlock(order.id) || (module === "bharat_gaurav" && await waitForActiveMembership());
  if (!unlocked) {
    const synced = await syncLatestRazorpayPayment({ module, plan, paymentOrderId: order.id });
    unlocked = Boolean(synced.ok) || (module === "bharat_gaurav" && await waitForActiveMembership());
  }

  if (!unlocked) {
    onFailure?.();
    throw new Error("Payment sync pending. If money was deducted, use Manual Sync.");
  }

  onSuccess();
};

export const startBharatGauravPaymentLink = async (options: Omit<StartPaymentOptions, "module">) => {
  await startPaymentLink({ ...options, module: "bharat_gaurav" });
};

export const startMerchantPortalPaymentLink = async (options: Omit<StartPaymentOptions, "module">) => {
  await startPaymentLink({ ...options, module: "merchant_premium" });
};

export const startMarriageBureauPaymentLink = async (options: Omit<StartPaymentOptions, "module">) => {
  await startPaymentLink({ ...options, module: "marriage_bureau" });
};

export const startInstantRazorpayPayment = async ({ module, plan, onSuccess, onFailure }: StartPaymentOptions) => {
  await loadRazorpay();

  const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
    body: { module, plan },
  });

  if (error || !data) throw new Error(error?.message || "Could not start payment");
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");

  const checkout = new window.Razorpay({
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name: data.name,
    description: data.description,
    order_id: data.orderId,
    prefill: data.prefill,
    theme: { color: "#FF9933" },
    handler: async (response: RazorpaySuccessResponse) => {
      const orderId = String(response?.razorpay_order_id || data.orderId || "");
      let unlocked = await waitForWebhookUnlock(orderId);
      if (!unlocked) {
        const synced = await syncLatestRazorpayPayment({
          module,
          plan,
          razorpay_order_id: orderId,
          razorpay_payment_id: response?.razorpay_payment_id,
          razorpay_signature: response?.razorpay_signature,
        });
        unlocked = Boolean(synced.ok);
      }

      if (!unlocked) {
        onFailure?.();
        return;
      }

      onSuccess();
    },
    modal: {
      ondismiss: () => onFailure?.(),
    },
  });

  checkout.on("payment.failed", () => onFailure?.());
  checkout.open();
};
