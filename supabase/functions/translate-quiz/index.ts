import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * POST { questions: [{ q: string, options: string[] }, ...] }
 * Returns { translations: [{ q_en: string, options_en: string[] }, ...] }
 * Translates Hindi quiz questions + options to clean English in one batch.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questions } = await req.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "questions[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const compact = questions.map((q: any, i: number) => ({
      i,
      q: q.q,
      o: q.options,
    }));

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a precise Hindi-to-English translator for educational MCQ exams. Translate each question and each of its 4 options to clear, simple English. Preserve technical terms (GST, MSME, PCB, etc.) as-is. Keep meaning identical. Output ONLY via the provided tool.",
          },
          {
            role: "user",
            content: `Translate these Hindi MCQs to English:\n${JSON.stringify(compact)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_translations",
              description: "Submit English translations for all questions",
              parameters: {
                type: "object",
                properties: {
                  translations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        i: { type: "number" },
                        q_en: { type: "string" },
                        options_en: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      },
                      required: ["i", "q_en", "options_en"],
                    },
                  },
                },
                required: ["translations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_translations" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "translation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const translations = parsed?.translations ?? [];

    // Order by index, fill missing
    const ordered = questions.map((_q: any, i: number) => {
      const t = translations.find((x: any) => x.i === i);
      return t ?? { i, q_en: "", options_en: ["", "", "", ""] };
    });

    return new Response(JSON.stringify({ translations: ordered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-quiz error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});