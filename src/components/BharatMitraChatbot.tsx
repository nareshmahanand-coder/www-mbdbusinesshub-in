import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, HelpCircle, AlertTriangle, ShoppingBag, Heart, Shield, Volume2, Droplets, Megaphone, PhoneCall, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import assistantAvatar from "@/assets/assistant-avatar.png";
import { sampleShops } from "@/data/sampleShops";
import { ChatMessage, TabType } from "./chatbot/types";
import {
  FAQ_BUTTONS, SERVICES_INFO, LOCAL_DEALS, IDLE_SUGGESTIONS,
  SAFETY_KEYWORDS,
} from "./chatbot/constants";
import SafetyOverlay from "./chatbot/SafetyOverlay";
import BloodDonorTab from "./chatbot/BloodDonorTab";
import HealthTab from "./chatbot/HealthTab";

const DEFAULT_INTRO = "नमस्ते / जय जोहार! 🙏 मैं भारत मित्र हूँ। मैं भारत की सभी भाषाएं — Hindi, English, Chhattisgarhi, Odia, Bengali, Tamil आदि — समझ सकती हूँ और आपकी हर तरह से मदद करने के लिए तैयार हूँ। आप किसी भी भाषा में पूछें, मैं उसी भाषा में जवाब दूँगी।";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: DEFAULT_INTRO,
};

const LOGIN_GREETING = "मेरा भारत दुकान में आपका स्वागत है, मैं हूँ भारत मित्र, आपकी क्या सेवा कर सकती हूँ?";
const WELCOME_AUDIO_TEXT = "मेरा भारत दुकान में, मैं आपकी भारत मित्र आपका स्वागत करती हूँ।";

/** Map Indian state → warm regional greeting + tts language code */
const REGION_GREETINGS: Record<string, { text: string; lang: string }> = {
  "Chhattisgarh":   { text: "जय जोहार! 🙏 मेरा भारत दुकान ऐप में आपका स्वागत है। मैं भारत मित्र हूँ — आपकी क्या मदद कर सकती हूँ?", lang: "hi-IN" },
  "Odisha":         { text: "ନମସ୍କାର! 🙏 ମେରା ଭାରତ ଦୁକାନ ଆପ୍‌କୁ ସ୍ୱାଗତ। ମୁଁ ଭାରତ ମିତ୍ର — ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?", lang: "or-IN" },
  "West Bengal":    { text: "নমস্কার! 🙏 মেরা ভারত দুকান অ্যাপে আপনাকে স্বাগতম। আমি ভারত মিত্র — আপনাকে কীভাবে সাহায্য করতে পারি?", lang: "bn-IN" },
  "Tamil Nadu":     { text: "வணக்கம்! 🙏 மேரா பாரத் துகான் ஆப்பிற்கு வரவேற்கிறேன். நான் பாரத் மித்ரா — எப்படி உதவலாம்?", lang: "ta-IN" },
  "Karnataka":      { text: "ನಮಸ್ಕಾರ! 🙏 ಮೇರಾ ಭಾರತ್ ದುಕಾನ್ ಆಪ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ಭಾರತ ಮಿತ್ರ — ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?", lang: "kn-IN" },
  "Andhra Pradesh": { text: "నమస్కారం! 🙏 మేరా భారత్ దుకాన్ యాప్‌కి స్వాగతం. నేను భారత్ మిత్ర — ఎలా సహాయం చేయగలను?", lang: "te-IN" },
  "Telangana":      { text: "నమస్కారం! 🙏 మేరా భారత్ దుకాన్ యాప్‌కి స్వాగతం. నేను భారత్ మిత్ర — ఎలా సహాయం చేయగలను?", lang: "te-IN" },
  "Kerala":         { text: "നമസ്കാരം! 🙏 മേരാ ഭാരത് ദുകാൻ ആപ്പിലേക്ക് സ്വാഗതം. ഞാൻ ഭാരത് മിത്ര — എങ്ങനെ സഹായിക്കാം?", lang: "ml-IN" },
  "Maharashtra":    { text: "नमस्कार! 🙏 मेरा भारत दुकान अ‍ॅपवर आपले स्वागत. मी भारत मित्र — कशी मदत करू?", lang: "mr-IN" },
  "Gujarat":        { text: "નમસ્તે! 🙏 મેરા ભારત દુકાન એપ્પમાં આપનું સ્વાગત. હું ભારત મિત્ર — હું તમારી શી મદદ કરી શકું?", lang: "gu-IN" },
  "Punjab":         { text: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੇਰਾ ਭਾਰਤ ਦੁਕਾਨ ਐਪ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਮੈਂ ਭਾਰਤ ਮਿੱਤਰ — ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?", lang: "pa-IN" },
  "Assam":          { text: "নমস্কাৰ! 🙏 মেৰা ভাৰত দুকান এপত আপোনাক স্বাগতম। মই ভাৰত মিত্ৰ — কেনেদৰে সহায় কৰিব পাৰোঁ?", lang: "as-IN" },
};

const DEFAULT_GREETING = { text: "नमस्ते बॉस जी! 🙏 मैं भारत मित्र हूँ। मैं भारत की सभी भाषाएं समझ सकती हूँ और आपकी हर तरह से मदद करने के लिए तैयार हूँ।", lang: "hi-IN" };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bharat-mitra-chat`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

const BharatMitraChatbot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [aiHistory, setAiHistory] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [safetyActivated, setSafetyActivated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userState, setUserState] = useState<string | null>(null);
  const [safeWalkActive, setSafeWalkActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Chat window draggable state
  const [chatPos, setChatPos] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const [draggingChat, setDraggingChat] = useState(false);
  const chatDragOffset = useRef({ x: 0, y: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize chat position — right side, above center to not block search
  const initChatPos = useCallback(() => {
    const chatW = Math.min(window.innerWidth * 0.92, 360);
    const chatH = Math.min(window.innerHeight * 0.7, 520);
    const x = Math.max(8, window.innerWidth - chatW - 12);
    const y = Math.max(8, Math.min(window.innerHeight - chatH - 16, window.innerHeight * 0.12));
    setChatPos({ x, y });
  }, []);

  // Chat header drag handlers
  const handleChatPointerDown = useCallback((e: React.PointerEvent) => {
    setDraggingChat(true);
    chatDragOffset.current = { x: e.clientX - chatPos.x, y: e.clientY - chatPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [chatPos]);

  const handleChatPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingChat) return;
    const chatW = Math.min(window.innerWidth * 0.92, 360);
    const chatH = Math.min(window.innerHeight * 0.7, 520);
    const newX = Math.max(0, Math.min(window.innerWidth - chatW, e.clientX - chatDragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - chatH, e.clientY - chatDragOffset.current.y));
    setChatPos({ x: newX, y: newY });
  }, [draggingChat]);

  const handleChatPointerUp = useCallback(() => {
    setDraggingChat(false);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // TTS — speak a specific message
  const speakText = useCallback((text: string, msgId?: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const preferredVoice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("hi")) ??
        voices.find((voice) => voice.lang.toLowerCase().includes("in")) ?? null;
      if (preferredVoice) { utterance.voice = preferredVoice; utterance.lang = preferredVoice.lang; }
      else { utterance.lang = "hi-IN"; }
      utterance.rate = 0.92; utterance.pitch = 1.05; utterance.volume = 1;
      utterance.onstart = () => { setIsSpeaking(true); if (msgId) setSpeakingMsgId(msgId); };
      utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
      utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
      synth.cancel(); synth.speak(utterance);
    };
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; speak(); };
      window.setTimeout(speak, 350);
      return;
    }
    speak();
  }, []);

  // STT — Web Speech API
  const toggleListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("आपका ब्राउज़र Speech Recognition सपोर्ट नहीं करता।");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const triggerPendingGreeting = useCallback(() => {
    if (location.pathname !== "/") return;
    if (sessionStorage.getItem("bharat-mitra-pending-greet") !== "true") return;
    sessionStorage.removeItem("bharat-mitra-pending-greet");
    if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    greetingTimeoutRef.current = setTimeout(() => {
      speakText(LOGIN_GREETING);
    }, 700);
  }, [location.pathname, speakText]);

  useEffect(() => {
    triggerPendingGreeting();
    return () => { if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current); };
  }, [triggerPendingGreeting]);

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
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [open, resetIdleTimer]);

  // Only render on home page (after all hooks)
  if (location.pathname !== "/") return null;

  // Parse [[SHOP:id:name]] links in bot messages
  const renderMessageWithShopLinks = (text: string) => {
    const regex = /\[\[SHOP:([^:]+):([^\]]+)\]\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const shopId = match[1];
      const shopName = match[2];
      parts.push(
        <button
          key={`shop-${shopId}-${match.index}`}
          onClick={() => { setOpen(false); navigate(`/shop/${shopId}`); }}
          className="inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/15 px-2 py-0.5 font-semibold text-accent transition-colors hover:bg-accent/30 mx-0.5"
        >
          🏪 {shopName}
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, sender: "bot", text }]);
    resetIdleTimer();
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: "user", text }]);
    resetIdleTimer();
  };

  const getUserLocation = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserLocation(loc); resolve(loc); },
        () => resolve(null)
      );
    });

  const activateSafetyMode = async () => {
    setSafetyActivated(true);
    const msg = "🚨 बॉस जी, सुरक्षा चक्र एक्टिव! आपकी लोकेशन शेयर की जा रही है...";
    addBotMessage(msg); speakText(msg);
    const loc = await getUserLocation();
    if (loc) {
      addBotMessage(`📍 आपकी लोकेशन: https://www.google.com/maps?q=${loc.lat},${loc.lng}`);
      const nearest = sampleShops.filter((s) => s.verified)
        .sort((a, b) => Math.hypot(a.lat - loc.lat, a.lng - loc.lng) - Math.hypot(b.lat - loc.lat, b.lng - loc.lng))[0];
      if (nearest) addBotMessage(`🏪 नजदीकी लोकल गार्जियन: ${nearest.name} (${nearest.address})।`);
    } else {
      const fallback = "बॉस जी, लोकेशन नहीं मिल पाई। कृपया तुरंत 112 पर कॉल करें।";
      addBotMessage(fallback); speakText(fallback);
    }
  };

  const toggleSafeWalk = () => {
    if (safeWalkActive) {
      setSafeWalkActive(false);
      const msg = "बॉस जी, Safe Walk बंद हो गया। आप सुरक्षित पहुँच गए! 🙏";
      addBotMessage(msg); speakText(msg);
    } else {
      setSafeWalkActive(true);
      const msg = "बॉस जी, Safe Walk शुरू! मैं आपके साथ हूँ। 🛡️";
      addBotMessage(msg); speakText(msg);
    }
  };

  const getLocalDeal = (): string => LOCAL_DEALS[Math.floor(Math.random() * LOCAL_DEALS.length)];

  const handleFaq = (faq: (typeof FAQ_BUTTONS)[0]) => {
    addUserMessage(faq.label);
    setTimeout(() => { addBotMessage(faq.answer); speakText(faq.answer); }, 400);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isAiLoading) return;
    addUserMessage(trimmed);
    setInput("");
    const lower = trimmed.toLowerCase();

    if (safeWalkActive && (lower.includes("पहुँच गए") || lower.includes("pahunch") || lower.includes("reached") || lower.includes("home"))) {
      setSafeWalkActive(false);
      const msg = "बॉस जी, बहुत अच्छा! आप सुरक्षित पहुँच गए। 🙏🎉";
      addBotMessage(msg); speakText(msg);
      return;
    }

    if (SAFETY_KEYWORDS.some((kw) => lower.includes(kw))) {
      activateSafetyMode();
      return;
    }

    setIsAiLoading(true);
    const newHistory: AiMessage[] = [...aiHistory, { role: "user", content: trimmed }];

    // Get user location for proximity search
    const loc = userLocation || await getUserLocation();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newHistory,
          userLat: loc?.lat,
          userLng: loc?.lng,
          userId: user?.id,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;
      const botMsgId = `bot-${Date.now()}`;

      setMessages((prev) => [...prev, { id: botMsgId, sender: "bot", text: "..." }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => prev.map((m) => m.id === botMsgId ? { ...m, text: assistantSoFar } : m));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => prev.map((m) => m.id === botMsgId ? { ...m, text: assistantSoFar } : m));
            }
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) {
        setAiHistory([...newHistory, { role: "assistant", content: assistantSoFar }]);
      }
    } catch (e) {
      console.error("AI chat error:", e);
      addBotMessage("बॉस जी, अभी AI सर्वर से जुड़ने में दिक्कत हो रही है। कृपया नीचे FAQ बटन देखें या helpline.bharatdukaan@gmail.com पर संपर्क करें।");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleComplaintSubmit = async () => {
    if (!complaintText.trim()) return;
    setComplaintLoading(true);
    const trimmed = complaintText.trim();
    try {
      const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
      const userPhone = user?.phone ?? user?.user_metadata?.phone ?? null;

      await supabase.from("complaints").insert({
        user_id: user?.id ?? null,
        user_name: userName,
        user_phone: userPhone,
        complaint_text: trimmed,
      });

      // Forward to Help Desk WhatsApp (9203645007) — message-only support
      const waMsg =
        `🛎️ *भारत दुकान — नई शिकायत*\n\n` +
        `👤 नाम: ${userName ?? "Anonymous"}\n` +
        `📞 फोन: ${userPhone ?? "N/A"}\n\n` +
        `📝 शिकायत:\n${trimmed}`;
      window.open(
        `https://wa.me/919203645007?text=${encodeURIComponent(waMsg)}`,
        "_blank",
      );

      setComplaintSubmitted(true);
      setComplaintText("");
      setTimeout(() => setComplaintSubmitted(false), 5000);
    } catch (err) {
      console.error("Complaint submit error:", err);
    } finally {
      setComplaintLoading(false);
    }
  };

  const handleHealthAsk = (q: string, a: string) => {
    setActiveTab(null); addUserMessage(q);
    setTimeout(() => { addBotMessage(a); speakText(a); }, 400);
  };

  // Closed state — FAB at center-right with neon glow
  if (!open) {
    return (
      <div
        className="fixed z-50 flex flex-col items-center gap-1.5"
        style={{ right: 12, top: "50%", transform: "translateY(-50%)", touchAction: "none" }}
      >
        <button
          onClick={() => { initChatPos(); setOpen(true); setTimeout(() => speakText(WELCOME_AUDIO_TEXT), 400); }}
          className="relative h-20 w-20 overflow-hidden rounded-full border-[3px] border-destructive shadow-2xl transition-transform hover:scale-110 animate-bharat-mitra-pulse"
          style={{
            boxShadow: "0 0 20px 6px hsl(var(--destructive) / 0.5), 0 0 40px 14px hsl(var(--destructive) / 0.3), 0 0 60px 20px hsl(var(--primary) / 0.2)",
          }}
          aria-label="Open Bharat Mitra Chat"
        >
          <img src={assistantAvatar} alt="भारत मित्र" className="h-full w-full object-cover" />
        </button>
        <span className="font-hindi text-sm font-black text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)] select-none whitespace-nowrap">
          भारत मित्र <span className="font-sans text-xs font-bold tracking-wide">AI</span>
        </span>
      </div>
    );
  }

  const tabs = [
    { id: "help" as TabType, icon: HelpCircle, label: "AI चैट" },
    { id: "complaint" as TabType, icon: AlertTriangle, label: "शिकायत" },
    { id: "services" as TabType, icon: ShoppingBag, label: "सुविधाएँ" },
    { id: "health" as TabType, icon: Heart, label: "स्वास्थ्य" },
    { id: "blood" as TabType, icon: Droplets, label: "ब्लड" },
    { id: "safety" as TabType, icon: Shield, label: "सुरक्षा" },
  ];

  const chatW = Math.min(window.innerWidth * 0.92, 360);
  const chatH = Math.min(window.innerHeight * 0.7, 520);

  return (
    <div
      className={`fixed z-50 flex flex-col overflow-hidden border border-border bg-background shadow-2xl animate-scale-in ${
        isMaximized
          ? "inset-2 sm:inset-4 md:inset-8 rounded-2xl mx-auto my-auto max-w-5xl max-h-[95vh]"
          : "rounded-2xl"
      }`}
      style={
        isMaximized
          ? { touchAction: "auto", transition: "all 0.25s ease" }
          : {
              left: chatPos.x,
              top: chatPos.y,
              width: chatW,
              height: chatH,
              touchAction: "none",
              transition: draggingChat ? "none" : "all 0.25s ease",
            }
      }
    >
      {/* Draggable Header */}
      <div
        className={`flex items-center gap-3 bg-primary px-4 py-3 select-none ${
          isMaximized ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        onPointerDown={isMaximized ? undefined : handleChatPointerDown}
        onPointerMove={isMaximized ? undefined : handleChatPointerMove}
        onPointerUp={isMaximized ? undefined : handleChatPointerUp}
      >
        <div className="relative pointer-events-none">
          <img src={assistantAvatar} alt="भारत मित्र"
            className={`h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover ${isSpeaking ? "bharat-mitra-speaking" : ""}`}
          />
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent">
              <Volume2 className="h-2 w-2 text-accent-foreground" />
            </span>
          )}
        </div>
        <div className="flex-1 pointer-events-none">
          <h4 className="text-sm font-bold text-primary-foreground">🇮🇳 भारत मित्र AI</h4>
          <p className="text-[10px] text-primary-foreground/60">
            {isAiLoading ? "सोच रही हूँ..." : safeWalkActive ? "🛡️ Safe Walk Active" : isSpeaking ? "बोल रही हूँ..." : isMaximized ? "फुल स्क्रीन मोड" : "खींचकर कहीं भी ले जाएं ↕️"}
          </p>
        </div>
        <div className="flex items-center gap-1" style={{ pointerEvents: "auto" }}>
          <button onClick={toggleSafeWalk}
            className={`rounded-full p-1.5 transition-colors ${safeWalkActive ? "bg-accent text-accent-foreground animate-pulse" : "text-primary-foreground/50 hover:text-primary-foreground"}`}
            title="Safe Walk">
            <PhoneCall className="h-4 w-4" />
          </button>
          <button onClick={() => addBotMessage(getLocalDeal())}
            className="rounded-full p-1.5 text-primary-foreground/50 hover:text-primary-foreground transition-colors" title="आज के डील्स">
            <Megaphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMaximized((v) => !v)}
            className="rounded-full p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            title={isMaximized ? "छोटा करें" : "बड़ा करें"}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => { setOpen(false); setActiveTab(null); window.speechSynthesis?.cancel(); setIsListening(false); recognitionRef.current?.stop(); }} className="text-primary-foreground/70 hover:text-primary-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {safeWalkActive && (
        <div className="flex items-center gap-2 bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent">
          <Shield className="h-3 w-3 animate-pulse" /> Safe Walk चालू 🛡️
          <button onClick={toggleSafeWalk} className="ml-auto text-[10px] underline">बंद करें</button>
        </div>
      )}

      {/* Tab Buttons */}
      <div className={`border-b border-border ${
        isMaximized
          ? "grid grid-cols-3 sm:grid-cols-6 gap-1 p-2 bg-muted/30"
          : "flex overflow-x-auto"
      }`}>
        {tabs.map((tab) => (
          <button key={tab.id}
            onClick={() => {
              if (tab.id === "safety") { activateSafetyMode(); return; }
              setActiveTab(activeTab === tab.id ? null : tab.id);
            }}
            className={
              isMaximized
                ? `flex flex-col items-center justify-center gap-1 rounded-lg py-3 text-xs font-semibold transition-all hover:scale-[1.03] ${
                    tab.id === "safety" ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : tab.id === "blood" ? activeTab === tab.id ? "bg-destructive/15 text-destructive ring-2 ring-destructive" : "bg-card text-destructive/70 hover:bg-destructive/5 border border-border"
                    : activeTab === tab.id ? "bg-accent/15 text-accent ring-2 ring-accent" : "bg-card text-foreground hover:bg-muted border border-border"
                  }`
                : `flex flex-1 items-center justify-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
                    tab.id === "safety" ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : tab.id === "blood" ? activeTab === tab.id ? "border-b-2 border-destructive bg-destructive/5 text-destructive" : "text-destructive/60 hover:text-destructive"
                    : activeTab === tab.id ? "border-b-2 border-accent bg-accent/5 text-accent" : "text-muted-foreground hover:text-foreground"
                  }`
            }
          >
            <tab.icon className={isMaximized ? "h-5 w-5" : "h-3 w-3"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto relative">
        {(activeTab === "help" || activeTab === null) && (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                    m.sender === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                  }`}>
                    {renderMessageWithShopLinks(m.text)}
                  </div>
                  {m.sender === "bot" && m.id !== "welcome" && (
                    <button
                      onClick={() => speakText(m.text, m.id)}
                      className={`ml-1 mt-1 flex-shrink-0 self-start rounded-full p-1 transition-colors ${
                        speakingMsgId === m.id ? "bg-accent text-accent-foreground animate-pulse" : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                      }`}
                      title="सुनें"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {isAiLoading && messages[messages.length - 1]?.sender === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">सोच रही हूँ...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {FAQ_BUTTONS.map((faq, i) => (
                <button key={i} onClick={() => handleFaq(faq)}
                  className="rounded-full border border-[#FF9933]/60 bg-[#FF9933]/25 px-2.5 py-1 text-[10px] font-bold text-[#0a1a5e] transition-colors hover:bg-[#FF9933]/40">
                  {faq.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <div className="relative flex-1">
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="बॉस जी, कुछ भी पूछें..."
                  className="h-9 pr-9 text-sm" disabled={isAiLoading} />
                <button
                  onClick={toggleListening}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${
                    isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:text-accent"
                  }`}
                  title={isListening ? "बोलना बंद करें" : "बोलकर टाइप करें"}
                  type="button"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <Button size="sm" onClick={handleSend} className="h-9 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isAiLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === "complaint" && (
          <div className="flex flex-col gap-4 p-4">
            <div className="rounded-lg bg-muted p-3">
              <h5 className="mb-1 text-sm font-semibold text-foreground">📝 शिकायत दर्ज करें</h5>
              <p className="text-xs text-muted-foreground">अपनी शिकायत लिखें। हमारी टीम 24 घंटे में जवाब देगी।</p>
            </div>
            <Textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)}
              placeholder="अपनी शिकायत यहाँ लिखें..." className="min-h-[120px] text-sm" />
            <Button onClick={handleComplaintSubmit} disabled={!complaintText.trim() || complaintLoading}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <AlertTriangle className="mr-2 h-4 w-4" /> {complaintLoading ? "भेज रही हूँ..." : "शिकायत भेजें"}
            </Button>
            {complaintSubmitted && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-center text-sm text-green-800">
                ✅ आपकी शिकायत दर्ज कर ली गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।
              </div>
            )}
          </div>
        )}

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

        {activeTab === "health" && <HealthTab onAskHealth={handleHealthAsk} />}
        {activeTab === "blood" && <BloodDonorTab />}
        {safetyActivated && <SafetyOverlay onClose={() => setSafetyActivated(false)} userLocation={userLocation} />}
      </div>
    </div>
  );
};

export default BharatMitraChatbot;
