export const PAYMENT_PRODUCTS = {
  merchant_premium: {
    monthly: { amount: 99, days: 30, label: "Merchant Premium Monthly ₹99" },
    yearly: { amount: 999, days: 365, label: "Merchant Premium Yearly ₹999" },
  },
  marriage_bureau: {
    monthly: { amount: 99, days: 30, label: "Marriage Bureau Monthly ₹99" },
    yearly: { amount: 999, days: 365, label: "Marriage Bureau Yearly ₹999" },
  },
  bharat_gaurav: {
    monthly: { amount: 10, days: 30, label: "Bharat Gaurav Monthly ₹10" },
    yearly: { amount: 100, days: 365, label: "Bharat Gaurav Yearly ₹100" },
  },
  coordinator: {
    monthly: { amount: 100, days: 30, label: "Coordinator Monthly ₹100" },
    yearly: { amount: 1000, days: 365, label: "Coordinator Yearly ₹1000" },
  },
  big_merchant: {
    monthly: { amount: 1600, days: 30, label: "Golden Merchant Monthly ₹1600" },
    yearly: { amount: 16000, days: 365, label: "Golden Merchant Yearly ₹16000" },
  },
} as const;

export type PaymentModule = keyof typeof PAYMENT_PRODUCTS;
export type PaymentPlan = "monthly" | "yearly";

export function getPaymentProduct(module: string, plan: string) {
  if (!(module in PAYMENT_PRODUCTS) || (plan !== "monthly" && plan !== "yearly")) return null;
  return PAYMENT_PRODUCTS[module as PaymentModule][plan as PaymentPlan] ?? null;
}

export function validateCapturedPayment(
  order: { id: string; user_id: string; module: string; plan: string; amount: number; currency: string; razorpay_order_id: string | null },
  payment: { id?: string; order_id?: string | null; status?: string; amount?: number; currency?: string },
) {
  const product = getPaymentProduct(order.module, order.plan);
  if (!product) return "Unknown payment product";
  if (!order.user_id || !order.id || !order.razorpay_order_id) return "Payment order is not bound to an account and provider order";
  if (Number(order.amount) !== product.amount || order.currency.toUpperCase() !== "INR") return "Local order does not match the published plan";
  if (!payment.id || !/^pay_[A-Za-z0-9]+$/.test(payment.id)) return "Provider payment reference is invalid";
  if (payment.status !== "captured") return "Payment has not been captured";
  if (payment.order_id !== order.razorpay_order_id) return "Provider order does not match this account's order";
  if (Number(payment.amount) !== product.amount * 100) return "Captured amount does not match the plan";
  if (String(payment.currency || "").toUpperCase() !== "INR") return "Captured currency does not match the plan";
  return null;
}

export function validateCapturedSubscriptionPayment(
  order: { id: string; user_id: string; module: string; plan: string; amount: number; currency: string },
  payment: { id?: string; subscription_id?: string; status?: string; amount?: number; currency?: string },
  mappedSubscriptionId: string,
) {
  const product = getPaymentProduct(order.module, order.plan);
  if (!product) return "Unknown payment product";
  if (!order.user_id || !order.id || !mappedSubscriptionId) return "Subscription is not bound to an account and order";
  if (Number(order.amount) !== product.amount || order.currency.toUpperCase() !== "INR") return "Local order does not match the published plan";
  if (!payment.id || !/^pay_[A-Za-z0-9]+$/.test(payment.id)) return "Provider payment reference is invalid";
  if (payment.status !== "captured") return "Payment has not been captured";
  if (payment.subscription_id !== mappedSubscriptionId) return "Captured payment does not match this account's subscription";
  if (Number(payment.amount) !== product.amount * 100) return "Captured amount does not match the plan";
  if (String(payment.currency || "").toUpperCase() !== "INR") return "Captured currency does not match the plan";
  return null;
}

export function isPaymentOrderOwnedBy(order: { user_id?: string | null } | null | undefined, userId: string) {
  return Boolean(order?.user_id && userId && order.user_id === userId);
}