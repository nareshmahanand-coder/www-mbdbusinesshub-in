# Isolate payments and subscriptions per account

## Outcome

Every paid feature is activated only after Razorpay confirms a payment that matches the authenticated account's own local order, product, plan, amount, and currency. Failed, duplicate, unrelated, or uncorrelated callbacks must never change another account's access.

## Build plan

1. **Correct the account binding and trust boundary**
   - Audit coordinator, merchant, Golden Merchant, Marriage Bureau, and Bharat Gaurav access checks for exact `user_id`/owner matching.
   - Remove browser-side writes that can create paid orders or active entitlements. Keep each person's payment history readable only by that person, with admin visibility where appropriate.
   - Require a verified captured Razorpay payment to match the selected order ID, local account, product, plan, exact expected amount, and INR currency. Never fall back to a different pending order, email, phone, amount-only match, or a guessed account.
   - Treat failed callbacks as failures; remove the Bharat Gaurav browser activation on both success and failure callbacks.

2. **Make fulfillment atomic and repeat-safe**
   - Add additive database support for per-account recurring subscription mappings and a private, account-scoped payment event history.
   - Fulfill a verified payment in one database transaction so order status, the specific user's entitlement, coordinator status, and commission effects cannot partially diverge. Reject replayed provider payment IDs and record ignored/failed events without activating access.
   - Keep subscription IDs separate from captured payment IDs. Process renewal charges against the mapped account; activation alone does not count as a paid charge. Handle failures and cancellation without extending access.

3. **Unify the listed tiers and diagnostics**
   - Use one server-side price catalog for Bharat Gaurav (₹10 monthly), Merchant Premium (₹99 monthly), Golden Merchant (₹1,600 monthly), and Marriage Bureau (₹99 monthly), while preserving already offered yearly options at their established prices.
   - Fix the Marriage Bureau yearly price mismatch and add Golden Merchant payment-link mapping only where its provider reference is verifiable.
   - Show an account's own recent payment attempts and result by plan, with timestamp and safe failure detail; keep sensitive signatures and secret data out of the UI and logs.

4. **Verify safely**
   - Add tests for account ownership, plan/amount mapping, failed payment rejection, callback/order mismatch, replay, and idempotent renewal.
   - Run the existing tests, deploy the affected payment functions, test non-mutating invalid callbacks, inspect recent function logs and live policy/schema state, and verify the current account's payment history.
   - Do not make real charges or alter other users' payment records during verification.

## Technical details

- Use a service-only, narrowly scoped fulfillment function to commit verified entitlements and audit events atomically; client roles must not invoke it.
- Enforce owner-scoped RLS for payment status and audit history, while only trusted server code may create payment orders, modify payment results, or change paid entitlements.
- Keep the existing Razorpay credentials in Lovable Cloud secrets. Never expose private keys, webhook signatures, or service-role credentials in browser code or logs.
- Golden Merchant's monthly auto-debit requires the actual Razorpay subscription plan/mapping. No plan ID was supplied, so do not invent one or claim recurring Golden Merchant is configured without verifying the existing provider setup.
