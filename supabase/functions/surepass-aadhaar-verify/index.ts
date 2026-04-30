import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUREPASS_TOKEN = Deno.env.get("SUREPASS_TOKEN");
    const SUREPASS_BASE_URL = (Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.io").replace(/\/$/, "");
    if (!SUREPASS_TOKEN) {
      return new Response(JSON.stringify({ error: "SUREPASS_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const clientId = String(body?.client_id ?? "").trim();
    const otp = String(body?.otp ?? "").replace(/\D/g, "");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "client_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (otp.length < 4 || otp.length > 8) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sandbox mode: accept any 6-digit OTP as success (Surepass sandbox does not deliver real OTPs).
    const isSandbox = SUREPASS_BASE_URL.includes("sandbox");
    let json: any = null;
    let data: any = {};

    if (isSandbox && otp.length === 6) {
      console.log("[surepass-aadhaar-verify] Sandbox bypass: accepting OTP", { clientId });
      data = {
        full_name: "Sandbox Test User",
        dob: "1990-01-01",
        gender: "M",
        aadhaar_number: "",
        sandbox: true,
      };
      json = { success: true, data };
    } else {
      const upstream = await fetch(`${SUREPASS_BASE_URL}/api/v1/aadhaar-v2/submit-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUREPASS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ client_id: clientId, otp }),
      });

      const text = await upstream.text();
      try { json = JSON.parse(text); } catch { json = { raw: text }; }

      if (!upstream.ok || json?.success === false) {
        console.error("Surepass submit-otp failed", upstream.status, json);
        return new Response(
          JSON.stringify({
            error: json?.message || json?.message_code || `Surepass error (${upstream.status})`,
            details: json,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      data = json?.data ?? {};
    }

    const aadhaarNumberFromCard = String(data?.aadhaar_number ?? "").replace(/\D/g, "");
    const fullName = data?.full_name ?? data?.name ?? "";
    const dob = data?.dob ?? "";
    const gender = data?.gender ?? "";

    // Persist verification on the user's latest kyc_requests row using service role
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: existing } = await admin
      .from("kyc_requests")
      .select("id, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const updatePayload = {
      surepass_client_id: clientId,
      surepass_verified: true,
      surepass_verified_at: new Date().toISOString(),
      surepass_data: data,
    } as Record<string, unknown>;

    // In sandbox mode, auto-approve the KYC so the user can proceed to membership immediately.
    if (isSandbox) {
      updatePayload.status = "approved";
      updatePayload.rejection_reason = null;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    if (existing?.id) {
      const { error: updErr } = await admin
        .from("kyc_requests")
        .update(updatePayload)
        .eq("id", existing.id);
      if (updErr) console.error("Failed to update kyc_requests:", updErr);
    } else {
      // Create a draft row so the verification is preserved before user submits docs
      const draft = {
        user_id: userId,
        aadhaar_number: aadhaarNumberFromCard || "000000000000",
        aadhaar_linked_mobile: "",
        selfie_url: "pending",
        selfie_with_aadhaar_url: "pending",
        aadhaar_front_url: "pending",
        aadhaar_back_url: "pending",
        status: isSandbox ? "approved" : "draft",
        ...updatePayload,
      };
      const { error: insErr } = await admin.from("kyc_requests").insert(draft);
      if (insErr) console.error("Failed to insert draft kyc_requests:", insErr);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        verified: true,
        profile: {
          full_name: fullName,
          dob,
          gender,
          aadhaar_last4: aadhaarNumberFromCard ? aadhaarNumberFromCard.slice(-4) : null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("surepass-aadhaar-verify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
