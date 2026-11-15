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