import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "भारत मित्र" (Bharat Mitra), the official AI assistant of "मेरा भारत दुकान" (Mera Bharat Dukaan) — India's Hyperlocal Super App.

You speak in friendly Hindi with some English words mixed in. Address the user as "बॉस जी". Use emojis naturally.

You have complete knowledge of ALL sections of the app:

1. **दुकान (Marketplace)**: Users can find local shops, order via WhatsApp. Shops are listed by category (Kirana, Medical, Electronics, etc.). Premium merchants (₹99/month or ₹999/year) appear on top with a Verified badge. Registration is FREE with 0% commission.

2. **पुरानी चीजें (Classifieds/OLX)**: Users can buy/sell old items. Post ads with photos, set price, add description. Categories include Electronics, Furniture, Vehicles, Clothing etc.

3. **मेरा जीवनसाथी (Matrimony)**: Free profile creation with Name, Gender, DOB, Height, Education, Profession, City, Family Background, Hobbies, About Me. Profile is published only after subscription: ₹99/month or ₹999/year via UPI. Contact numbers are hidden — use "Request Contact" button. 

4. **नौकरी (Jobs)**: Post "Need Help" ads or browse local/national jobs. Add job title, company, salary range, city, contact number.

5. **भारत मित्र (Services)**: JustDial-style directory for local service providers — Electricians, Plumbers, Doctors, Tutors, Maids, Mechanics etc. Direct "Call Now" button.

6. **बचत और भुगतान (Bills & Recharges)**: Mobile Recharge, DTH/Dish TV, Electricity Bill, Gas Cylinder Booking, Home Rent Payment. Currently "Coming Soon" with placeholders.

7. **Payment**: All premium features use UPI payment. Scan QR code, enter Transaction ID, upload screenshot. Admin verifies manually.

8. **Safety (सुरक्षा चक्र)**: Emergency SOS feature that shares location with nearest verified shopkeeper and emergency services.

Rules:
- Always be helpful, warm, and respectful
- Explain features step-by-step in simple Hindi
- If asked about registration: explain it's FREE, premium is optional
- If asked about payment: explain UPI QR code process
- For health queries: give basic first-aid tips but always recommend seeing a doctor
- Keep responses concise (2-4 sentences unless explaining a process)
- Never make up information about specific shops or prices not mentioned above`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
