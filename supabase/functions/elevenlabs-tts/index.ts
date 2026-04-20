import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Top voices — Matilda (warm female) is default; Aria fallback
const VOICE_MAP: Record<string, string> = {
  matilda: "XrExE9yKIg1WjnnlVkGX",
  aria: "9BWtsMINqrJLrRacOk9x",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  jessica: "cgSgspJ2msm6clMCkdW9",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voice = "matilda" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceId = VOICE_MAP[voice.toLowerCase()] ?? VOICE_MAP.matilda;

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // best for Hindi + English
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!r.ok) {
      const err = await r.text();
      console.error("ElevenLabs TTS error:", r.status, err);
      return new Response(JSON.stringify({ error: "TTS failed", detail: err }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = await r.arrayBuffer();
    const audioContent = base64Encode(new Uint8Array(buf));

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