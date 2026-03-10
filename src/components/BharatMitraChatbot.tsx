import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const FAQ_BUTTONS = [
  {
    label: "दुकान कैसे जोड़ें?",
    answer:
      "अपना प्रोफाइल बनाएं, 'Add Shop' पर क्लिक करें और फोटो डालें। यह फ्री है!",
  },
  {
    label: "प्रीमियम प्लान के क्या फायदे हैं?",
    answer:
      "1. आपकी दुकान सबसे ऊपर दिखेगी। 2. 'Verified' टिक मिलेगा। 3. विज्ञापन के जरिए ज्यादा ग्राहक आएंगे।",
  },
  {
    label: "पेमेंट सुरक्षित है या नहीं?",
    answer:
      "पूरी तरह सुरक्षित! हम भारत सरकार (MSME) नियमों का पालन करते हैं। आप सीधे QR स्कैन करके पेमेंट स्क्रीनशॉट भेज सकते हैं।",
  },
  {
    label: "क्या ग्राहक से कमीशन लिया जाता है?",
    answer:
      "बिल्कुल नहीं! भारत दुकान 0% कमीशन पर काम करता है। ग्राहक और दुकानदार सीधे बात करते हैं।",
  },
  {
    label: "मदद चाहिए?",
    answer:
      "हमारी टीम 24 घंटे उपलब्ध है। आप helpline.bharatdukaan@gmail.com पर ईमेल करें।",
  },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "bot",
  text: "नमस्ते! 🙏 भारत दुकान में आपका स्वागत है। यहाँ अपनी दुकान जोड़ना और ग्राहकों को ढूंढना बिल्कुल मुफ्त (FREE) है! क्या आप अपनी दुकान आज ही डिजिटल बनाना चाहते हैं?",
};

const PAYMENT_KEYWORDS = ["पैसे", "fees", "payment", "pay", "charge", "cost", "price", "कीमत", "पेमेंट", "चार्ज"];

const getPaymentResponse = (): string =>
  "नहीं, ऐप का इस्तेमाल और बेसिक लिस्टिंग पूरी तरह फ्री है। लेकिन अगर आप चाहते हैं कि आपकी दुकान शहर में सबसे ऊपर (TOP) दिखे और हम आपकी दुकान का विज्ञापन (Advertising) करें, तो आप हमारा 'प्रीमियम प्लान' (मात्र ₹3 प्रतिदिन) ले सकते हैं। इससे आपको 10 गुना ज्यादा ग्राहक मिलेंगे!";

const BharatMitraChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg transition-transform hover:scale-110"
        aria-label="Open Bharat Mitra Chat"
      >
        <MessageCircle className="h-6 w-6 text-accent-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3">
        <div>
          <h4 className="text-sm font-bold text-primary-foreground">🇮🇳 भारत मित्र</h4>
          <p className="text-[10px] text-primary-foreground/60">Bharat Dukaan Official</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
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
  );
};

export default BharatMitraChatbot;
