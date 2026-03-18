import { useState, useRef, useEffect } from "react";
import { X, Send, HelpCircle, AlertTriangle, ShoppingBag, Heart, Shield, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import assistantAvatar from "@/assets/assistant-avatar.png";
import { sampleShops } from "@/data/sampleShops";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

type TabType = "help" | "complaint" | "services" | "health" | "safety" | null;

const FAQ_BUTTONS = [
  { label: "दुकान कैसे जोड़ें?", answer: "अपना प्रोफाइल बनाएं, 'Add Shop' पर क्लिक करें और फोटो डालें। यह फ्री है!" },
  { label: "प्रीमियम प्लान के क्या फायदे हैं?", answer: "1. आपकी दुकान सबसे ऊपर दिखेगी। 2. 'Verified' टिक मिलेगा। 3. विज्ञापन के जरिए ज्यादा ग्राहक आएंगे। प्लान: ₹99/महीना या ₹999/साल।" },
  { label: "पेमेंट सुरक्षित है या नहीं?", answer: "पूरी तरह सुरक्षित! हम भारत सरकार (MSME) नियमों का पालन करते हैं।" },
  { label: "क्या कमीशन लिया जाता है?", answer: "बिल्कुल नहीं! भारत दुकान 0% कमीशन पर काम करता है।" },
  { label: "मदद चाहिए?", answer: "हमारी टीम 24 घंटे उपलब्ध है। helpline.bharatdukaan@gmail.com पर ईमेल करें।" },
];

const HEALTH_TIPS = [
  { q: "सर्दी-जुकाम", a: "बॉस, गर्म पानी पिएं, अदरक-तुलसी की चाय लें, और आराम करें। अगर 3 दिन में ठीक न हो तो नजदीकी डॉक्टर से मिलें।" },
  { q: "बुखार", a: "बॉस, पैरासिटामोल लें, खूब पानी पिएं। अगर बुखार 102°F से ज्यादा हो तो तुरंत डॉक्टर के पास जाएं।" },
  { q: "पेट दर्द", a: "हल्का खाना खाएं, अजवाइन का पानी पिएं। अगर दर्द तेज हो तो डॉक्टर से मिलें।" },
  { q: "BP / ब्लड प्रेशर", a: "कम नमक खाएं, रोज 30 मिनट चलें, तनाव से बचें। नियमित जांच करवाएं।" },
  { q: "शुगर / डायबिटीज", a: "मीठा कम खाएं, रोज व्यायाम करें, दवाई समय पर लें। हर 3 महीने HbA1c टेस्ट करवाएं।" },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: "नमस्ते बॉस! 🙏 भारत दुकान में आपका स्वागत है। मैंने आपके लिए प्रीमियम दुकानें सबसे ऊपर रख दी हैं। आप सीधे व्हाट्सएप पर बात कर सकते हैं। नीचे दिए गए विकल्प चुनें:",
};

const SAFETY_KEYWORDS = ["help", "बचाओ", "bachao", "emergency", "sos", "खतरा", "danger"];
const PAYMENT_KEYWORDS = ["पैसे", "fees", "payment", "pay", "charge", "cost", "price", "कीमत", "पेमेंट", "चार्ज"];
const HEALTH_KEYWORDS = ["doctor", "डॉक्टर", "clinic", "क्लिनिक", "hospital", "अस्पताल", "दवाई", "medicine", "pharmacy", "बीमार", "sick", "health", "स्वास्थ्य"];
const SHOP_KEYWORDS = ["दुकान", "shop", "store", "कहाँ", "where", "find", "खोजो", "ढूंढो", "address", "पता"];

const getPaymentResponse = (): string =>
  "नहीं बॉस, ऐप का इस्तेमाल और बेसिक लिस्टिंग पूरी तरह फ्री है। लेकिन अगर आप चाहते हैं कि आपकी दुकान शहर में सबसे ऊपर (TOP) दिखे, तो हमारा 'प्रीमियम प्लान' (₹99/महीना या ₹999/साल) ले सकते हैं।";

const SERVICES_INFO = [
  { name: "🏠 PG / रूम किराया", desc: "अपने शहर में PG और किराये के कमरे खोजें या लिस्ट करें।" },
  { name: "🍱 टिफिन सर्विस", desc: "घर का खाना — टिफिन सेवा प्रदाताओं को खोजें।" },
  { name: "🚲 साइकिल स्टोर", desc: "नई और पुरानी साइकिल की दुकानें खोजें।" },
  { name: "🧹 मेड / हेल्पर", desc: "घरेलू सहायक और सफाई सेवाएं।" },
  { name: "👨‍⚕️ डॉक्टर / क्लिनिक", desc: "नजदीकी डॉक्टर और क्लिनिक खोजें।" },
];

const BharatMitraChatbot = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [safetyActivated, setSafetyActivated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (text: string) => {
    const msg: ChatMessage = { id: `bot-${Date.now()}`, sender: "bot", text };
    setMessages((prev) => [...prev, msg]);
  };

  const addUserMessage = (text: string) => {
    const msg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text };
    setMessages((prev) => [...prev, msg]);
  };

  // Text-to-Speech in Hindi
  const speakHindi = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const addBotMessageAndSpeak = (text: string) => {
    addBotMessage(text);
    speakHindi(text);
  };

  // Safety mode — share location with emergency
  const activateSafetyMode = () => {
    setSafetyActivated(true);
    addBotMessageAndSpeak("🚨 बॉस, आपकी सुरक्षा हमारी प्राथमिकता है! मैं अभी आपकी लोकेशन शेयर कर रही हूँ...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          addBotMessage(`📍 आपकी लोकेशन: ${locationUrl}`);
          addBotMessageAndSpeak(
            `बॉस, आपकी लोकेशन मिल गई। कृपया 112 (Emergency) पर कॉल करें। Women Helpline: 181। पुलिस: 100। एम्बुलेंस: 108।`
          );
          // Open emergency call
          setTimeout(() => {
            window.open("tel:112", "_self");
          }, 2000);
        },
        () => {
          addBotMessageAndSpeak("बॉस, लोकेशन नहीं मिल पाई। कृपया तुरंत 112 पर कॉल करें। Women Helpline: 181। पुलिस: 100।");
        }
      );
    } else {
      addBotMessageAndSpeak("कृपया तुरंत 112 पर कॉल करें। Women Helpline: 181। पुलिस: 100। एम्बुलेंस: 108।");
    }
    setTimeout(() => setSafetyActivated(false), 10000);
  };

  // Search shops from database
  const findShops = (query: string): string => {
    const q = query.toLowerCase();
    const matches = sampleShops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameHindi.includes(query) ||
        s.category.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );

    // Premium first
    const sorted = matches.sort((a, b) => {
      if (a.premium && !b.premium) return -1;
      if (!a.premium && b.premium) return 1;
      return b.rating - a.rating;
    });

    if (sorted.length === 0) {
      return "बॉस, इस सर्च में कोई दुकान नहीं मिली। कृपया दूसरा नाम या कैटेगरी बताएं।";
    }

    const premiumShop = sorted.find((s) => s.premium);
    let response = "";
    if (premiumShop) {
      response += `बॉस, आपके लिए सबसे बेहतरीन और प्रीमियम दुकान ⭐ ${premiumShop.name} (${premiumShop.nameHindi}) है। पता: ${premiumShop.address}, ${premiumShop.city}। व्हाट्सएप: ${premiumShop.whatsapp}\n\n`;
    }

    response += `कुल ${sorted.length} दुकानें मिलीं:\n`;
    sorted.slice(0, 5).forEach((s, i) => {
      response += `${i + 1}. ${s.premium ? "⭐ " : ""}${s.name} — ${s.address}, ${s.city} (⭐ ${s.rating})\n`;
    });
    return response;
  };

  // Find nearby clinics/pharmacies
  const findHealthServices = (): string => {
    const healthShops = sampleShops.filter(
      (s) => s.category === "Pharmacy" || s.description.toLowerCase().includes("doctor") || s.description.toLowerCase().includes("clinic")
    );
    if (healthShops.length === 0) return "बॉस, अभी नजदीकी क्लिनिक/फार्मेसी की जानकारी उपलब्ध नहीं है।";
    
    let response = "बॉस, ये रहीं नजदीकी स्वास्थ्य सेवाएं:\n";
    healthShops.forEach((s, i) => {
      response += `${i + 1}. ${s.premium ? "⭐ " : ""}${s.name} — ${s.address}, ${s.city}। व्हाट्सएप: ${s.whatsapp}\n`;
    });
    return response;
  };

  const handleFaq = (faq: (typeof FAQ_BUTTONS)[0]) => {
    addUserMessage(faq.label);
    setTimeout(() => addBotMessageAndSpeak(faq.answer), 400);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setInput("");
    const lower = trimmed.toLowerCase();

    // Safety check
    if (SAFETY_KEYWORDS.some((kw) => lower.includes(kw))) {
      activateSafetyMode();
      return;
    }

    const isPaymentQ = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
    const isHealthQ = HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
    const isShopQ = SHOP_KEYWORDS.some((kw) => lower.includes(kw));

    setTimeout(() => {
      if (isPaymentQ) {
        addBotMessageAndSpeak(getPaymentResponse());
      } else if (isHealthQ) {
        // Check for specific health tips
        const tip = HEALTH_TIPS.find((t) => lower.includes(t.q.toLowerCase()));
        if (tip) {
          addBotMessageAndSpeak(tip.a);
        } else {
          const healthInfo = findHealthServices();
          addBotMessageAndSpeak(healthInfo);
        }
      } else if (isShopQ) {
        const shopResult = findShops(trimmed);
        addBotMessageAndSpeak(shopResult);
      } else {
        // Try general shop search
        const shopResult = findShops(trimmed);
        if (shopResult.includes("कोई दुकान नहीं मिली")) {
          addBotMessageAndSpeak(
            "बॉस, धन्यवाद! आपके सवाल के लिए कृपया नीचे दिए गए FAQ बटन देखें या helpline.bharatdukaan@gmail.com पर संपर्क करें।"
          );
        } else {
          addBotMessageAndSpeak(shopResult);
        }
      }
    }, 500);
  };

  const handleComplaintSubmit = () => {
    if (!complaintText.trim()) return;
    setComplaintSubmitted(true);
    setComplaintText("");
    setTimeout(() => setComplaintSubmitted(false), 4000);
  };

  // Closed state: animated avatar
  if (!open) {
    return (
      <div className="fixed right-4 top-1/3 z-50 flex flex-col items-end gap-2">
        <div className="relative rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg">
          नमस्ते बॉस! मैं आपकी क्या मदद कर सकती हूँ? 🙏
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-primary" />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bharat-mitra-avatar relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent shadow-xl transition-transform hover:scale-110"
          aria-label="Open Bharat Mitra Chat"
        >
          <span className="bharat-mitra-pulse-ring" />
          <img src={assistantAvatar} alt="भारत मित्र" className="h-full w-full object-cover" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-24 z-50 flex h-[540px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3">
        <div className="relative">
          <img
            src={assistantAvatar}
            alt="भारत मित्र"
            className={`h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover ${isSpeaking ? "bharat-mitra-speaking" : ""}`}
          />
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent">
              <Volume2 className="h-2 w-2 text-accent-foreground" />
            </span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary-foreground">🇮🇳 भारत मित्र</h4>
          <p className="text-[10px] text-primary-foreground/60">
            {isSpeaking ? "बोल रही हूँ..." : "Bharat Dukaan Official Assistant"}
          </p>
        </div>
        <button onClick={() => { setOpen(false); setActiveTab(null); window.speechSynthesis?.cancel(); }} className="text-primary-foreground/70 hover:text-primary-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          { id: "help" as TabType, icon: HelpCircle, label: "मदद" },
          { id: "complaint" as TabType, icon: AlertTriangle, label: "शिकायत" },
          { id: "services" as TabType, icon: ShoppingBag, label: "सुविधाएँ" },
          { id: "health" as TabType, icon: Heart, label: "स्वास्थ्य" },
          { id: "safety" as TabType, icon: Shield, label: "सुरक्षा" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "safety") {
                activateSafetyMode();
                return;
              }
              setActiveTab(activeTab === tab.id ? null : tab.id);
            }}
            className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              tab.id === "safety"
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : activeTab === tab.id
                ? "border-b-2 border-accent bg-accent/5 text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Help Tab — Chat */}
        {(activeTab === "help" || activeTab === null) && (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                      m.sender === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* FAQ Buttons */}
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {FAQ_BUTTONS.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleFaq(faq)}
                  className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent-foreground transition-colors hover:bg-accent/20"
                >
                  {faq.label}
                </button>
              ))}
            </div>
            {/* Input */}
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="बॉस, अपना सवाल पूछें..."
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleSend} className="h-9 bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Complaint Tab */}
        {activeTab === "complaint" && (
          <div className="flex flex-col gap-4 p-4">
            <div className="rounded-lg bg-muted p-3">
              <h5 className="mb-1 text-sm font-semibold text-foreground">📝 शिकायत दर्ज करें</h5>
              <p className="text-xs text-muted-foreground">अपनी शिकायत लिखें। हमारी टीम 24 घंटे में जवाब देगी।</p>
            </div>
            <Textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="अपनी शिकायत यहाँ लिखें..."
              className="min-h-[120px] text-sm"
            />
            <Button onClick={handleComplaintSubmit} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <AlertTriangle className="mr-2 h-4 w-4" />
              शिकायत भेजें
            </Button>
            {complaintSubmitted && (
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-center text-sm text-accent-foreground">
                ✅ आपकी शिकायत सफलतापूर्वक दर्ज हो गई है!
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="flex flex-col gap-2 p-3">
            <div className="rounded-lg bg-muted p-3">
              <h5 className="mb-1 text-sm font-semibold text-foreground">🏪 उपलब्ध सुविधाएँ</h5>
              <p className="text-xs text-muted-foreground">भारत दुकान पर ये सेवाएं उपलब्ध हैं:</p>
            </div>
            {SERVICES_INFO.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <h6 className="text-sm font-semibold text-foreground">{s.name}</h6>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="flex flex-col gap-2 p-3">
            <div className="rounded-lg bg-muted p-3">
              <h5 className="mb-1 text-sm font-semibold text-foreground">🏥 स्वास्थ्य सहायता</h5>
              <p className="text-xs text-muted-foreground">बॉस, बेसिक स्वास्थ्य टिप्स के लिए नीचे क्लिक करें:</p>
            </div>
            {HEALTH_TIPS.map((tip, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveTab(null);
                  addUserMessage(tip.q);
                  setTimeout(() => addBotMessageAndSpeak(tip.a), 400);
                }}
                className="rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <h6 className="text-sm font-semibold text-foreground">💊 {tip.q}</h6>
              </button>
            ))}
            <button
              onClick={() => {
                setActiveTab(null);
                const healthInfo = findHealthServices();
                addUserMessage("नजदीकी क्लिनिक बताओ");
                setTimeout(() => addBotMessageAndSpeak(healthInfo), 400);
              }}
              className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-left transition-colors hover:bg-accent/20"
            >
              <h6 className="text-sm font-semibold text-accent">🏥 नजदीकी क्लिनिक / फार्मेसी खोजें</h6>
            </button>
          </div>
        )}

        {/* Safety emergency overlay */}
        {safetyActivated && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-destructive/95 p-6 text-center">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary-foreground/30" style={{ width: 80, height: 80 }} />
              <Shield className="relative h-16 w-16 text-primary-foreground" />
            </div>
            <h4 className="font-hindi text-lg font-bold text-primary-foreground">🚨 Emergency Mode</h4>
            <p className="font-hindi text-sm text-primary-foreground/90">
              आपकी लोकेशन शेयर की जा रही है। कृपया 112 पर कॉल करें।
            </p>
            <div className="flex flex-col gap-2 w-full">
              <a href="tel:112" className="rounded-lg bg-primary-foreground px-4 py-3 text-sm font-bold text-destructive">
                📞 112 — Emergency Call
              </a>
              <a href="tel:181" className="rounded-lg bg-primary-foreground/90 px-4 py-3 text-sm font-bold text-destructive">
                📞 181 — Women Helpline
              </a>
              <a href="tel:100" className="rounded-lg bg-primary-foreground/80 px-4 py-3 text-sm font-bold text-destructive">
                📞 100 — Police
              </a>
            </div>
            <button onClick={() => setSafetyActivated(false)} className="mt-2 text-xs text-primary-foreground/60 underline">
              बंद करें
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BharatMitraChatbot;
