import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getPaymentProduct, isPaymentOrderOwnedBy, validateCapturedPayment, validateCapturedSubscriptionPayment } from "./paymentCatalog.ts";

Deno.test("monthly prices remain isolated by requested tier", () => {
  assertEquals(getPaymentProduct("bharat_gaurav", "monthly")?.amount, 10);
  assertEquals(getPaymentProduct("merchant_premium", "monthly")?.amount, 99);
  assertEquals(getPaymentProduct("big_merchant", "monthly")?.amount, 1600);
  assertEquals(getPaymentProduct("marriage_bureau", "monthly")?.amount, 99);
});

Deno.test("yearly tiers keep their published amounts and durations", () => {
  assertEquals(getPaymentProduct("bharat_gaurav", "yearly")?.amount, 100);
  assertEquals(getPaymentProduct("merchant_premium", "yearly")?.amount, 999);
  assertEquals(getPaymentProduct("big_merchant", "yearly")?.amount, 16000);
  assertEquals(getPaymentProduct("marriage_bureau", "yearly")?.amount, 999);
});

Deno.test("unknown modules and plans are rejected", () => {
  assertEquals(getPaymentProduct("coordinator", "weekly"), null);
  assertEquals(getPaymentProduct("unknown", "monthly"), null);
});

Deno.test("captured payment must match this user's exact provider order, tier, amount, and currency", () => {
  const order = { id: "order-row-a", user_id: "user-a", module: "merchant_premium", plan: "monthly", amount: 99, currency: "INR", razorpay_order_id: "order_provider_a" };
  const payment = { id: "pay_success1", order_id: "order_provider_a", status: "captured", amount: 9900, currency: "INR" };
  assertEquals(validateCapturedPayment(order, payment), null);
  assertEquals(validateCapturedPayment(order, { ...payment, order_id: "order_provider_b" }), "Provider order does not match this account's order");
  assertEquals(validateCapturedPayment(order, { ...payment, amount: 1000 }), "Captured amount does not match the plan");
  assertEquals(validateCapturedPayment(order, { ...payment, currency: "USD" }), "Captured currency does not match the plan");
});

Deno.test("failed provider payments can never pass capture validation", () => {
  const order = { id: "order-row-b", user_id: "user-b", module: "bharat_gaurav", plan: "monthly", amount: 10, currency: "INR", razorpay_order_id: "order_provider_b" };
  assertEquals(validateCapturedPayment(order, { id: "pay_failed1", order_id: "order_provider_b", status: "failed", amount: 1000, currency: "INR" }), "Payment has not been captured");
});

Deno.test("a valid callback cannot be applied to another account's payment order", () => {
  assertEquals(isPaymentOrderOwnedBy({ user_id: "account-a" }, "account-a"), true);
  assertEquals(isPaymentOrderOwnedBy({ user_id: "account-a" }, "account-b"), false);
  assertEquals(isPaymentOrderOwnedBy(null, "account-a"), false);
});

Deno.test("subscription capture requires the exact mapped subscription and captured charge", () => {
  const order = { id: "row-1", user_id: "user-1", module: "bharat_gaurav", plan: "monthly", amount: 10, currency: "INR" };
  const payment = { id: "pay_sub1", subscription_id: "sub_user1", status: "captured", amount: 1000, currency: "INR" };
  assertEquals(validateCapturedSubscriptionPayment(order, payment, "sub_user1"), null);
  assertEquals(validateCapturedSubscriptionPayment(order, { ...payment, subscription_id: "sub_other" }, "sub_user1"), "Captured payment does not match this account's subscription");
  assertEquals(validateCapturedSubscriptionPayment(order, { ...payment, status: "failed" }, "sub_user1"), "Payment has not been captured");
});