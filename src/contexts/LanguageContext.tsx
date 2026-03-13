import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "hi";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  "home": { en: "Home", hi: "होम" },
  "merchant_portal": { en: "Merchant Portal", hi: "व्यापारी पोर्टल" },
  "help_desk": { en: "Help Desk", hi: "सहायता केंद्र" },
  "official_login": { en: "Official Login", hi: "आधिकारिक लॉगिन" },
  "login": { en: "Login", hi: "लॉगिन" },
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
  "nearby_shops": { en: "आपके नज़दीकी दुकानें", hi: "आपके नज़दीकी दुकानें" },
  "results_found": { en: "results found", hi: "परिणाम मिले" },
  "for": { en: "for", hi: "के लिए" },
  "no_shops_found": { en: "No shops found", hi: "कोई दुकान नहीं मिली" },
  "no_shops_msg": { en: "कोई दुकान नहीं मिली। कृपया अलग खोज या श्रेणी आज़माएं।", hi: "कोई दुकान नहीं मिली। कृपया अलग खोज या श्रेणी आज़माएं।" },
  "clear_filter": { en: "Clear Filter", hi: "फ़िल्टर हटाएं" },
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

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  toggleLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = () => setLang((prev) => (prev === "en" ? "hi" : "en"));

  const t = (key: string) => translations[key]?.[lang] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
