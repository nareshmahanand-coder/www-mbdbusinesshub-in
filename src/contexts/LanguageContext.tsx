import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { translatePhrase } from "@/i18n";
import { startAutoTranslate, stopAutoTranslate } from "@/lib/uiAutoTranslate";



type Lang = "en" | "hi";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = "mbd-lang";

const translations: Record<string, Record<Lang, string>> = {
  // Navigation / header
  "home": { en: "Home", hi: "होम" },
  "merchant_portal": { en: "Merchant Portal", hi: "व्यापारी पोर्टल" },
  "agent_portal": { en: "Agent Portal", hi: "एजेंट पोर्टल" },
  "coordinator_portal": { en: "Coordinator Portal", hi: "कोऑर्डिनेटर पोर्टल" },
  "golden_merchant": { en: "Golden Merchant", hi: "गोल्डन मर्चेंट" },
  "premium_merchant": { en: "Premium Merchant", hi: "प्रीमियम मर्चेंट" },
  "business_billing": { en: "Business Billing", hi: "बिज़नेस बिलिंग" },
  "help_desk": { en: "Help Desk", hi: "सहायता केंद्र" },
  "live_meeting": { en: "Live Meeting / Zoom Webinar", hi: "लाइव मीटिंग / ज़ूम वेबिनार" },
  "dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "my_profile": { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  "settings": { en: "Settings", hi: "सेटिंग्स" },
  "logout": { en: "Logout", hi: "लॉगआउट" },
  "language": { en: "Language", hi: "भाषा" },
  "switch_to_hindi": { en: "हिंदी", hi: "हिंदी" },
  "switch_to_english": { en: "English", hi: "English" },

  // Auth
  "official_login": { en: "Login", hi: "लॉगिन" },
  "login": { en: "Login", hi: "लॉगिन" },
  "signup": { en: "Create Account", hi: "खाता बनाएं" },
  "email": { en: "Email", hi: "ईमेल" },
  "password": { en: "Password", hi: "पासवर्ड" },
  "mobile_number": { en: "Mobile Number", hi: "मोबाइल नंबर" },
  "full_name": { en: "Full Name", hi: "पूरा नाम" },
  "forgot_password": { en: "Forgot Password?", hi: "पासवर्ड भूल गए?" },

  // Home
  "digital_india_marketplace": { en: "Digital India Marketplace", hi: "डिजिटल इंडिया बाज़ार" },
  "search_placeholder": { en: "Search shops, services, insurance, mechanic... / खोजें...", hi: "दुकान, सेवाएँ, बीमा, मैकेनिक खोजें..." },
  "near_me": { en: "Near Me", hi: "मेरे पास" },
  "located": { en: "Located", hi: "स्थान मिला" },
  "shops_listed": { en: "Shops Listed", hi: "दुकानें सूचीबद्ध" },
  "cities": { en: "Cities", hi: "शहर" },
  "commission": { en: "Commission", hi: "कमीशन" },
  "browse_by_category": { en: "Browse by Category", hi: "श्रेणी के अनुसार खोजें" },
  "categories_hindi": { en: "श्रेणियाँ", hi: "श्रेणियाँ" },
  "all": { en: "All", hi: "सभी" },
  "shops": { en: "Shops", hi: "दुकानें" },
  "nearby_shops": { en: "Shops Near You", hi: "आपके नज़दीकी दुकानें" },
  "results_found": { en: "results found", hi: "परिणाम मिले" },
  "for": { en: "for", hi: "के लिए" },
  "no_shops_found": { en: "No shops found", hi: "कोई दुकान नहीं मिली" },
  "no_shops_msg": { en: "No shops found. Please try a different search or category.", hi: "कोई दुकान नहीं मिली। कृपया अलग खोज या श्रेणी आज़माएं।" },
  "clear_filter": { en: "Clear Filter", hi: "फ़िल्टर हटाएं" },
  "golden_merchant_ads": { en: "Golden Merchant Ads", hi: "गोल्डन मर्चेंट विज्ञापन" },

  // Common actions
  "save": { en: "Save", hi: "सेव करें" },
  "cancel": { en: "Cancel", hi: "रद्द करें" },
  "submit": { en: "Submit", hi: "जमा करें" },
  "back": { en: "Back", hi: "वापस जाएं" },
  "loading": { en: "Loading...", hi: "लोड हो रहा है..." },
  "view": { en: "View", hi: "देखें" },
  "call": { en: "Call", hi: "कॉल करें" },
  "whatsapp": { en: "WhatsApp", hi: "व्हाट्सएप" },
  "directions": { en: "Directions", hi: "रास्ता देखें" },
  "share": { en: "Share", hi: "शेयर करें" },
  "upload": { en: "Upload", hi: "अपलोड करें" },
  "choose_file": { en: "Choose File", hi: "फ़ाइल चुनें" },
  "gallery": { en: "Gallery", hi: "गैलरी" },
  "camera": { en: "Camera", hi: "कैमरा" },
  "wallet": { en: "Wallet", hi: "वॉलेट" },
  "withdraw": { en: "Withdraw", hi: "निकासी" },
  "pending": { en: "Pending", hi: "लंबित" },
  "approved": { en: "Approved", hi: "स्वीकृत" },
  "rejected": { en: "Rejected", hi: "अस्वीकृत" },
  "products": { en: "Products", hi: "उत्पाद" },
  "price": { en: "Price", hi: "कीमत" },
  "in_stock": { en: "In Stock", hi: "स्टॉक में" },
  "out_of_stock": { en: "Out of Stock", hi: "स्टॉक खत्म" },

  // Footer
  "quick_links": { en: "Quick Links", hi: "त्वरित लिंक" },
  "register_shop": { en: "Register Your Shop", hi: "अपनी दुकान रजिस्टर करें" },
  "terms": { en: "Terms & Conditions", hi: "नियम और शर्तें" },
  "help_support": { en: "Help & Support", hi: "सहायता" },
  "support": { en: "Support", hi: "सहायता" },
  "official_support": { en: "Official Support • Bharat Dukaan", hi: "आधिकारिक सहायता • भारत दुकान" },
  "staff_access": { en: "Staff Access / System", hi: "स्टाफ एक्सेस / सिस्टम" },
  "footer_desc": { en: "A Digital India initiative connecting local shopkeepers directly with customers. Zero commission. 100% desi.", hi: "एक डिजिटल इंडिया पहल जो स्थानीय दुकानदारों को सीधे ग्राहकों से जोड़ती है। शून्य कमीशन। 100% देसी।" },
  "digital_india_initiative": { en: "A Digital India Initiative", hi: "एक डिजिटल इंडिया पहल" },
  "tagline_1": { en: "Your Neighbourhood. Your Shops. Zero Commission.", hi: "आपका मोहल्ला। आपकी दुकानें। शून्य कमीशन।" },
  "tagline_2": { en: "Connecting 1.4 Billion Indians to their local shopkeepers — digitally.", hi: "1.4 अरब भारतीयों को उनके स्थानीय दुकानदारों से डिजिटल रूप से जोड़ रहे हैं।" },
  "copyright": { en: "© 2026 Mera Bharat Dukaan. Made with ❤️ in India.", hi: "© 2026 मेरा भारत दुकान। ❤️ से भारत में बनाया गया।" },
  "digital_india_badge": { en: "Digital India Initiative", hi: "डिजिटल इंडिया पहल" },
};

const readStoredLang = (): Lang => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "hi" || stored === "en" ? stored : "en";
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallback?: string) => fallback ?? key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage may be unavailable (private mode / webview)
    }
    document.documentElement.lang = lang;
    startAutoTranslate(lang);
  }, [lang]);

  useEffect(() => () => stopAutoTranslate(), []);


  const value = useMemo<LanguageContextType>(() => ({
    lang,
    setLang: setLangState,
    toggleLang: () => setLangState((prev) => (prev === "en" ? "hi" : "en")),
    t: (key: string, fallback?: string) =>
      translations[key]?.[lang] ?? translatePhrase(key, lang) ?? fallback ?? key,
  }), [lang]);


  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
