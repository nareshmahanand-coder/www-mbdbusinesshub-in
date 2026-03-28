import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, HelpCircle, AlertTriangle, ShoppingBag, Heart, Shield, Volume2, Droplets, Megaphone, PhoneCall } from "lucide-react";
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

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: "नमस्ते बॉस जी! 🙏 मेरा भारत दुकान में आपका स्वागत है। मैं आपकी भारत मित्र हूँ। दुकान ढूंढें, ऑर्डर करें, या मदद मांगें — सब कुछ यहीं! कुछ भी पूछें, मैं AI से जवाब दूँगी:",
};

const LOGIN_GREETING = "मेरा भारत दुकान में आपका स्वागत है, मैं हूँ भारत मित्र, आपकी क्या सेवा कर सकती हूँ?";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bharat-mitra-chat`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

const BharatMitraChatbot = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [aiHistory, setAiHistory] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [safetyActivated, setSafetyActivated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safeWalkActive, setSafeWalkActive] = useState(false);
  // Draggable FAB state
  const [fabPos, setFabPos] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize FAB position
  useLayoutEffect(() => {
    if (fabPos.x === -1) {
      setFabPos({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
    }
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    hasDragged.current = false;
    dragOffset.current = { x: e.clientX - fabPos.x, y: e.clientY - fabPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [fabPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    hasDragged.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 72, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
    setFabPos({ x: newX, y: newY });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const speakHindi = useCallback((text: string) => {
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
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synth.cancel(); synth.speak(utterance);
    };
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; speak(); };
      window.setTimeout(speak, 350);
      return;
    }
    speak();
  }, []);

  const triggerPendingGreeting = useCallback(() => {
    if (location.pathname !== "/") return;
    if (sessionStorage.getItem("bharat-mitra-pending-greet") !== "true") return;
    sessionStorage.removeItem("bharat-mitra-pending-greet");
    if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    greetingTimeoutRef.current = setTimeout(() => {
      speakHindi(LOGIN_GREETING);
    }, 700);
  }, [location.pathname, speakHindi]);

  useEffect(() => {
    triggerPendingGreeting();
    return () => { if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current); };
  }, [triggerPendingGreeting]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    addBotMessage(msg); speakHindi(msg);
    const loc = await getUserLocation();
    if (loc) {
      addBotMessage(`📍 आपकी लोकेशन: https://www.google.com/maps?q=${loc.lat},${loc.lng}`);
      const nearest = sampleShops.filter((s) => s.verified)
        .sort((a, b) => Math.hypot(a.lat - loc.lat, a.lng - loc.lng) - Math.hypot(b.lat - loc.lat, b.lng - loc.lng))[0];
      if (nearest) addBotMessage(`🏪 नजदीकी लोकल गार्जियन: ${nearest.name} (${nearest.address})।`);
    } else {
      const fallback = "बॉस जी, लोकेशन नहीं मिल पाई। कृपया तुरंत 112 पर कॉल करें।";
      addBotMessage(fallback); speakHindi(fallback);
    }
  };

  const toggleSafeWalk = () => {
    if (safeWalkActive) {
      setSafeWalkActive(false);
      const msg = "बॉस जी, Safe Walk बंद हो गया। आप सुरक्षित पहुँच गए! 🙏";
      addBotMessage(msg); speakHindi(msg);
    } else {
      setSafeWalkActive(true);
      const msg = "बॉस जी, Safe Walk शुरू! मैं आपके साथ हूँ। 🛡️";
      addBotMessage(msg); speakHindi(msg);
    }
  };

  const getLocalDeal = (): string => LOCAL_DEALS[Math.floor(Math.random() * LOCAL_DEALS.length)];

  const handleFaq = (faq: (typeof FAQ_BUTTONS)[0]) => {
    addUserMessage(faq.label);
    setTimeout(() => { addBotMessage(faq.answer); speakHindi(faq.answer); }, 400);
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
      addBotMessage(msg); speakHindi(msg);
      return;
    }

    if (SAFETY_KEYWORDS.some((kw) => lower.includes(kw))) {
      activateSafetyMode();
      return;
    }

    setIsAiLoading(true);
    const newHistory: AiMessage[] = [...aiHistory, { role: "user", content: trimmed }];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newHistory }),
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

  const handleComplaintSubmit = () => {
    if (!complaintText.trim()) return;
    setComplaintSubmitted(true); setComplaintText("");
    setTimeout(() => setComplaintSubmitted(false), 4000);
  };

  const handleHealthAsk = (q: string, a: string) => {
    setActiveTab(null); addUserMessage(q);
    setTimeout(() => { addBotMessage(a); speakHindi(a); }, 400);
  };

  // Closed state — neon glowing FAB with pulse/wobble animation
  if (!open) {
    return (
      <div
        className="fixed z-50 flex flex-col items-center gap-1 animate-bharat-mitra-float"
        style={{ left: fabPos.x, top: fabPos.y, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <button
          onClick={() => { if (!hasDragged.current) setOpen(true); }}
          className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-destructive shadow-2xl transition-transform hover:scale-110 animate-bharat-mitra-pulse"
          style={{
            boxShadow: "0 0 15px 5px hsl(var(--destructive) / 0.5), 0 0 30px 10px hsl(var(--destructive) / 0.3), 0 0 45px 15px hsl(var(--primary) / 0.2)",
          }}
          aria-label="Open Bharat Mitra Chat"
        >
          <img src={assistantAvatar} alt="भारत मित्र" className="h-full w-full object-cover" />
        </button>
        <span className="font-hindi text-sm font-black text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)] select-none">भारत मित्र</span>
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

  return (
    <div className="fixed right-4 bottom-6 z-50 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3">
        <div className="relative">
          <img src={assistantAvatar} alt="भारत मित्र"
            className={`h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover ${isSpeaking ? "bharat-mitra-speaking" : ""}`}
          />
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent">
              <Volume2 className="h-2 w-2 text-accent-foreground" />
            </span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary-foreground">🇮🇳 भारत मित्र AI</h4>
          <p className="text-[10px] text-primary-foreground/60">
            {isAiLoading ? "सोच रही हूँ..." : safeWalkActive ? "🛡️ Safe Walk Active" : isSpeaking ? "बोल रही हूँ..." : "Powered by AI"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleSafeWalk}
            className={`rounded-full p-1.5 transition-colors ${safeWalkActive ? "bg-accent text-accent-foreground animate-pulse" : "text-primary-foreground/50 hover:text-primary-foreground"}`}
            title="Safe Walk">
            <PhoneCall className="h-4 w-4" />
          </button>
          <button onClick={() => addBotMessage(getLocalDeal())}
            className="rounded-full p-1.5 text-primary-foreground/50 hover:text-primary-foreground transition-colors" title="आज के डील्स">
            <Megaphone className="h-4 w-4" />
          </button>
          <button onClick={() => { setOpen(false); setActiveTab(null); window.speechSynthesis?.cancel(); }} className="text-primary-foreground/70 hover:text-primary-foreground">
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
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id}
            onClick={() => {
              if (tab.id === "safety") { activateSafetyMode(); return; }
              setActiveTab(activeTab === tab.id ? null : tab.id);
            }}
            className={`flex flex-1 items-center justify-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
              tab.id === "safety" ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : tab.id === "blood" ? activeTab === tab.id ? "border-b-2 border-destructive bg-destructive/5 text-destructive" : "text-destructive/60 hover:text-destructive"
              : activeTab === tab.id ? "border-b-2 border-accent bg-accent/5 text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3 w-3" />
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
                    {m.text}
                    {m.sender === "bot" && m.id !== "welcome" && (
                      <button
                        onClick={() => speakHindi(m.text)}
                        className="ml-2 inline-flex items-center text-muted-foreground hover:text-accent transition-colors"
                        title="सुनें"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
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
                  className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent-foreground transition-colors hover:bg-accent/20">
                  {faq.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="बॉस जी, कुछ भी पूछें..."
                className="h-9 text-sm" disabled={isAiLoading} />
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
            <Button onClick={handleComplaintSubmit} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <AlertTriangle className="mr-2 h-4 w-4" /> शिकायत भेजें
            </Button>
            {complaintSubmitted && (
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-center text-sm text-accent-foreground">
                ✅ आपकी शिकायत सफलतापूर्वक दर्ज हो गई है!
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
