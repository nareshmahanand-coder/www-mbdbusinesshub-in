## Goal

Add real-time Aadhaar verification using **Surepass Aadhaar OTP** API at the start of the existing e-KYC flow. The user enters their Aadhaar → receives OTP on Aadhaar-linked mobile → enters OTP → Surepass returns verified Aadhaar data (name, DOB, gender, address, photo). Only after successful Surepass verification can they proceed to upload documents/selfies.

## Security First — Token Handling

The Surepass token you shared is a **secret bearer token** and must NEVER be placed in the frontend or committed to the repo. I'll store it as a Supabase secret named `SUREPASS_TOKEN` (added via the secrets tool, with the exact value you provided) and only read it from edge functions via `Deno.env.get("SUREPASS_TOKEN")`.

Sandbox base URL: `https://sandbox.surepass.io` (production: `https://kyc-api.surepass.io`). I'll start with sandbox, exposed via a `SUREPASS_BASE_URL` secret so you can flip to production without a code change.

## Database Changes

Add columns to `kyc_requests` to record Surepass verification:
- `surepass_client_id` text — the `client_id` returned by `generate-otp`, used for `submit-otp`
- `surepass_verified` boolean default false
- `surepass_verified_at` timestamptz
- `surepass_data` jsonb — the verified Aadhaar profile returned by Surepass (name, dob, gender, address, photo link, care_of, etc.)

These let admins audit results and let `kyc-auto-verify` cross-check OCR'd Aadhaar number against the Surepass-confirmed data.

## New Edge Functions

Two thin proxies (verify_jwt = true so only logged-in users can call them; rate-limited per user via in-memory map):

1. `surepass-aadhaar-otp` (POST)
   - Body: `{ aadhaar_number: "12 digits" }`
   - Calls `POST {BASE}/api/v1/aadhaar-v2/generate-otp` with `Authorization: Bearer ${SUREPASS_TOKEN}`
   - Returns `{ client_id, message }` to the frontend (no token leaks)

2. `surepass-aadhaar-verify` (POST)
   - Body: `{ client_id, otp }`
   - Calls `POST {BASE}/api/v1/aadhaar-v2/submit-otp`
   - On success: writes `surepass_client_id`, `surepass_verified=true`, `surepass_verified_at=now()`, `surepass_data=<response.data>` to the user's latest `kyc_requests` row (creates a draft row if none exists yet) using the service role key
   - Returns sanitized profile (name, dob, gender, masked address) to the frontend

Both functions: Zod-validate input, return 400 on bad input, return 502 with the upstream Surepass error message on failure, log non-secret diagnostics.

## Frontend Changes — `src/pages/EkycPage.tsx`

Insert a **Step 1: Aadhaar OTP Verification** block between the Aadhaar number / linked mobile inputs and the document upload section:

```text
[Aadhaar number input]  →  [Send OTP button]
                              ↓
                        [6-digit OTP input + Verify button]
                              ↓
                        ✓ Verified: Shows name, DOB from Surepass
```

State additions: `otpSent`, `clientId`, `otp`, `verifyingOtp`, `aadhaarVerified`, `verifiedProfile`.

Behavior:
- "Send OTP" button enabled only when Aadhaar is 12 digits. Calls `supabase.functions.invoke("surepass-aadhaar-otp", { body: { aadhaar_number } })`.
- On success: shows `InputOTP` component (already in repo) for 6-digit OTP, plus a "Resend OTP" link with a 30-second cooldown.
- "Verify OTP" calls `surepass-aadhaar-verify`. On success: locks the Aadhaar field, shows green confirmation card with verified name/DOB, and reveals the document upload + selfie sections (currently always visible).
- Document upload + selfie + Submit KYC sections are gated behind `aadhaarVerified === true` (collapsed/disabled until then).
- `handleSubmit` additionally requires `aadhaarVerified` and includes `client_id` so the backend row already has the Surepass result attached.

All UI strings keep the existing bilingual Hindi/English style and Nationalist theme.

## Admin Side — `src/components/admin/KycReviewTab.tsx`

Add a small "Surepass Verified" badge (green tick + "आधार Verified via Surepass") on rows where `surepass_verified = true`, and surface the Surepass name/DOB next to the user-typed values so admins can quickly approve.

## Files to Add / Edit

- Add: `supabase/functions/surepass-aadhaar-otp/index.ts`
- Add: `supabase/functions/surepass-aadhaar-verify/index.ts`
- Add: migration with the 4 new columns on `kyc_requests`
- Edit: `src/pages/EkycPage.tsx` (add OTP step + gating)
- Edit: `src/components/admin/KycReviewTab.tsx` (show Surepass badge)
- Edit: `supabase/config.toml` is not required (defaults are fine for these functions)
- Set secrets: `SUREPASS_TOKEN` (your token), `SUREPASS_BASE_URL` = `https://sandbox.surepass.io`

## Notes / Confirmations

- The token expires on **2026-09-30** (decoded from the JWT). When it nears expiry I'll prompt you to rotate via the secrets tool.
- Sandbox flow: in Surepass sandbox, OTP is typically `123456` regardless of the real Aadhaar — confirm with their docs before live testing.
- The existing `kyc-auto-verify` (Gemini OCR) flow stays as a fallback for selfie + Aadhaar-card image checks. Surepass becomes the primary identity proof; OCR is supplementary.
