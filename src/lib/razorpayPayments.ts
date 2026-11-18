import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (response: unknown) => void) => void };
  }
}

export type PaymentModule = "merchant_premium" | "marriage_bureau" | "bharat_gaurav" | "coordinator" | "big_merchant";
export type PaymentPlan = "monthly" | "yearly";

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

export const syncLatestRazorpayPayment = async ({ paymentOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, subscription_id }: SyncPaymentOptions & { subscription_id?: string }) => {
  const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
    body: {
      payment_order_id: paymentOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id,
    },
  });

  if (error) return { ok: false, error: error.message || "Payment sync failed" };
  return { ok: Boolean(data?.ok), module: data?.module as PaymentModule | undefined, error: data?.error as string | undefined };
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
      const synced = await syncLatestRazorpayPayment({
        paymentOrderId: data.paymentOrderId,
        razorpay_order_id: orderId,
        razorpay_payment_id: response?.razorpay_payment_id,
        razorpay_signature: response?.razorpay_signature,
      });
      const unlocked = Boolean(synced.ok);

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

export const startMerchantPortalPaymentLink = (options: Omit<StartPaymentOptions, "module">) => startInstantRazorpayPayment({ ...options, module: "merchant_premium" });
export const startMarriageBureauPaymentLink = (options: Omit<StartPaymentOptions, "module">) => startInstantRazorpayPayment({ ...options, module: "marriage_bureau" });
export const startBharatGauravPaymentLink = (options: Omit<StartPaymentOptions, "module">) => startInstantRazorpayPayment({ ...options, module: "bharat_gaurav" });
export const startCoordinatorPaymentLink = (options: Omit<StartPaymentOptions, "module">) => startInstantRazorpayPayment({ ...options, module: "coordinator" });
export const startBigMerchantPayment = (options: Omit<StartPaymentOptions, "module">) => startInstantRazorpayPayment({ ...options, module: "big_merchant" });
