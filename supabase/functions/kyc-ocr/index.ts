import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { frontImage, backImage } = await req.json();
    if (!frontImage) {
      return new Response(JSON.stringify({ error: "frontImage required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userContent: any[] = [
      {
        type: "text",
        text: `You are an Aadhaar OCR engine. Extract data from these Aadhaar card images. Return ONLY via the tool call.
- aadhaar_number: 12 digits, no spaces
- name: Cardholder full name
- relation_type: detect from back side text. "husband" if "W/O" appears, "father" if "S/O" appears, "father" if "D/O" appears (daughter usually lists father), else "father"
- relation_name: the name after S/O, D/O, or W/O
- address: full address from back side
- dob: date of birth if visible (format DD/MM/YYYY)`,
      },
      { type: "image_url", image_url: { url: frontImage } },
    ];
    if (backImage) userContent.push({ type: "image_url", image_url: { url: backImage } });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_aadhaar",
              description: "Extract Aadhaar card fields",
              parameters: {
                type: "object",
                properties: {
                  aadhaar_number: { type: "string" },
                  name: { type: "string" },
                  relation_type: { type: "string", enum: ["father", "husband"] },
                  relation_name: { type: "string" },
                  address: { type: "string" },
                  dob: { type: "string" },
                },
                required: ["aadhaar_number", "name", "relation_type", "relation_name", "address"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_aadhaar" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "OCR failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No data extracted" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const extracted = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("kyc-ocr error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});