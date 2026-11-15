import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getPaymentProduct } from "./paymentCatalog.ts";

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