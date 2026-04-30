I checked the current KYC flow. The app already writes to `kyc_requests.status = 'pending'`, but the loop can still happen because the KYC page waits for `refresh()` and the global route guards may re-check stale KYC status before the fresh database row is seen. Also, the database does not have a separate `kyc_status` column; the equivalent status is `public.kyc_requests.status`.

Plan to fix it now:

1. Make KYC success immediately navigate to Membership
   - In `src/pages/EkycPage.tsx`, move the redirect into the confirmed success path immediately after the pending KYC row is saved.
   - Do not wait on `refresh()` before navigation.
   - Use `navigate('/membership', { replace: true })` and also add a safe fallback `window.location.replace('/membership')` if the SPA navigation does not complete.

2. Add a local “KYC submitted” guard to break stale-status loops
   - When the KYC row is inserted successfully, store a short local marker such as `mbd-kyc-submitted-{userId}`.
   - Update `useKycStatus()` so if the database query is momentarily stale/empty but this marker exists, it returns `pending` instead of `none`.
   - This prevents the route guard from sending the user back to `/ekyc` immediately after a successful submit.

3. Never show the empty KYC form again for submitted users
   - In `EkycPage`, if status is `pending` or `approved`, automatically redirect to `/membership` instead of rendering the form/status card.
   - Keep a small loading message only while redirecting.
   - This satisfies: once submitted, users should go to Membership/Dashboard, not back to KYC.

4. Make submit resilient if the user already has an existing KYC row
   - Before creating a new request, check the latest `kyc_requests` row for the user.
   - If it is already `pending` or `approved`, set the local marker and redirect to `/membership` immediately.
   - If insertion returns a duplicate/permission issue but an existing pending/approved row is found, still redirect to Membership.

5. Keep upload errors non-blocking for launch
   - Preserve the existing behavior: create the pending KYC record first, then upload photos.
   - If photo upload fails, show the exact toast error but still keep KYC status as `pending` and continue to Membership to avoid drop-offs.

6. Backend verification/migration if needed
   - Verify `kyc-documents` bucket and policies remain in place.
   - No new `kyc_status` column will be added unless absolutely necessary, because the app’s current schema uses `kyc_requests.status` as the KYC status source.

Expected result:
- After the “Successful” toast, user lands on `/membership`.
- `kyc_requests.status` is `pending` after submit.
- Reloading or logging in again will not show the empty KYC form if the user already submitted KYC.
- Membership route remains open for `pending` KYC users so they can select a plan and pay.