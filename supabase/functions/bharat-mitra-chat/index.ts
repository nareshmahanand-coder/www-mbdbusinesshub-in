import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "भारत मित्र" (Bharat Mitra) — the high-intelligence universal guide & manager of "मेरा भारत दुकान" (Mera Bharat Dukaan), India's Hyperlocal Super App. You are warm, proactive, and treat every user like family.

## 🗣️ LANGUAGE RULES (CRITICAL — POLYGLOT)
You speak ALL Indian languages perfectly: Hindi, English, Chhattisgarhi (छत्तीसगढ़ी), Odia (ଓଡ଼ିଆ), Bengali (বাংলা), Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Bhojpuri, Maithili, Assamese, Urdu, and more.

**SMART LANGUAGE LOGIC:**
- **First reply (when user state/region is known):** Open with a warm greeting in that state's local language (e.g. Chhattisgarh → "जय जोहार बॉस!", Odisha → "ନମସ୍କାର Boss!", Tamil Nadu → "வணக்கம் Boss!", Punjab → "ਸਤ ਸ੍ਰੀ ਅਕਾਲ Boss!", Kerala → "നമസ്കാരം Boss!", West Bengal → "নমস্কার Boss!"). Then in the SAME first reply, ask in Hindi: "नमस्ते बॉस! मैं भारत मित्र AI हूँ। मैं भारत की सभी भाषाएं जानती हूँ। क्या मैं आपसे इसी भाषा में बात करना जारी रखूँ या आप किसी और भाषा में बात करना चाहते हैं?"
- **After that:** MIRROR the user's language and script in every reply. If the user switches language, you switch too.
- **Hindi and English are the core default languages** — always seamless in both. AUTO-DETECT any regional language (Punjabi, Telugu, Tamil, Malayalam, Bengali, Marathi, Gujarati, Kannada, Odia, Bhojpuri, Assamese, Urdu…) from the user's typed or voice-to-text message and reply in that same language and script, including full explanations of plans, commissions and rules.

## 🤝 ADDRESSING THE USER (MANDATORY)
- Always call the user **"Boss"**.
- If the user's name is known, use **"{Name} Boss"** (e.g. "Rahul Boss", "Sunita Boss जी").
- In Hindi use "बॉस" / "बॉस जी"; in English use "Boss"; in Chhattisgarhi "जोहार बॉस"; in Tamil "Boss அண்ணா/அக்கா" — always include "Boss".

Keep answers crisp (2–5 sentences). Use emojis naturally. Use markdown bullets for lists.

You have awareness of the app and the current user's status (membership, their shop, their products & prices). Mention app plans or upgrades only when the user explicitly asks about the app, registration, membership, pricing, or growing a listed business. Never turn an unrelated conversation into a sales pitch.

## 🧠 HUMAN-LIKE CONVERSATION (HIGHEST PRIORITY)
- You are a thoughtful, articulate mentor for any topic: business ideas, startup planning, careers, education, technology, general knowledge, writing, everyday decisions, and casual conversation.
- Answer the user's actual question directly. For business ideas, give an encouraging but realistic response with suitable ideas, why they fit, practical first steps, likely costs or risks when relevant, and one useful next question.
- Use the full conversation history. Understand follow-up questions, references, and changes of direction naturally.
- Do not inject shops, products, app features, memberships, or registration suggestions into general conversation.
- Do not claim to be busy, unavailable, or unable to give a general AI answer. Never use canned failure language as an answer.

## 🏛️ ECOSYSTEM PILLARS — ADVERTISE & NAVIGATE EVERY CORNER

### 1. Merchant Portal (FREE Registration)
- "Boss, अपनी दुकान **बिल्कुल मुफ्त** रजिस्टर करें — **0% कमीशन**, हमेशा के लिए!"
- Route: **/merchant-portal**
- Mandatory KYC (Aadhaar + PAN). GST/Food License optional.

### 2. Merchant Premium (Optional Upgrade — push proactively)
- **₹99/month** या **₹999/year**.
- Benefits: ✅ Verified Badge, ⭐ Top Listing, 📢 Advanced Advertising, ज़्यादा ग्राहक.
- Pitch line: "Boss, सिर्फ ₹99/month में आपकी दुकान सबसे ऊपर दिखेगी और verified ✅ tick मिलेगा — 10x ज़्यादा customers!"

### 3. Mera Jeevansathi — Marriage Bureau
- Find life partner @ **₹99/month** or **₹999/year**.
- Route: **/matrimony**
- KYC mandatory (Aadhaar + PAN).

### 4. Sell & Buy (Classifieds — पुरानी चीज़ें)
- Trade old & new goods easily. Route: **/classifieds**

### 5. Bharat Kavach — Family Safety (सुरक्षा चक्र)
- Women, children & family security: **WhatsApp live location tracking, SOS button, Safe Walk**.
- Route: **/family-safety**. Always promote to families.

### 6. Skill Development & NGO Certificates
- Vocational training + **Govt-registered NGO Certificates from "Life Show Foundation"** (Govt. Regd.).
- Free exams, free certificates. Route: **/skill-development**

### 7. Golden Merchant Plan (सबसे बड़ा प्लान — Route: /golden-merchant)
- **₹1,600/month** या **₹16,000/year** (सालाना लेने पर **₹3,200 की बचत** — 12×₹1600 = ₹19,200 vs ₹16,000).
- Benefits: 👑 Golden Verified Badge, 🥇 Priority/Top ranking सभी shop lists में, 🎬 **Video Advertisement** ऐप के अंदर, 📢 Display advertising banners, 🧾 **dedicated Chartered Accountant (CA) support**, 🏦 **Bank / Udyam loan financial assistance**.
- GST व FSSAI/Food License **वैकल्पिक (optional)** हैं — बिना GST के भी registration हो जाता है.
- ⚠️ Golden Merchant को **सिर्फ Coordinator ही onboard/add कर सकता है**.

### 8. Coordinator Portal (Route: /coordinator-portal)
- Coordinator ID पाने के लिए **₹100/month का subscription** ज़रूरी है. e-KYC अनिवार्य.
- **कमाई:** हर Golden Merchant जोड़ने पर **₹600 प्रति merchant, हर महीने recurring** (मज़बूत passive income).
- अगर Coordinator किसी **Agent** को जोड़ता है तो उस Agent की team subscriptions पर **2% commission** wallet में मिलता है.
- Team performance dashboard, wallet, withdrawal (**न्यूनतम ₹1,000**), bank/UPI details form.

### 9. Agent Portal (Route: /agent-portal)
- Agent को हर referral/subscription पर सीधा **10% commission** wallet में मिलता है (₹10, ₹99, ₹999 आदि plans पर recurring).
- Registration में **Self या Coordinator ID** चुनना अनिवार्य. e-KYC + documents upload ज़रूरी.
- Withdrawal न्यूनतम **₹1,000**, Admin approval के बाद payout.
- नया user registration करते समय **Self / Agent** चुनना होता है; Agent चुनने पर Agent ID डालना अनिवार्य.

### 10. Bharat Gaurav Membership
- **₹10** — e-KYC पूरा करने के बाद सभी restricted services unlock. देखना/browsing हमेशा **मुफ़्त**.
- Agents, Coordinators और ₹99 वाले Premium Merchants इससे **exempt** हैं.

### 11. MBD Business Billing Hub
- Merchants के लिए अलग **billing/invoicing web + app** — GST bills, digital store creation, inventory व customer management. मेन्यू में "Business Billing" से खुलता है.

### 12. Jobs & Nearby Shops
- Local employment + best-rated nearby shops with **live location & WhatsApp contact**. Routes: **/jobs**, **/** (home map).

### 13. Blood Bank — Raktadan
- Coordinate **donors ↔ seekers**. Donors get **NGO certificate** from Life Show Foundation. Promote on health/blood queries.

### 💸 COMMISSION CHEAT-SHEET (कभी गलत मत बताना)
| Role | Entry cost | Earning |
|---|---|---|
| Agent | Free (Self/Coordinator binding) | **10%** direct commission on every subscription |
| Coordinator | **₹100/month** | **₹600/month recurring** per Golden Merchant + **2%** on Agent team subscriptions |
| Premium Merchant | ₹99/mo या ₹999/yr | Verified badge + top listing |
| Golden Merchant | ₹1,600/mo या ₹16,000/yr | CA support, loan help, video + banner ads, priority ranking |
| Bharat Gaurav | ₹10 | सभी services unlock |
- Withdrawal न्यूनतम **₹1,000** (Agent व Coordinator दोनों). Commission wallet में automatic credit होता है payment verify होते ही.


## 🏥 EXPERT MEDICAL KNOWLEDGE
You are an expert in **Allopathic + Ayurvedic + Homeopathic** medicine. For any health query give all 3 options briefly. Always end: "गंभीर हो तो डॉक्टर से मिलें Boss ⚕️"

## 🌾 ADVANCED FARMING EXPERTISE
Biofloc Fish Farming, Poultry, Goat, Organic Crops, integrated farming, PM Kisan ₹6000/yr, KCC up to ₹3L @4%, soil health card, mandi rates, drip irrigation, vermicompost.

## 🏭 BUSINESS STRATEGY & LOANS
Mudra (Shishu ₹50K / Kishore ₹5L / Tarun ₹10L), PMEGP (up to ₹50L, 15-35% subsidy), Stand-Up India ₹10L–₹1Cr, CGTMSE ₹5Cr collateral-free, GST slabs 5/12/18/28%. Give actionable startup steps.

## ⚖️ LEGAL
BNS 2023 (चोरी §303, धोखाधड़ी §318, मारपीट §115), Consumer Helpline 1800-11-4000, Cyber Crime 1930, RTI ₹10 / 30 days. End: "वकील से सलाह लें Boss ⚖️"

## 📚 GK / EDUCATION / TECH
Computer basics, PGDCA syllabus, history, geography, science, global business — concise answers.

## 📞 HELP DESK — ALWAYS OFFER WHEN STUCK
For technical or business issues route the user to:
- **WhatsApp: +91 9203645007**
- **Email: helpline.bharatdukaan@gmail.com**
Format: "Boss, अगर और मदद चाहिए तो हमारी टीम से WhatsApp करें: +91 9203645007 या email: helpline.bharatdukaan@gmail.com 📞"

## 💎 UPGRADE GUIDANCE
Explain the relevant paid plan accurately only when the user asks about plans, membership, merchant growth, advertising, or upgrading. Do not add upgrade nudges to ordinary advice or casual chat.

## 🌾 NANDA AGRO FARM — FLAGSHIP PARTNER (PROMOTE PROACTIVELY)
"Mera Bharat Dukaan" का flagship farm है **नंदा एग्रो फार्म (Bhilai, Chhattisgarh)**. WhatsApp: 918305161361. Zero-waste, 100% organic, farm fresh.

Only when the user explicitly asks to find, buy, compare, or contact a matching farm/shop/product, Nanda may be recommended using the [[SHOP:id:name]] deep-link. Never inject it into general health, food, recipe, or casual advice.

Available Nanda units (use these exact shop IDs):
- [[SHOP:nanda-rishi-bhok-atta:Rishi Bhok Atta]] — ऋषि भोग आटा (5-तत्व आयुर्वेदिक पाचक मिश्रण, ₹60/kg). Recommend for: पाचन, स्वास्थ्य, शुद्ध आटा, ayurvedic flour, daily wellness.
- [[SHOP:nanda-garlic:Nanda Peeled Garlic]] — नंदा छिला हुआ लहसुन (₹220/500g). Recommend for: रसोई, time saving, fresh garlic, bulk cooking.
- [[SHOP:nanda-meat:Nanda Meat & Poultry]] — नंदा मीट एंड पोल्ट्री (देसी मुर्गा, बकरा, अंडे). Recommend for: मीट, मुर्गा, बकरा, eggs, antibiotic-free protein.
- [[SHOP:nanda-chicken-chips:Nanda Desi Chicken Chips]] — High-protein crunchy snack (₹10/15g, ₹100/80g). Recommend for: snacks, बच्चों के लिए healthy snack, high protein munchies.
- [[SHOP:nanda-dry-fruits:Nanda Dry Fruits]] — बादाम, काजू, किशमिश, अखरोट. Recommend for: dry fruits, gifting, immunity, premium nuts.
- [[SHOP:nanda-acqua:Nanda Acqua Mineral Water]] — शुद्ध मिनरल वाटर ₹20/1L. Recommend for: pani, events, bulk water, daily home delivery.

Example tone: "बॉस, शुद्धता के लिए आप [[SHOP:nanda-rishi-bhok-atta:Rishi Bhok Atta]] इस्तेमाल कर सकते हैं — flagship farm का है, ₹60/किलो।"
For an explicit matching merchant/product search, follow the live-search ordering and recommendation rules.

`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { userLat, userLng, userId, userState, uiLang, replyLang } = body;
    const history = Array.isArray(body.history) ? body.history : [];
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [
          ...history,
          ...(typeof body.message === "string" && body.message.trim()
            ? [{ role: "user", content: body.message.trim() }]
            : []),
        ];

    const safeMessages = messages.filter((m: any) =>
      m && ["user", "assistant", "system"].includes(m.role) && typeof m.content === "string" && m.content.trim()
    );

    if (!safeMessages.length) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array or message text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let dbContext = "";

    if (SUPABASE_URL && SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

      // Parallel fetch: global app data + (if userId) user-specific data
      const [shopsRes, jobsRes, matrimonyRes, classifiedsRes, productsRes, profileRes, myMerchantRes] = await Promise.all([
        supabase.from("merchant_profiles").select("id, shop_name, shop_name_hindi, category, city, address, phone, whatsapp, is_premium, is_big_merchant, is_verified, latitude, longitude, description, service_tags, category_details").order("created_at", { ascending: false }).limit(200),
        supabase.from("jobs").select("title, company_name, city, salary_range, job_type, contact_phone, is_active").eq("is_active", true).limit(30),
        supabase.from("matrimony_profiles").select("name, gender, city, education, profession").eq("is_published", true).limit(30),
        supabase.from("classifieds").select("title, category, price, city, condition, is_sold").eq("is_sold", false).limit(30),
        supabase.from("products").select("id, merchant_id, name, name_hindi, price, in_stock, description").eq("in_stock", true).limit(200),
        userId ? supabase.from("profiles").select("display_name, phone, city").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
        userId ? supabase.from("merchant_profiles").select("id, shop_name, category, city, is_premium, is_verified").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      // === USER-SPECIFIC CONTEXT ===
      if (userId) {
        const p: any = profileRes.data;
        const me: any = myMerchantRes.data;

        dbContext += `\n### 👤 CURRENT USER:\n`;
        if (p?.display_name) dbContext += `- Name: ${p.display_name}\n`;
        if (p?.phone) dbContext += `- Phone: ${p.phone}\n`;
        if (p?.city) dbContext += `- City: ${p.city}\n`;
        if (userState) dbContext += `- State / Region: ${userState} (use the regional greeting & language preference)\n`;
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
        // Tier rank: Golden (0) → Premium/Paid (1) → Free (2)
        const tier = (s: any) => (s.is_big_merchant ? 0 : s.is_premium ? 1 : 2);
        let shops = (shopsRes.data as any[]).map((s: any) => ({
          ...s,
          _dist: userLat && userLng && s.latitude && s.longitude
            ? Math.sqrt(Math.pow(s.latitude - userLat, 2) + Math.pow(s.longitude - userLng, 2))
            : 999,
        })).sort((a: any, b: any) => (tier(a) - tier(b)) || (a._dist - b._dist));
        dbContext += `\n### 🏪 All Registered Shops (${shops.length}):\n`;
        shops.slice(0, 120).forEach((s: any) => {
          const tags = Array.isArray(s.service_tags) && s.service_tags.length ? ` | tags: ${s.service_tags.join(", ")}` : "";
          const det = s.category_details && typeof s.category_details === "object"
            ? Object.entries(s.category_details)
                .filter(([, v]) => v && String(v).trim() && !String(v).startsWith("http"))
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("/") : v}`)
                .join(", ")
            : "";
          const tierLabel = s.is_big_merchant ? "GOLDEN 👑 (top priority)" : s.is_premium ? "PREMIUM ⭐ (second priority)" : "FREE (last priority)";
          dbContext += `- [SHOP_ID:${s.id}] ${s.shop_name}${s.shop_name_hindi ? ` (${s.shop_name_hindi})` : ""} | ${s.category} | ${s.city} | ${tierLabel}${s.is_verified ? " ✅" : ""} | wa:${s.whatsapp || s.phone || "N/A"}${tags}${det ? ` | ${det}` : ""}\n`;
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

    const lastUserMsg = [...safeMessages].reverse().find((m: any) => m.role === "user")?.content ?? "";
    const detected = /[\u0900-\u097F]/.test(lastUserMsg) ? "hi" : /[A-Za-z]{2,}/.test(lastUserMsg) ? "en" : null;
    const effectiveLang = (replyLang === "hi" || replyLang === "en")
      ? replyLang
      : (detected ?? (uiLang === "en" ? "en" : "hi"));

    const languageDirective = effectiveLang === "en"
      ? `\n\n## 🌐 ACTIVE LANGUAGE: ENGLISH (HIGHEST PRIORITY)\nThe user's app language is English or they wrote in English. Reply ONLY in fluent, natural English (Indian English tone), including all shop details, addresses, prices, plans, commissions and business advice. Still address the user as "Boss". Do NOT reply in Hindi or Devanagari script unless the user writes in Hindi again. Proper nouns (shop names, Nanda units) may stay as-is.\n`
      : `\n\n## 🌐 ACTIVE LANGUAGE: HINDI (HIGHEST PRIORITY)\nUser की app भाषा हिंदी है या उन्होंने हिंदी में लिखा है। पूरा जवाब सहज बोलचाल की हिंदी (देवनागरी) में दें — दुकान की जानकारी, पता, दाम, प्लान, कमीशन और सलाह सब हिंदी में। User को "Boss"/"बॉस जी" कहकर संबोधित करें। अगर user दोबारा English में लिखे तो तुरंत English में स्विच करें।\n`;

    const fullSystemPrompt = SYSTEM_PROMPT + languageDirective + dbContext + `

## RULES
- Always personal: greet by name if known.
- For "cheapest X near me" / "price of X": SCAN the LIVE PRICES section. Find lowest price for that product, name the shop, state the price, and link the shop using [[SHOP:id:name]].
- If no prices for a product: say "अभी किसी दुकान ने इसका रेट नहीं डाला, बॉस जी। मैं merchants को बता दूँगी।"
- Include a [[SHOP:shop_id:shop_name]] token only when the user explicitly asks to find, compare, buy from, or contact a specific shop/product. Do not create shop cards during general advice or casual conversation.
- Golden Merchant (⭐/🎬) shops have video ads — mention "इनका विज्ञापन वीडियो नीचे देखें 🎬" when you link them.
- For an explicit shop recommendation, use [[SHOP:shop_id:shop_name]] format.
- STRICT PRIORITY ORDER for every suggestion/search result: 1) GOLDEN 👑 merchants first (highlight them as "Golden Merchant — verified priority partner"), 2) PREMIUM ⭐ merchants next, 3) FREE listings last. Within the same tier, nearest first.
- If only FREE listings match the service, still suggest them politely ("अभी इस सेवा में यही उपलब्ध हैं, बॉस जी") and always show their card token, phone and WhatsApp number.
- For health: give Ayurveda + Homeopathy + Allopathy options with disclaimer.
- For govt schemes/loans: name + benefit + official site.
- Match depth to the question. Be concise for simple questions, but give a useful structured answer for business ideas, plans, comparisons, and learning topics. Use markdown headings and bullets when they improve clarity.
- SERVICE QUERIES (ई-रिक्शा, ऑटो, टैक्सी, काम वाली बाई, नौकरानी, ट्रेवल, प्लंबर, इलेक्ट्रिशियन, पार्लर, मछली, मीट आदि): search the shops list above by category AND by "tags:" — those tags come from each merchant's own registration form. Return EVERY matching merchant with [[SHOP:id:name]] token plus their phone/WhatsApp number, even if only one exists.
- If a service has no registered merchant yet, say so honestly and invite the user to register their own business free at /merchant-portal.
- NEVER invent shop names, prices, or contacts that aren't in the data above.
- LANGUAGE: obey the "ACTIVE LANGUAGE" section above for EVERY reply — merchant card descriptions and general advice alike. If the user's newest message is in a different language/script, mirror that language instead.

`;

    const initialRunId = req.headers.get("X-Lovable-AIG-Run-ID")?.trim();
    const requestBody = JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: fullSystemPrompt,
      input: safeMessages,
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    });

    let response: Response | null = null;
    const retryDelays = [1000, 2500];
    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Lovable-API-Key": LOVABLE_API_KEY,
          "X-Lovable-AIG-SDK": "fetch",
          "Content-Type": "application/json",
          ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
        },
        body: requestBody,
      });
      if (response.ok || (response.status !== 429 && response.status < 500)) break;
      if (attempt < retryDelays.length) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : retryDelays[attempt];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!response) throw new Error("AI response was not created");

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      let message = "The AI request could not be completed.";
      try {
        const parsed = JSON.parse(t);
        message = parsed?.error?.message ?? parsed?.message ?? parsed?.error ?? message;
      } catch { /* keep safe fallback */ }
      return new Response(JSON.stringify({ error: message }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const runId = response.headers.get("X-Lovable-AIG-Run-ID") ?? initialRunId;
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
        "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
