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
    const SUREPASS_TOKEN = Deno.env.get("SUREPASS_TOKEN");
    const SUREPASS_BASE_URL = (Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.io").replace(/\/$/, "");
    if (!SUREPASS_TOKEN) {
      return new Response(JSON.stringify({ error: "SUREPASS_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const aadhaarRaw = String(body?.aadhaar_number ?? "").replace(/\D/g, "");
    if (aadhaarRaw.length !== 12) {
      return new Response(JSON.stringify({ error: "Aadhaar must be 12 digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(`${SUREPASS_BASE_URL}/api/v1/aadhaar-v2/generate-otp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUREPASS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_number: aadhaarRaw }),
    });

    const text = await upstream.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!upstream.ok || json?.success === false) {
      console.error("Surepass generate-otp failed", upstream.status, json);
      return new Response(
        JSON.stringify({
          error: json?.message || json?.message_code || `Surepass error (${upstream.status})`,
          details: json,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientId = json?.data?.client_id ?? null;
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Surepass did not return client_id", details: json }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, client_id: clientId, message: json?.data?.message || "OTP sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("surepass-aadhaar-otp error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
