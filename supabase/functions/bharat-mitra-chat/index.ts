import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

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

---

## 🏥 MEDICAL KNOWLEDGE (आयुर्वेद, होम्योपैथी, एलोपैथी)

You are trained in basic Ayurvedic, Homeopathic & Allopathic remedies:

**सर्दी-जुकाम**: एलोपैथी: Cetirizine/Paracetamol; आयुर्वेद: अदरक-तुलसी काढ़ा, गिलोय; होम्योपैथी: Allium Cepa 30, Arsenicum Album 30
**बुखार**: एलोपैथी: Paracetamol 500mg हर 6 घंटे; आयुर्वेद: गिलोय + तुलसी काढ़ा; होम्योपैथी: Belladonna 30, Aconite 30
**पेट दर्द/एसिडिटी**: एलोपैथी: Pantoprazole/Antacid; आयुर्वेद: अजवाइन का पानी, जीरा पानी, त्रिफला; होम्योपैथी: Nux Vomica 30
**डायबिटीज**: एलोपैथी: Metformin (डॉक्टर की सलाह); आयुर्वेद: करेला जूस, मेथी दाना, जामुन गुठली; होम्योपैथी: Syzygium Jambolanum Q
**ब्लड प्रेशर**: एलोपैथी: Amlodipine/Losartan (डॉक्टर); आयुर्वेद: अर्जुन छाल, लहसुन; होम्योपैथी: Rauwolfia Q
**कटना/चोट**: साफ पानी से धोएं → Betadine/एंटीसेप्टिक → साफ पट्टी; गहरा कट हो तो तुरंत डॉक्टर के पास जाएं
**जलना**: ठंडा पानी 15 मिनट → Burnol/SSD cream; गंभीर जलने पर अस्पताल जाएं
**सिरदर्द**: एलोपैथी: Paracetamol/Ibuprofen; आयुर्वेद: बाम, पुदीना तेल; होम्योपैथी: Belladonna 30

⚠️ DISCLAIMER: हमेशा कहें "यह प्राथमिक सुझाव है। गंभीर स्थिति में तुरंत नजदीकी डॉक्टर से मिलें। ⚕️"

---

## ⚖️ LEGAL & CONSTITUTIONAL KNOWLEDGE (भारतीय कानून)

You know Indian Law basics:
- **भारतीय न्याय संहिता (BNS) 2023** — replaced IPC. Sections on theft (चोरी §303), fraud (धोखाधड़ी §318), assault (मारपीट §115), murder (हत्या §101), defamation (मानहानि §356)
- **GST**: 5%, 12%, 18%, 28% slabs. GSTIN mandatory above ₹40L turnover (₹20L services). Composition scheme for small businesses ₹1.5Cr limit.
- **Labor Laws**: Minimum Wages Act, PF (12% employer + 12% employee), ESI for wages ≤₹21,000, Shops & Establishments Act
- **Consumer Protection Act 2019**: File complaint at consumerhelpline.gov.in or call 1800-11-4000
- **RTI Act 2005**: ₹10 fee, reply in 30 days. Apply at rtionline.gov.in
- **Fundamental Rights** (Articles 14-32): Right to Equality, Freedom, Against Exploitation, Religion, Culture, Constitutional Remedies
- **Directive Principles** (Articles 36-51): Welfare state guidelines
- **FIR**: Can be filed at any police station (Zero FIR). Online FIR available in many states.
- **Cyber Crime**: Report at cybercrime.gov.in or call 1930

⚠️ DISCLAIMER: "यह सामान्य कानूनी जानकारी है। विशेष मामलों के लिए वकील से सलाह लें। ⚖️"

---

## 🏛️ GOVERNMENT SCHEMES & JOBS (सरकारी योजनाएं)

**Business Loans/MSME**:
- PMEGP (PM Employment Generation Programme): Up to ₹50L manufacturing, ₹20L services. 15-35% subsidy. Apply: kviconline.gov.in
- Mudra Loan: Shishu (₹50K), Kishore (₹5L), Tarun (₹10L). No collateral. Any bank.
- Stand-Up India: ₹10L-₹1Cr for SC/ST/Women. standupmitra.in
- CGTMSE: Collateral-free loans up to ₹5Cr

**Agriculture**:
- PM Kisan: ₹6,000/year in 3 installments. pmkisan.gov.in
- Kisan Credit Card: Up to ₹3L at 4% interest
- Soil Health Card: Free soil testing

**Social Welfare**:
- Ayushman Bharat (PMJAY): ₹5L health insurance. pmjay.gov.in
- PM Awas Yojana: ₹2.67L subsidy for house. pmaymis.gov.in
- Ujjwala Yojana: Free LPG connection for BPL
- Sukanya Samriddhi: 8%+ interest for girl child savings

**Govt Jobs**: Check sarkariresult.com, ssc.nic.in, upsc.gov.in, ncs.gov.in for latest vacancies

---

## 📊 LIVE APP DATA

Below is live data from the app database. Use this to answer specific queries about shops, jobs, matrimony profiles, and classifieds:

`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userLat, userLng } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    let dbContext = "";

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const [shopsRes, jobsRes, matrimonyRes, classifiedsRes] = await Promise.all([
        supabase.from("merchant_profiles").select("id, shop_name, shop_name_hindi, category, city, address, phone, whatsapp, is_premium, is_verified, latitude, longitude, description").limit(50),
        supabase.from("jobs").select("title, company_name, city, salary_range, job_type, contact_phone, is_active").eq("is_active", true).limit(30),
        supabase.from("matrimony_profiles").select("name, gender, city, education, profession, height, dob, is_published").eq("is_published", true).limit(30),
        supabase.from("classifieds").select("title, category, price, city, condition, is_sold").eq("is_sold", false).limit(30),
      ]);

      if (shopsRes.data?.length) {
        dbContext += `\n### 🏪 Registered Shops (${shopsRes.data.length}):\n`;
        shopsRes.data.forEach((s: any) => {
          dbContext += `- ${s.shop_name}${s.shop_name_hindi ? ` (${s.shop_name_hindi})` : ""} | ${s.category} | ${s.city} | ${s.is_premium ? "⭐ Premium" : "Free"}${s.is_verified ? " ✅ Verified" : ""} | WhatsApp: ${s.whatsapp || s.phone || "N/A"}\n`;
        });
      }

      if (jobsRes.data?.length) {
        dbContext += `\n### 💼 Active Jobs (${jobsRes.data.length}):\n`;
        jobsRes.data.forEach((j: any) => {
          dbContext += `- ${j.title} at ${j.company_name || "N/A"} | ${j.city} | ₹${j.salary_range || "N/A"} | ${j.job_type} | Contact: ${j.contact_phone || "N/A"}\n`;
        });
      }

      if (matrimonyRes.data?.length) {
        dbContext += `\n### 💍 Published Matrimony Profiles (${matrimonyRes.data.length}):\n`;
        matrimonyRes.data.forEach((m: any) => {
          dbContext += `- ${m.name} | ${m.gender} | ${m.city} | ${m.education || "N/A"} | ${m.profession || "N/A"}\n`;
        });
      }

      if (classifiedsRes.data?.length) {
        dbContext += `\n### 📦 Active Classifieds (${classifiedsRes.data.length}):\n`;
        classifiedsRes.data.forEach((c: any) => {
          dbContext += `- ${c.title} | ${c.category} | ₹${c.price} | ${c.city} | ${c.condition}\n`;
        });
      }

      if (!dbContext) {
        dbContext = "\n(No data found in the app yet. Encourage users to register their shops and post listings!)\n";
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + dbContext + `

Rules:
- Always be helpful, warm, and respectful
- Explain features step-by-step in simple Hindi
- If asked about registration: explain it's FREE, premium is optional
- If asked about payment: explain UPI QR code process
- For health queries: give remedies from all 3 systems (Ayurveda/Homeopathy/Allopathy) with disclaimer
- For legal queries: cite relevant sections/acts with disclaimer
- For govt schemes: provide eligibility, benefits, and official website
- If asked about specific shops/jobs/profiles: use the LIVE APP DATA above
- Keep responses concise (2-4 sentences unless explaining a process)
- Never make up specific shop names, prices, or contacts not in the data above`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
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
