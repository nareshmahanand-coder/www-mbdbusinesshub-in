import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "openai/gpt-5.6-sol";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function translateBatch(texts: string[], target: "en" | "hi", apiKey: string): Promise<Record<string, string>> {
  const targetName = target === "hi" ? "Hindi (Devanagari script)" : "English";
  const prompt = `You translate user-interface strings for an Indian hyperlocal marketplace app called "Mera Bharat Dukaan".

Translate every item of the JSON array below into ${targetName}.

Rules:
- Keep the SAME order and the SAME number of items.
- Keep numbers, currency symbols (₹), percentages, emojis, punctuation and placeholders like {name} or %s unchanged.
- Do NOT translate brand or product names: Mera Bharat Dukaan, Bharat Mitra AI, WhatsApp, UPI, Razorpay, Aadhaar, PAN, GST, Golden Merchant, Premium Merchant, Bharat Gaurav.
- If an item is already in ${targetName}, return it unchanged.
- Keep the tone short, simple and respectful, suitable for UI labels and buttons.

Reply with ONLY a JSON array of translated strings, no markdown, no explanation.

${JSON.stringify(texts)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`AI gateway error ${res.status}: ${detail.slice(0, 300)}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  // Consume the SSE stream and accumulate the output text.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
        if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !out) {
          out = evt.response.output_text;
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  const cleaned = out.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("Model did not return JSON");
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }
  if (!Array.isArray(parsed)) throw new Error("Model did not return an array");

  const map: Record<string, string> = {};
  texts.forEach((src, i) => {
    const val = parsed[i];
    if (typeof val === "string" && val.trim()) map[src] = val;
  });
  return map;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const target: "en" | "hi" = body?.target === "hi" ? "hi" : "en";
    const rawTexts: unknown = body?.texts;
    if (!Array.isArray(rawTexts)) return jsonResponse({ error: "texts must be an array" }, 400);

    const texts = Array.from(
      new Set(
        rawTexts
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter((t) => t.length > 0 && t.length <= 400),
      ),
    ).slice(0, 120);

    if (texts.length === 0) return jsonResponse({ translations: {} });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const translations: Record<string, string> = {};

    const { data: cached } = await supabase
      .from("ui_translation_cache")
      .select("source_text, translated_text")
      .eq("target_lang", target)
      .in("source_text", texts);

    for (const row of cached ?? []) translations[row.source_text] = row.translated_text;

    const missing = texts.filter((t) => !translations[t]);
    if (missing.length > 0) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) return jsonResponse({ error: "Missing LOVABLE_API_KEY" }, 500);

      const fresh = await translateBatch(missing, target, apiKey);
      Object.assign(translations, fresh);

      const rows = Object.entries(fresh).map(([source_text, translated_text]) => ({
        source_text,
        target_lang: target,
        translated_text,
      }));
      if (rows.length > 0) {
        await supabase.from("ui_translation_cache").upsert(rows, { onConflict: "source_text,target_lang" });
      }
    }

    return jsonResponse({ translations });
  } catch (err) {
    console.error("translate-ui error", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
