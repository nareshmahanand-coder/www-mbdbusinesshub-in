import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Top voices — Aria (better Indian-accent number pronunciation) is default
const VOICE_MAP: Record<string, string> = {
  matilda: "XrExE9yKIg1WjnnlVkGX",
  aria: "9BWtsMINqrJLrRacOk9x",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  jessica: "cgSgspJ2msm6clMCkdW9",
};

// ===== Hindi number-to-words (0 – 99,99,99,999) =====
const HI_ONES = ["शून्य","एक","दो","तीन","चार","पाँच","छह","सात","आठ","नौ","दस","ग्यारह","बारह","तेरह","चौदह","पंद्रह","सोलह","सत्रह","अठारह","उन्नीस","बीस","इक्कीस","बाईस","तेईस","चौबीस","पच्चीस","छब्बीस","सत्ताईस","अट्ठाईस","उनतीस","तीस","इकतीस","बत्तीस","तैंतीस","चौंतीस","पैंतीस","छत्तीस","सैंतीस","अड़तीस","उनतालीस","चालीस","इकतालीस","बयालीस","तैंतालीस","चौवालीस","पैंतालीस","छियालीस","सैंतालीस","अड़तालीस","उनचास","पचास","इक्यावन","बावन","तिरेपन","चौवन","पचपन","छप्पन","सत्तावन","अट्ठावन","उनसठ","साठ","इकसठ","बासठ","तिरेसठ","चौंसठ","पैंसठ","छियासठ","सड़सठ","अड़सठ","उनहत्तर","सत्तर","इकहत्तर","बहत्तर","तिहत्तर","चौहत्तर","पचहत्तर","छिहत्तर","सतहत्तर","अठहत्तर","उन्यासी","अस्सी","इक्यासी","बयासी","तिरासी","चौरासी","पचासी","छियासी","सत्तासी","अट्ठासी","नवासी","नब्बे","इक्यानवे","बानवे","तिरानवे","चौरानवे","पचानवे","छियानवे","सत्तानवे","अट्ठानवे","निन्यानवे"];
function hiBelowHundred(n: number): string {
  return HI_ONES[n] ?? "";
}
function hiBelowThousand(n: number): string {
  if (n < 100) return hiBelowHundred(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hundred = `${HI_ONES[h]} सौ`;
  return r === 0 ? hundred : `${hundred} ${hiBelowHundred(r)}`;
}
function numberToHindiWords(num: number): string {
  if (!Number.isFinite(num)) return String(num);
  if (num < 0) return `ऋण ${numberToHindiWords(-num)}`;
  if (num === 0) return "शून्य";
  let n = Math.floor(num);
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  if (crore) parts.push(`${hiBelowHundred(crore)} करोड़`);
  if (lakh) parts.push(`${hiBelowHundred(lakh)} लाख`);
  if (thousand) parts.push(`${hiBelowHundred(thousand)} हज़ार`);
  if (rest) parts.push(hiBelowThousand(rest));
  return parts.join(" ").trim();
}

// Replace standalone integers in the text with Hindi words.
// Only ints up to 9 digits are spelled out; longer numbers are read as digit-by-digit.
function normalizeNumbersForHindi(text: string): string {
  return text.replace(/\d[\d,]*/g, (match) => {
    const digits = match.replace(/,/g, "");
    if (digits.length > 9) {
      return digits.split("").map((d) => HI_ONES[parseInt(d, 10)]).join(" ");
    }
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) return match;
    return numberToHindiWords(n);
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voice = "aria" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedText = normalizeNumbersForHindi(text);

    // Primary: Lovable AI Gateway TTS (openai/gpt-4o-mini-tts) — works on all
    // plans, no extra provider key needed. Returns mp3 bytes we base64-encode
    // so the client can play via `data:audio/mpeg;base64,...` (same shape as
    // before, so no client changes required).
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gatewayVoice = (() => {
      const v = String(voice ?? "").toLowerCase();
      // Map our historical voice names to gpt-4o-mini-tts voices.
      if (["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer","verse"].includes(v)) return v;
      if (v === "matilda" || v === "sarah" || v === "jessica") return "shimmer";
      return "alloy"; // aria & default
    })();

    let r: Response | null = null;
    if (lovableKey) {
      r = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-tts",
          input: normalizedText,
          voice: gatewayVoice,
          response_format: "mp3",
          stream_format: "audio",
        }),
      });
    }

    // Fallback: ElevenLabs (only works on paid plan; kept for future).
    if (!r || !r.ok) {
      const elKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (elKey && (!r || r.status !== 402)) {
        const voiceId = VOICE_MAP[String(voice).toLowerCase()] ?? VOICE_MAP.aria;
        const el = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: normalizedText,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true, speed: 1.0 },
            }),
          },
        );
        if (el.ok) r = el;
        else if (!r) r = el;
      }
    }

    if (!r || !r.ok) {
      const status = r?.status ?? 500;
      const err = await r.text();
      console.error("TTS error:", status, err);
      let parsed: any = {};
      try { parsed = JSON.parse(err); } catch {}
      const isPaymentRequired = status === 402 || parsed?.detail?.code === "paid_plan_required";
      return new Response(
        JSON.stringify({
          error: isPaymentRequired ? "PAYMENT_REQUIRED" : "SERVICE_UNAVAILABLE",
          fallback: true,
          detail: parsed?.detail ?? err,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const buf = await r.arrayBuffer();
    const audioContent = base64Encode(buf);

    return new Response(JSON.stringify({ audioContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});