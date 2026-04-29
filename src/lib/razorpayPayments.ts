import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (response: unknown) => void) => void };
  }
}

export type PaymentModule = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
export type PaymentPlan = "monthly" | "yearly";

const BHARAT_GAURAV_PAYMENT_LINKS: Record<PaymentPlan, { url: string; amount: number; planName: string; subscriptionId: string }> = {
  monthly: {
    url: "https://rzp.io/rzp/HcZ53Lpl",
    amount: 1,
    planName: "Bharat Gaurav Membership ₹1 Plan",
    subscriptionId: "sub_ShFY15RTkXtfeU",
  },
  yearly: {
    url: "https://rzp.io/rzp/0WkIfbVd",
    amount: 12,
    planName: "Bharat Gaurav Membership ₹12 Plan",
    subscriptionId: "sub_ShFULxQPgrTChe",
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

export const startBharatGauravPaymentLink = async ({ plan, onSuccess, onFailure }: Omit<StartPaymentOptions, "module">) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Login required");

  const link = BHARAT_GAURAV_PAYMENT_LINKS[plan];
  const receipt = `mbd_link_${plan}_${Date.now()}`.slice(0, 40);
  const { data: order, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      module: "bharat_gaurav",
      plan,
      amount: link.amount,
      currency: "INR",
      status: "created",
      receipt,
      metadata: {
        days: plan === "yearly" ? 365 : 30,
        label: link.planName,
        plan_name: `bharat_gaurav_${plan}`,
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

  const unlocked = await waitForPaymentOrderUnlock(order.id);
  if (!unlocked) {
    onFailure?.();
    throw new Error("Payment received. Waiting for Razorpay confirmation — please refresh in a moment.");
  }

  onSuccess();
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
    handler: async (response: any) => {
      const orderId = String(response?.razorpay_order_id || data.orderId || "");
      const unlocked = await waitForWebhookUnlock(orderId);

      if (!unlocked) {
        throw new Error("Payment received. Waiting for Razorpay confirmation — please refresh in a moment.");
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
