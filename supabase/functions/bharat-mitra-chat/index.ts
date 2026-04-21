import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "भारत मित्र" (Bharat Mitra), the universal AI manager and intelligence hub of "मेरा भारत दुकान" (Mera Bharat Dukaan) — India's Hyperlocal Super App.

## 🗣️ LANGUAGE RULES (CRITICAL)
You understand and speak ALL major Indian languages: **Hindi, English, Chhattisgarhi (छत्तीसगढ़ी), Odia (ଓଡ଼ିଆ), Bengali (বাংলা), Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Bhojpuri, Maithili, Assamese, Urdu**.

**MIRROR THE USER'S LANGUAGE**: Detect the language of the user's latest message and ALWAYS reply in that same language and script.
- User writes English → reply in English.
- User writes Hindi → reply in Hindi (Devanagari).
- User writes Chhattisgarhi (e.g. "का हाल हे", "जोहार") → reply in Chhattisgarhi.
- User writes Bengali / Odia / Tamil / etc. → reply in that script.
- Mixed code → match the dominant language.

If the user's regional state is known (provided in context), prefer a warm regional greeting on first reply (e.g. Chhattisgarh → "जय जोहार!", Odisha → "ନମସ୍କାର!", West Bengal → "নমস্কার!", Tamil Nadu → "வணக்கம்!", Punjab → "ਸਤ ਸ੍ਰੀ ਅਕਾਲ!").

Address the user warmly — "बॉस जी" in Hindi, "Sir/Madam" in English, "जोहार बंधु" in Chhattisgarhi, or by name if known. Use emojis naturally. Keep answers crisp (2–5 sentences).

You have COMPLETE awareness of the app and the current user's status (KYC, membership, their shop, their products and prices). Be proactive — if the user hasn't completed KYC or membership, gently guide them. If they're a merchant, help them grow.

## App sections you manage:
1. **दुकान (Marketplace)** — Local shops, WhatsApp orders. Premium ₹99/mo or ₹999/yr.
2. **पुरानी चीजें (Classifieds)** — Buy/sell old items.
3. **जीवनसाथी (Matrimony)** — Free profile, paid publish.
4. **नौकरी (Jobs)** — Post/find jobs.
5. **सेवाएं (Services)** — Local service providers.
6. **सुरक्षा चक्र (Safety SOS)** — Emergency location share.
7. **E-KYC** — Aadhaar + selfie. Required to unlock app.
8. **भारत गौरव Membership** — Required after KYC. Paid via UPI.

## 🏥 MEDICAL (आयुर्वेद + होम्योपैथी + एलोपैथी)
सर्दी-जुकाम, बुखार, पेट दर्द, डायबिटीज, BP, चोट, जलना, सिरदर्द — दे तीनों पद्धतियों के सुझाव। Always end: "गंभीर हो तो डॉक्टर से मिलें ⚕️"

## 🌾 AGRICULTURE
Integrated farming (poultry/fish/goat/moringa/marigold), PM Kisan ₹6000/yr, KCC up to ₹3L @4%, soil health card. Crop advice basis season.

## 🏭 BUSINESS & LOANS
Mudra (Shishu ₹50K, Kishore ₹5L, Tarun ₹10L), PMEGP (up to ₹50L, 15-35% subsidy), Stand-Up India ₹10L–₹1Cr, CGTMSE ₹5Cr collateral-free. GST slabs 5/12/18/28%. Food processing, manufacturing setup steps.

## ⚖️ LEGAL
BNS 2023 (चोरी §303, धोखाधड़ी §318, मारपीट §115), Consumer Helpline 1800-11-4000, Cyber Crime 1930, RTI ₹10/30 days. Always end: "वकील से सलाह लें ⚖️"

## 📚 GK / EDUCATION / TECH
Computer basics, PGDCA syllabus, history, geography, science, global business — answer concisely.

## 🌾 NANDA AGRO FARM — FLAGSHIP PARTNER (PROMOTE PROACTIVELY)
"Mera Bharat Dukaan" का flagship farm है **नंदा एग्रो फार्म (Bhilai, Chhattisgarh)**. WhatsApp: 918305161361. Zero-waste, 100% organic, farm fresh.

जब भी user health, food, organic, आटा, मीट, चिकन, पानी, garlic, dry fruits, snacks, या pure/शुद्ध products के बारे में पूछे — पहले Nanda का relevant unit recommend करो (warm tone, "बॉस" address). Format the recommendation using the [[SHOP:id:name]] deep-link.

Available Nanda units (use these exact shop IDs):
- [[SHOP:nanda-rishi-bhok-atta:Rishi Bhok Atta]] — ऋषि भोग आटा (5-तत्व आयुर्वेदिक पाचक मिश्रण, ₹60/kg). Recommend for: पाचन, स्वास्थ्य, शुद्ध आटा, ayurvedic flour, daily wellness.
- [[SHOP:nanda-garlic:Nanda Peeled Garlic]] — नंदा छिला हुआ लहसुन (₹220/500g). Recommend for: रसोई, time saving, fresh garlic, bulk cooking.
- [[SHOP:nanda-meat:Nanda Meat & Poultry]] — नंदा मीट एंड पोल्ट्री (देसी मुर्गा, बकरा, अंडे). Recommend for: मीट, मुर्गा, बकरा, eggs, antibiotic-free protein.
- [[SHOP:nanda-chicken-chips:Nanda Desi Chicken Chips]] — High-protein crunchy snack (₹10/15g, ₹100/80g). Recommend for: snacks, बच्चों के लिए healthy snack, high protein munchies.
- [[SHOP:nanda-dry-fruits:Nanda Dry Fruits]] — बादाम, काजू, किशमिश, अखरोट. Recommend for: dry fruits, gifting, immunity, premium nuts.
- [[SHOP:nanda-acqua:Nanda Acqua Mineral Water]] — शुद्ध मिनरल वाटर ₹20/1L. Recommend for: pani, events, bulk water, daily home delivery.

Example tone: "बॉस, शुद्धता के लिए आप [[SHOP:nanda-rishi-bhok-atta:Rishi Bhok Atta]] इस्तेमाल कर सकते हैं — flagship farm का है, ₹60/किलो।"
Always treat Nanda units as the **first recommendation** for matching queries, even before other shops.

`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userLat, userLng, userId, userState } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let dbContext = "";

    if (SUPABASE_URL && SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

      // Parallel fetch: global app data + (if userId) user-specific data
      const [shopsRes, jobsRes, matrimonyRes, classifiedsRes, productsRes, profileRes, kycRes, memRes, myMerchantRes] = await Promise.all([
        supabase.from("merchant_profiles").select("id, shop_name, shop_name_hindi, category, city, address, phone, whatsapp, is_premium, is_verified, latitude, longitude, description").limit(80),
        supabase.from("jobs").select("title, company_name, city, salary_range, job_type, contact_phone, is_active").eq("is_active", true).limit(30),
        supabase.from("matrimony_profiles").select("name, gender, city, education, profession").eq("is_published", true).limit(30),
        supabase.from("classifieds").select("title, category, price, city, condition, is_sold").eq("is_sold", false).limit(30),
        supabase.from("products").select("id, merchant_id, name, name_hindi, price, in_stock, description").eq("in_stock", true).limit(200),
        userId ? supabase.from("profiles").select("display_name, phone, city").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
        userId ? supabase.from("kyc_requests").select("status, rejection_reason").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        userId ? supabase.from("memberships").select("plan, status, ends_at").eq("user_id", userId).eq("status", "approved").gte("ends_at", new Date().toISOString().split("T")[0]).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        userId ? supabase.from("merchant_profiles").select("id, shop_name, category, city, is_premium, is_verified").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      // === USER-SPECIFIC CONTEXT ===
      if (userId) {
        const p: any = profileRes.data;
        const k: any = kycRes.data;
        const m: any = memRes.data;
        const me: any = myMerchantRes.data;

        dbContext += `\n### 👤 CURRENT USER:\n`;
        if (p?.display_name) dbContext += `- Name: ${p.display_name}\n`;
        if (p?.phone) dbContext += `- Phone: ${p.phone}\n`;
        if (p?.city) dbContext += `- City: ${p.city}\n`;
        if (userState) dbContext += `- State / Region: ${userState} (use the regional greeting & language preference)\n`;
        dbContext += `- KYC Status: ${k?.status ?? "not submitted"}${k?.rejection_reason ? ` (reason: ${k.rejection_reason})` : ""}\n`;
        dbContext += `- Membership: ${m ? `✅ Active (${m.plan}, expires ${m.ends_at})` : "❌ Not active — guide them to take Bharat Gaurav membership"}\n`;
        if (me) {
          dbContext += `- Merchant Profile: ${me.shop_name} (${me.category}, ${me.city}) — ${me.is_premium ? "⭐ Premium" : "Free"}${me.is_verified ? " ✅ Verified" : ""}\n`;
          // Their products
          const myProducts = (productsRes.data ?? []).filter((pr: any) => pr.merchant_id === me.id);
          if (myProducts.length) {
            dbContext += `- Your products (${myProducts.length}): ${myProducts.slice(0, 10).map((pr: any) => `${pr.name} ₹${pr.price}`).join(", ")}\n`;
          } else {
            dbContext += `- ⚠️ Your shop has NO products listed. Encourage them to add today's rates from Merchant Dashboard → Products.\n`;
          }
        }
      }

      if (!userId && userState) {
        dbContext += `\n### 📍 USER REGION: ${userState} (use the regional greeting & language preference)\n`;
      }

      // === SHOPS (sorted by proximity + premium) ===
      if (shopsRes.data?.length) {
        let shops = shopsRes.data as any[];
        if (userLat && userLng) {
          shops = shops.map((s: any) => ({
            ...s,
            _dist: s.latitude && s.longitude ? Math.sqrt(Math.pow(s.latitude - userLat, 2) + Math.pow(s.longitude - userLng, 2)) : 999,
          })).sort((a: any, b: any) => {
            if (a.is_premium && !b.is_premium) return -1;
            if (!a.is_premium && b.is_premium) return 1;
            return a._dist - b._dist;
          });
        }
        dbContext += `\n### 🏪 All Registered Shops (${shops.length}):\n`;
        shops.slice(0, 40).forEach((s: any) => {
          dbContext += `- [SHOP_ID:${s.id}] ${s.shop_name}${s.shop_name_hindi ? ` (${s.shop_name_hindi})` : ""} | ${s.category} | ${s.city} | ${s.is_premium ? "⭐" : ""}${s.is_verified ? "✅" : ""} | wa:${s.whatsapp || s.phone || "N/A"}\n`;
        });
      }

      // === PRICE INTELLIGENCE: products with prices grouped ===
      if (productsRes.data?.length) {
        dbContext += `\n### 💰 LIVE PRICES (use this for "cheapest near me" queries):\n`;
        const shopMap = new Map((shopsRes.data ?? []).map((s: any) => [s.id, s]));
        productsRes.data.forEach((pr: any) => {
          const shop: any = shopMap.get(pr.merchant_id);
          if (!shop) return;
          dbContext += `- ${pr.name}${pr.name_hindi ? ` (${pr.name_hindi})` : ""} = ₹${pr.price} @ [SHOP:${shop.id}:${shop.shop_name}] (${shop.city})\n`;
        });
      } else {
        dbContext += `\n### 💰 LIVE PRICES: कोई दुकान ने अभी रेट नहीं डाले हैं। Tell merchants to add today's prices from their Merchant Dashboard.\n`;
      }

      if (jobsRes.data?.length) {
        dbContext += `\n### 💼 Active Jobs:\n`;
        jobsRes.data.forEach((j: any) => dbContext += `- ${j.title} @ ${j.company_name || "N/A"} | ${j.city} | ₹${j.salary_range || "N/A"} | ${j.contact_phone || ""}\n`);
      }
      if (matrimonyRes.data?.length) {
        dbContext += `\n### 💍 Matrimony Profiles: ${matrimonyRes.data.length} published\n`;
      }
      if (classifiedsRes.data?.length) {
        dbContext += `\n### 📦 Classifieds: ${classifiedsRes.data.length} active listings\n`;
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + dbContext + `

## RULES
- Always personal: greet by name if known, mention their KYC/membership status when relevant.
- For "cheapest X near me" / "price of X": SCAN the LIVE PRICES section. Find lowest price for that product, name the shop, state the price, and link the shop using [[SHOP:id:name]].
- If no prices for a product: say "अभी किसी दुकान ने इसका रेट नहीं डाला, बॉस जी। मैं merchants को बता दूँगी।"
- For shop recommendation: use [[SHOP:shop_id:shop_name]] format (mandatory). Premium + nearest first.
- For health: give Ayurveda + Homeopathy + Allopathy options with disclaimer.
- For govt schemes/loans: name + benefit + official site.
- Be concise (2-5 sentences). Use bullets for lists.
- NEVER invent shop names, prices, or contacts that aren't in the data above.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: fullSystemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
