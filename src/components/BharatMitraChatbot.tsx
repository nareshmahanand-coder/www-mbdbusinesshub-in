import { useState } from "react";
import { X, Send, HelpCircle, AlertTriangle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import assistantAvatar from "@/assets/assistant-avatar.png";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

type TabType = "help" | "complaint" | "services" | null;

const FAQ_BUTTONS = [
  {
    label: "दुकान कैसे जोड़ें?",
    answer: "अपना प्रोफाइल बनाएं, 'Add Shop' पर क्लिक करें और फोटो डालें। यह फ्री है!",
  },
  {
    label: "प्रीमियम प्लान के क्या फायदे हैं?",
    answer: "1. आपकी दुकान सबसे ऊपर दिखेगी। 2. 'Verified' टिक मिलेगा। 3. विज्ञापन के जरिए ज्यादा ग्राहक आएंगे।",
  },
  {
    label: "पेमेंट सुरक्षित है या नहीं?",
    answer: "पूरी तरह सुरक्षित! हम भारत सरकार (MSME) नियमों का पालन करते हैं। आप सीधे QR स्कैन करके पेमेंट स्क्रीनशॉट भेज सकते हैं।",
  },
  {
    label: "क्या ग्राहक से कमीशन लिया जाता है?",
    answer: "बिल्कुल नहीं! भारत दुकान 0% कमीशन पर काम करता है। ग्राहक और दुकानदार सीधे बात करते हैं।",
  },
  {
    label: "मदद चाहिए?",
    answer: "हमारी टीम 24 घंटे उपलब्ध है। आप helpline.bharatdukaan@gmail.com पर ईमेल करें।",
  },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: "नमस्ते! 🙏 भारत दुकान में आपका स्वागत है। बॉस, मैंने आपके लिए प्रीमियम दुकानें सबसे ऊपर रख दी हैं। आप सीधे व्हाट्सएप पर बात कर सकते हैं। नीचे दिए गए विकल्प चुनें:",
};

const PAYMENT_KEYWORDS = ["पैसे", "fees", "payment", "pay", "charge", "cost", "price", "कीमत", "पेमेंट", "चार्ज"];

const getPaymentResponse = (): string =>
  "नहीं, ऐप का इस्तेमाल और बेसिक लिस्टिंग पूरी तरह फ्री है। लेकिन अगर आप चाहते हैं कि आपकी दुकान शहर में सबसे ऊपर (TOP) दिखे और हम आपकी दुकान का विज्ञापन (Advertising) करें, तो आप हमारा 'प्रीमियम प्लान' (मात्र ₹3 प्रतिदिन) ले सकते हैं। इससे आपको 10 गुना ज्यादा ग्राहक मिलेंगे!";

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

  const addBotMessage = (text: string) => {
    const msg: ChatMessage = { id: `bot-${Date.now()}`, sender: "bot", text };
    setMessages((prev) => [...prev, msg]);
  };

  const addUserMessage = (text: string) => {
    const msg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text };
    setMessages((prev) => [...prev, msg]);
  };

  const handleFaq = (faq: (typeof FAQ_BUTTONS)[0]) => {
    addUserMessage(faq.label);
    setTimeout(() => addBotMessage(faq.answer), 400);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setInput("");
    const lower = trimmed.toLowerCase();
    const isPaymentQ = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
    setTimeout(() => {
      if (isPaymentQ) {
        addBotMessage(getPaymentResponse());
      } else {
        addBotMessage(
          "धन्यवाद! आपके सवाल के लिए कृपया नीचे दिए गए FAQ बटन देखें या helpline.bharatdukaan@gmail.com पर संपर्क करें। — Bharat Dukaan Official"
        );
      }
    }, 500);
  };

  const handleComplaintSubmit = () => {
    if (!complaintText.trim()) return;
    setComplaintSubmitted(true);
    setComplaintText("");
    setTimeout(() => setComplaintSubmitted(false), 4000);
  };

  // Closed state: avatar + persistent bubble on right side
  if (!open) {
    return (
      <div className="fixed right-4 top-1/3 z-50 flex flex-col items-end gap-2">
        {/* Persistent speech bubble */}
        <div className="relative rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg">
          नमस्ते! मैं आपकी क्या मदद कर सकती हूँ? 🙏
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-primary" />
        </div>
        {/* Avatar button */}
        <button
          onClick={() => setOpen(true)}
          className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary shadow-xl transition-transform hover:scale-110"
          aria-label="Open Bharat Mitra Chat"
        >
          <img src={assistantAvatar} alt="भारत मित्र Assistant" className="h-full w-full object-cover" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-24 z-50 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]">
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3">
        <img src={assistantAvatar} alt="भारत मित्र" className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary-foreground">🇮🇳 भारत मित्र</h4>
          <p className="text-[10px] text-primary-foreground/60">Bharat Dukaan Official Assistant</p>
        </div>
        <button onClick={() => { setOpen(false); setActiveTab(null); }} className="text-primary-foreground/70 hover:text-primary-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b border-border">
        {[
          { id: "help" as TabType, icon: HelpCircle, label: "मदद" },
          { id: "complaint" as TabType, icon: AlertTriangle, label: "शिकायत" },
          { id: "services" as TabType, icon: ShoppingBag, label: "सुविधाएँ" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary bg-primary/5 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
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
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
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
                placeholder="अपना सवाल पूछें..."
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
              <p className="text-xs text-muted-foreground">
                अपनी शिकायत लिखें। हमारी टीम 24 घंटे में जवाब देगी।
              </p>
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
                ✅ आपकी शिकायत सफलतापूर्वक दर्ज हो गई है! हम जल्द ही संपर्क करेंगे।
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
      </div>
    </div>
  );
};

export default BharatMitraChatbot;
