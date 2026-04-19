import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  kycRequestId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kycRequestId } = (await req.json()) as VerifyRequest;
    if (!kycRequestId) throw new Error("kycRequestId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch the KYC row (incl. typed Aadhaar number for OCR matching)
    const { data: kyc, error: kycErr } = await supabase
      .from("kyc_requests")
      .select("id, user_id, selfie_url, aadhaar_front_url, aadhaar_number, status")
      .eq("id", kycRequestId)
      .maybeSingle();
    if (kycErr || !kyc) throw new Error("KYC request not found");
    if (kyc.status === "approved") {
      return new Response(JSON.stringify({ ok: true, status: "approved", note: "already approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const typedAadhaar = (kyc.aadhaar_number || "").replace(/\D/g, "");

    // Get signed URLs (bucket is private)
    const [{ data: selfieSigned }, { data: frontSigned }] = await Promise.all([
      supabase.storage.from("kyc-documents").createSignedUrl(kyc.selfie_url, 60),
      supabase.storage.from("kyc-documents").createSignedUrl(kyc.aadhaar_front_url, 60),
    ]);
    if (!selfieSigned?.signedUrl || !frontSigned?.signedUrl) throw new Error("Could not sign URLs");

    // Download both as base64 for the multimodal request
    const fetchAsB64 = async (url: string): Promise<{ b64: string; mime: string }> => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Failed to download image: ${r.status}`);
      const mime = r.headers.get("content-type") ?? "image/jpeg";
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      return { b64: btoa(bin), mime };
    };

    const [selfieImg, frontImg] = await Promise.all([
      fetchAsB64(selfieSigned.signedUrl),
      fetchAsB64(frontSigned.signedUrl),
    ]);

    // Call Gemini Vision via Lovable AI Gateway with structured tool output
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a strict KYC document verifier for an Indian super-app. Analyse the SELFIE image and the AADHAAR FRONT image. Decide if (a) the selfie clearly shows ONE human face, (b) the Aadhaar image clearly shows an Aadhaar card (look for the Aadhaar logo, the word 'AADHAAR' or 'आधार', a 12-digit number, and a photo). Then OCR the 12-digit Aadhaar number you can see on the card and return it as exactly 12 digits with no spaces (or empty string if you cannot read it). Be lenient on lighting/quality but strict on content. Return your decision via the verify_kyc tool.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Image 1: SELFIE" },
              { type: "image_url", image_url: { url: `data:${selfieImg.mime};base64,${selfieImg.b64}` } },
              { type: "text", text: "Image 2: AADHAAR FRONT" },
              { type: "image_url", image_url: { url: `data:${frontImg.mime};base64,${frontImg.b64}` } },
              { type: "text", text: `User typed Aadhaar number: ${typedAadhaar}. Verify if this matches the number printed on the card.` },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_kyc",
              description: "Return KYC verification decision",
              parameters: {
                type: "object",
                properties: {
                  face_detected: { type: "boolean" },
                  aadhaar_detected: { type: "boolean" },
                  aadhaar_number_ocr: { type: "string", description: "12-digit number read from the card, or empty string" },
                  confidence: { type: "number", description: "0-1" },
                  reason: { type: "string", description: "Short reason in Hindi/English" },
                },
                required: ["face_detected", "aadhaar_detected", "aadhaar_number_ocr", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_kyc" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Gemini error", aiResp.status, t);
      // Don't fail KYC — leave as pending for admin
      return new Response(JSON.stringify({ ok: false, status: "pending", error: "ai_unavailable" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ ok: false, status: "pending", error: "no_tool_call" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const { face_detected, aadhaar_detected, aadhaar_number_ocr, confidence, reason } = args;
    const ocrDigits = String(aadhaar_number_ocr || "").replace(/\D/g, "");
    const numberMatches = ocrDigits.length === 12 && typedAadhaar.length === 12 && ocrDigits === typedAadhaar;

    let newStatus = "pending";
    let updatePayload: Record<string, unknown> = { reviewed_at: new Date().toISOString() };

    if (face_detected && aadhaar_detected && numberMatches && confidence >= 0.55) {
      newStatus = "approved";
      updatePayload = { ...updatePayload, status: "approved", rejection_reason: null };
    } else if (face_detected && aadhaar_detected && ocrDigits.length === 12 && !numberMatches) {
      // Hard reject: card is real but typed number doesn't match the card
      newStatus = "rejected";
      updatePayload = {
        ...updatePayload,
        status: "rejected",
        rejection_reason: `AI: Aadhaar number mismatch. Card shows ${ocrDigits.slice(0, 4)}XXXXXXXX, you typed ${typedAadhaar.slice(0, 4)}XXXXXXXX.`,
      };
    } else {
      // Leave pending for admin review
      updatePayload = { ...updatePayload, rejection_reason: `AI: ${reason}` };
    }

    const { error: updErr } = await supabase
      .from("kyc_requests")
      .update(updatePayload)
      .eq("id", kycRequestId);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ ok: true, status: newStatus, face_detected, aadhaar_detected, aadhaar_number_ocr: ocrDigits, number_matches: numberMatches, confidence, reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("kyc-auto-verify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
