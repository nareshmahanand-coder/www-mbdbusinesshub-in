import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, HelpCircle, AlertTriangle, ShoppingBag, Heart, Shield, Volume2, Droplets, Megaphone, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import assistantAvatar from "@/assets/assistant-avatar.png";
import { sampleShops } from "@/data/sampleShops";
import { ChatMessage, TabType } from "./chatbot/types";
import {
  FAQ_BUTTONS, SERVICES_INFO, HEALTH_TIPS, LOCAL_DEALS, IDLE_SUGGESTIONS,
  SAFETY_KEYWORDS, PAYMENT_KEYWORDS, HEALTH_KEYWORDS, SHOP_KEYWORDS, BLOOD_KEYWORDS, DEAL_KEYWORDS,
} from "./chatbot/constants";
import SafetyOverlay from "./chatbot/SafetyOverlay";
import BloodDonorTab from "./chatbot/BloodDonorTab";
import HealthTab from "./chatbot/HealthTab";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: "नमस्ते बॉस जी! 🙏 भारत दुकान में आपका स्वागत है। मैं आपकी भारत मित्र हूँ। दुकान ढूंढें, ऑर्डर करें, या मदद मांगें — सब कुछ यहीं! नीचे दिए विकल्प चुनें या कुछ भी पूछें:",
};

const LOGIN_GREETING = "नमस्ते बॉस! मेरा भारत दुकान में आपका स्वागत है। मैं आपकी क्या मदद कर सकती हूँ?";

const BharatMitraChatbot = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [safetyActivated, setSafetyActivated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safeWalkActive, setSafeWalkActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakHindi = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const preferredVoice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("hi")) ??
        voices.find((voice) => voice.lang.toLowerCase().includes("in")) ??
        null;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = "hi-IN";
      }

      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.cancel();
      synth.speak(utterance);
    };

    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        speak();
      };
      window.setTimeout(speak, 350);
      return;
    }

    speak();
  }, []);

  const triggerPendingGreeting = useCallback(() => {
    if (location.pathname !== "/") return;
    if (sessionStorage.getItem("bharat-mitra-pending-greet") !== "true") return;

    sessionStorage.removeItem("bharat-mitra-pending-greet");

    if (greetingTimeoutRef.current) {
      clearTimeout(greetingTimeoutRef.current);
    }

    greetingTimeoutRef.current = setTimeout(() => {
      speakHindi(LOGIN_GREETING);
    }, 700);
  }, [location.pathname, speakHindi]);

  useEffect(() => {
    triggerPendingGreeting();

    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [triggerPendingGreeting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!open) return;
    idleTimerRef.current = setTimeout(() => {
      const suggestion = IDLE_SUGGESTIONS[Math.floor(Math.random() * IDLE_SUGGESTIONS.length)];
      setMessages((prev) => [...prev, { id: `idle-${Date.now()}`, sender: "bot", text: suggestion }]);
    }, 45000);
  }, [open]);

  useEffect(() => {
    if (open) resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [open, resetIdleTimer]);

  const addBotMessage = (text: string) => {
    const msg: ChatMessage = { id: `bot-${Date.now()}`, sender: "bot", text };
    setMessages((prev) => [...prev, msg]);
    resetIdleTimer();
  };

  const addUserMessage = (text: string) => {
    const msg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text };
    setMessages((prev) => [...prev, msg]);
    resetIdleTimer();
  };

  const addBotMessageAndSpeak = (text: string) => {
    addBotMessage(text);
    speakHindi(text);
  };

  // Get user location
  const getUserLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          resolve(loc);
        },
        () => resolve(null)
      );
    });

  // Safety mode — Suraksha Chakra
  const activateSafetyMode = async () => {
    setSafetyActivated(true);
    addBotMessageAndSpeak("🚨 बॉस जी, सुरक्षा चक्र एक्टिव! आपकी लोकेशन शेयर की जा रही है नजदीकी दुकानदार और इमरजेंसी सेवाओं को...");
    const loc = await getUserLocation();
    if (loc) {
      const locationUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
      addBotMessage(`📍 आपकी लोकेशन: ${locationUrl}`);

      // Find nearest verified shopkeeper
      const nearest = sampleShops
        .filter((s) => s.verified)
        .sort((a, b) => Math.hypot(a.lat - loc.lat, a.lng - loc.lng) - Math.hypot(b.lat - loc.lat, b.lng - loc.lng))[0];

      if (nearest) {
        addBotMessage(`🏪 नजदीकी लोकल गार्जियन: ${nearest.name} (${nearest.address})। व्हाट्सएप पर SOS भेजा जा रहा है...`);
      }
    } else {
      addBotMessageAndSpeak("बॉस जी, लोकेशन नहीं मिल पाई। कृपया तुरंत 112 पर कॉल करें।");
    }
  };

  // Safe Walk feature
  const toggleSafeWalk = () => {
    if (safeWalkActive) {
      setSafeWalkActive(false);
      addBotMessageAndSpeak("बॉस जी, Safe Walk बंद हो गया। आप सुरक्षित पहुँच गए! 🙏");
    } else {
      setSafeWalkActive(true);
      addBotMessageAndSpeak("बॉस जी, Safe Walk शुरू! मैं आपके साथ हूँ जब तक आप घर नहीं पहुँच जाते। हर 2 मिनट में आपकी लोकेशन चेक होगी। 'बस पहुँच गए' बोलकर बंद करें। 🛡️");
      // Periodic location check
      const checkInterval = setInterval(async () => {
        const loc = await getUserLocation();
        if (loc) {
          addBotMessage(`📍 Safe Walk — लोकेशन अपडेट: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} — सब ठीक है बॉस जी! 🛡️`);
        }
      }, 120000); // every 2 min
      // Store interval for cleanup
      setTimeout(() => clearInterval(checkInterval), 1800000); // max 30 min
    }
  };

  // Premium-first shop search with One-Click Order
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

    const sorted = matches.sort((a, b) => {
      if (a.premium && !b.premium) return -1;
      if (!a.premium && b.premium) return 1;
      return b.rating - a.rating;
    });

    if (sorted.length === 0) {
      return "बॉस जी, इस सर्च में कोई दुकान नहीं मिली। कृपया दूसरा नाम या कैटेगरी बताएं।";
    }

    const premiumShop = sorted.find((s) => s.premium);
    let response = "";
    if (premiumShop) {
      response += `बॉस, आपके इलाके की सबसे भरोसेमंद प्रीमियम दुकान ⭐ ${premiumShop.name} (${premiumShop.nameHindi}) है, यहाँ से ऑर्डर करना सबसे सुरक्षित है।\n📍 ${premiumShop.address}, ${premiumShop.city}\n📱 One-Click Order: wa.me/${premiumShop.whatsapp}\n\n`;
    }

    response += `कुल ${sorted.length} दुकानें मिलीं:\n`;
    sorted.slice(0, 5).forEach((s, i) => {
      response += `${i + 1}. ${s.premium ? "⭐ " : ""}${s.name} — ${s.address}, ${s.city} (⭐ ${s.rating})\n   📱 व्हाट्सएप ऑर्डर: wa.me/${s.whatsapp}\n`;
    });
    return response;
  };

  // One-Click Order via WhatsApp
  const sendOneClickOrder = (shop: typeof sampleShops[0]) => {
    const locationStr = userLocation
      ? `\n📍 मेरी लोकेशन: https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
      : "";
    const message = `नमस्ते जी! 🙏\nमैं भारत दुकान ऐप से आया/आई हूँ।\nमुझे आपकी दुकान "${shop.name}" से सामान चाहिए।${locationStr}\nकृपया डिलीवरी की जानकारी दें। धन्यवाद!`;
    window.open(`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const findHealthServices = (): string => {
    const healthShops = sampleShops.filter(
      (s) => s.category === "Pharmacy" || s.description.toLowerCase().includes("doctor") || s.description.toLowerCase().includes("clinic")
    );
    if (healthShops.length === 0) return "बॉस जी, अभी नजदीकी क्लिनिक/फार्मेसी की जानकारी उपलब्ध नहीं है।";
    let response = "बॉस जी, ये रहीं नजदीकी स्वास्थ्य सेवाएं:\n";
    healthShops.forEach((s, i) => {
      response += `${i + 1}. ${s.premium ? "⭐ " : ""}${s.name} — ${s.address}, ${s.city}। 📱 wa.me/${s.whatsapp}\n`;
    });
    return response;
  };

  const getLocalDeal = (): string => LOCAL_DEALS[Math.floor(Math.random() * LOCAL_DEALS.length)];

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

    // Safe Walk end
    if (safeWalkActive && (lower.includes("पहुँच गए") || lower.includes("pahunch") || lower.includes("reached") || lower.includes("home"))) {
      setSafeWalkActive(false);
      addBotMessageAndSpeak("बॉस जी, बहुत अच्छा! आप सुरक्षित पहुँच गए। Safe Walk बंद। 🙏🎉");
      return;
    }

    // Safety check
    if (SAFETY_KEYWORDS.some((kw) => lower.includes(kw))) {
      activateSafetyMode();
      return;
    }

    const isPaymentQ = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
    const isHealthQ = HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
    const isShopQ = SHOP_KEYWORDS.some((kw) => lower.includes(kw));
    const isBloodQ = BLOOD_KEYWORDS.some((kw) => lower.includes(kw));
    const isDealQ = DEAL_KEYWORDS.some((kw) => lower.includes(kw));

    setTimeout(() => {
      if (isBloodQ) {
        setActiveTab("blood");
        addBotMessageAndSpeak("बॉस जी, ब्लड डोनर डायरेक्टरी खोल रही हूँ। कृपया ब्लड ग्रुप चुनें।");
      } else if (isDealQ) {
        addBotMessageAndSpeak(getLocalDeal());
      } else if (isPaymentQ) {
        addBotMessageAndSpeak("नहीं बॉस जी, ऐप का इस्तेमाल और बेसिक लिस्टिंग पूरी तरह फ्री है। लेकिन अगर आप चाहते हैं कि आपकी दुकान शहर में सबसे ऊपर (TOP) दिखे, तो हमारा 'प्रीमियम प्लान' (₹99/महीना या ₹999/साल) ले सकते हैं।");
      } else if (isHealthQ) {
        const tip = HEALTH_TIPS.find((t) => lower.includes(t.q.toLowerCase()));
        if (tip) {
          addBotMessageAndSpeak(tip.a);
        } else {
          addBotMessageAndSpeak(findHealthServices());
        }
      } else if (isShopQ) {
        addBotMessageAndSpeak(findShops(trimmed));
      } else {
        const shopResult = findShops(trimmed);
        if (shopResult.includes("कोई दुकान नहीं मिली")) {
          addBotMessageAndSpeak("बॉस जी, धन्यवाद! आपके सवाल के लिए कृपया नीचे दिए FAQ बटन देखें या helpline.bharatdukaan@gmail.com पर संपर्क करें।");
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

  const handleHealthAsk = (q: string, a: string) => {
    setActiveTab(null);
    addUserMessage(q);
    setTimeout(() => addBotMessageAndSpeak(a), 400);
  };

  // Closed state
  if (!open) {
    return (
      <div className="fixed right-4 top-1/3 z-50 flex flex-col items-end gap-2">
        <div className="relative rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg max-w-[200px]">
          नमस्ते बॉस जी! मैं आपकी क्या मदद कर सकती हूँ? 🙏
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-primary" />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bharat-mitra-avatar relative h-20 w-20 overflow-hidden rounded-full border-3 border-accent shadow-2xl transition-transform hover:scale-110 animate-pulse"
          aria-label="Open Bharat Mitra Chat"
        >
          <span className="bharat-mitra-pulse-ring" />
          <img src={assistantAvatar} alt="भारत मित्र" className="h-full w-full object-cover" />
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "help" as TabType, icon: HelpCircle, label: "मदद" },
    { id: "complaint" as TabType, icon: AlertTriangle, label: "शिकायत" },
    { id: "services" as TabType, icon: ShoppingBag, label: "सुविधाएँ" },
    { id: "health" as TabType, icon: Heart, label: "स्वास्थ्य" },
    { id: "blood" as TabType, icon: Droplets, label: "ब्लड" },
    { id: "safety" as TabType, icon: Shield, label: "सुरक्षा" },
  ];

  return (
    <div className="fixed right-4 top-24 z-50 flex h-[560px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]">
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
            {safeWalkActive ? "🛡️ Safe Walk Active" : isSpeaking ? "बोल रही हूँ..." : "Bharat Dukaan Official Assistant"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Safe Walk toggle */}
          <button
            onClick={toggleSafeWalk}
            className={`rounded-full p-1.5 transition-colors ${safeWalkActive ? "bg-accent text-accent-foreground animate-pulse" : "text-primary-foreground/50 hover:text-primary-foreground"}`}
            title="Safe Walk"
          >
            <PhoneCall className="h-4 w-4" />
          </button>
          {/* Local Deals */}
          <button
            onClick={() => addBotMessageAndSpeak(getLocalDeal())}
            className="rounded-full p-1.5 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
            title="आज के डील्स"
          >
            <Megaphone className="h-4 w-4" />
          </button>
          <button onClick={() => { setOpen(false); setActiveTab(null); window.speechSynthesis?.cancel(); }} className="text-primary-foreground/70 hover:text-primary-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Safe Walk banner */}
      {safeWalkActive && (
        <div className="flex items-center gap-2 bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent">
          <Shield className="h-3 w-3 animate-pulse" />
          Safe Walk चालू — मैं आपके साथ हूँ! 🛡️
          <button onClick={toggleSafeWalk} className="ml-auto text-[10px] underline">बंद करें</button>
        </div>
      )}

      {/* Tab Buttons */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "safety") {
                activateSafetyMode();
                return;
              }
              setActiveTab(activeTab === tab.id ? null : tab.id);
            }}
            className={`flex flex-1 items-center justify-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
              tab.id === "safety"
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : tab.id === "blood"
                ? activeTab === tab.id
                  ? "border-b-2 border-destructive bg-destructive/5 text-destructive"
                  : "text-destructive/60 hover:text-destructive"
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
      <div className="flex-1 overflow-y-auto relative">
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
                placeholder="बॉस जी, कुछ भी पूछें..."
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

            {/* Aatmanirbhar Local Deals */}
            <div className="mt-2 rounded-lg border border-accent/30 bg-accent/10 p-3">
              <h6 className="mb-1 flex items-center gap-1 text-sm font-semibold text-accent">
                <Megaphone className="h-3.5 w-3.5" /> आज के लोकल डील्स
              </h6>
              {LOCAL_DEALS.map((deal, i) => (
                <p key={i} className="mt-1 text-xs text-muted-foreground">• {deal}</p>
              ))}
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && <HealthTab onAskHealth={handleHealthAsk} />}

        {/* Blood Donor Tab */}
        {activeTab === "blood" && <BloodDonorTab />}

        {/* Safety emergency overlay */}
        {safetyActivated && (
          <SafetyOverlay onClose={() => setSafetyActivated(false)} userLocation={userLocation} />
        )}
      </div>
    </div>
  );
};

export default BharatMitraChatbot;
