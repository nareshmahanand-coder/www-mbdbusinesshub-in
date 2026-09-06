import Seo from "@/components/Seo";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, MapPin, Store, Mail, HelpCircle, ChevronDown, ChevronUp, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleShops, shopCategories, categoryIcons, categorySections, type Shop } from "@/data/sampleShops";
import { supabase } from "@/integrations/supabase/client";
import { matchesQuery } from "@/data/categoryFields";
import ShopCard from "@/components/ShopCard";
import AppHeader from "@/components/AppHeader";
import HeroCarousel from "@/components/HeroCarousel";
import NandaFarmSection from "@/components/NandaFarmSection";
import ShopMap from "@/components/ShopMap";
import GoldenMerchantVideoAds from "@/components/GoldenMerchantVideoAds";

import SuperAppNav from "@/components/SuperAppNav";
import AdminPinAccess from "@/components/AdminPinAccess";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { t, lang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [dbShops, setDbShops] = useState<Shop[]>([]);
  const recognitionRef = useRef<any>(null);

  // Live registered merchants — every new registration (free, premium, golden)
  // becomes searchable on the homepage instantly.
  useEffect(() => {
    let active = true;
    const loadRegisteredShops = async () => {
      const { data } = await supabase
        .from("merchant_profiles")
        .select("id, shop_name, shop_name_hindi, category, address, city, pincode, latitude, longitude, whatsapp, phone, photos, is_verified, is_premium, is_big_merchant, description, service_tags")
        .eq("access_status", "active")
        .order("is_big_merchant", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (!active || !data) return;
      setDbShops(
        data.map((row: any) => ({
          id: row.id,
          name: row.shop_name ?? "",
          nameHindi: row.shop_name_hindi ?? "",
          category: row.category ?? "Other",
          address: row.address ?? "",
          city: row.city ?? "",
          pincode: row.pincode ?? "",
          lat: row.latitude ?? 0,
          lng: row.longitude ?? 0,
          whatsapp: row.whatsapp ?? row.phone ?? "",
          phone: row.phone ?? row.whatsapp ?? "",
          photos: Array.isArray(row.photos) ? row.photos : [],
          verified: !!row.is_verified,
          premium: !!row.is_premium || !!row.is_big_merchant,
          rating: 0,
          reviewCount: 0,
          reviews: [],
          description: [row.description ?? "", (row.service_tags ?? []).join(", ")].filter(Boolean).join(" • "),
        })),
      );
    };
    void loadRegisteredShops();

    const channel = supabase
      .channel("home-merchants")
      .on("postgres_changes", { event: "*", schema: "public", table: "merchant_profiles" }, () => { void loadRegisteredShops(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === "hi" ? "आपका ब्राउज़र वॉइस सर्च सपोर्ट नहीं करता" : "Your browser does not support voice search");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();

    setIsListening(true);
  }, [lang]);

  const filteredShops = useMemo(() => {
    const allShops = [...sampleShops, ...dbShops];
    const filtered = allShops.filter((s) => {
      const matchSearch =
        !search ||
        matchesQuery(search, [s.name, s.nameHindi, s.category, s.address, s.city, s.pincode, s.description]);
      const matchCategory = !selectedCategory || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });

    // Premium Priority: premium+verified shops first, then sort by rating as proxy for distance
    return filtered.sort((a, b) => {
      // Nanda Agro Farm flagship units are pinned to the absolute top
      const aFlag = a.flagship ? 1 : 0;
      const bFlag = b.flagship ? 1 : 0;
      if (bFlag !== aFlag) return bFlag - aFlag;
      const aPremium = a.premium && a.verified ? 1 : 0;
      const bPremium = b.premium && b.verified ? 1 : 0;
      if (bPremium !== aPremium) return bPremium - aPremium;
      // Then verified shops
      const aVerified = a.verified ? 1 : 0;
      const bVerified = b.verified ? 1 : 0;
      if (bVerified !== aVerified) return bVerified - aVerified;
      // Then by rating (higher first) as distance proxy
      return b.rating - a.rating;
    });
  }, [search, selectedCategory, dbShops]);

  const filteredCategories = useMemo(() => {
    const customCategories = dbShops.map((s) => s.category).filter(Boolean);
    const all = [...new Set([...shopCategories, ...customCategories])];
    if (!search) return all;
    return all.filter((c) => matchesQuery(search, [c]));
  }, [search, dbShops]);

  const handleLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false)
      );
    }
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const topCategories = shopCategories.slice(0, 8);

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <Seo
        title="Mera Bharat Dukaan — Local Shops, Farmers & Services Near You"
        description="अपने शहर की सत्यापित दुकानें, किसान और सेवाएँ खोजें। 0% कमीशन पर सीधे WhatsApp या कॉल से ऑर्डर करें — Mera Bharat Dukaan."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Mera Bharat Dukaan",
          url: "https://shop.mbdbusinesshub.in",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://shop.mbdbusinesshub.in/services?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <AppHeader />
      <SuperAppNav />



      {/* Hero */}
      <section className="relative z-10 overflow-hidden bg-gradient-to-b from-primary via-primary to-[hsl(240,100%,18%)] py-12 text-center">
        <div className="tiranga-wave pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <span className="text-[40vw] leading-none text-primary-foreground">☸</span>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-2 inline-block rounded-full bg-primary-foreground/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
            <span className="mr-1">🇮🇳</span> {t("digital_india_initiative")}
          </div>

          <h2 className="font-hindi mb-2 text-4xl font-extrabold text-primary-foreground md:text-5xl">
            मेरा भारत दुकान
          </h2>
          <p className="mb-1 text-lg font-bold text-primary-foreground/90 md:text-xl">
            {t("tagline_1")}
          </p>
          <p className="mb-6 text-sm text-primary-foreground/60">
            {t("tagline_2")}
          </p>

          <div className="mx-auto max-w-3xl mb-8">
            <HeroCarousel />
          </div>

          {/* Search Bar */}
          <div className="mx-auto flex max-w-xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl border-0 bg-primary-foreground pl-10 pr-12 text-foreground shadow-lg"
              />
              <button
                onClick={startListening}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-110 active:scale-95"
                title="भारत मित्र से पूछें"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleLocationAccess}
              className="h-12 rounded-xl bg-accent px-6 text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg text-base"
            >
              <MapPin className="mr-1 h-4 w-4" />
              {locationGranted ? t("located") : t("near_me")}
            </Button>
          </div>

          {/* Voice Listening Overlay */}
          {isListening && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={stopListening}>
              <div className="flex flex-col items-center gap-6 rounded-2xl bg-card p-10 shadow-2xl border border-border animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-24 w-24 animate-ping rounded-full bg-accent/30" />
                  <span className="absolute h-20 w-20 animate-pulse rounded-full bg-accent/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                    <Mic className="h-8 w-8" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-hindi text-xl font-bold text-foreground">सुन रही हूँ... बोलिये</p>
                  <p className="mt-1 text-sm text-muted-foreground font-hindi">भारत मित्र से पूछें</p>
                </div>
                <button
                  onClick={stopListening}
                  className="rounded-full border border-border px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t("lang") === "hi" ? "बंद करें" : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 text-center">
            <div>
              <p className="text-3xl font-extrabold text-accent">10,000+</p>
              <p className="text-xs text-primary-foreground/60">{t("shops_listed")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-accent">500+</p>
              <p className="text-xs text-primary-foreground/60">{t("cities")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-accent">0%</p>
              <p className="text-xs text-primary-foreground/60">{t("commission")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Golden Merchant video advertisements */}
      <GoldenMerchantVideoAds />

      {/* Nanda Farm Featured Section */}
      <NandaFarmSection />


      {/* Quick Categories */}
      <section className="relative z-10 bg-background py-8">
        <div className="container mx-auto px-4">
          <h3 className="mb-5 text-xl font-bold text-foreground">
            {t("browse_by_category")} <span className="font-hindi text-base font-normal text-muted-foreground">• {t("categories_hindi")}</span>
          </h3>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {topCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:shadow-md ${
                  selectedCategory === cat
                    ? "border-accent bg-accent/10 shadow-md"
                    : "border-border bg-card hover:border-accent/50"
                }`}
              >
                <span className="text-2xl">{categoryIcons[cat] || "🏪"}</span>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{cat}</span>
              </button>
            ))}
          </div>

          {/* Sectioned Categories */}
          <div className="mt-6 space-y-3">
            {categorySections.map((section) => (
              <div key={section.sectionName} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => toggleSection(section.sectionName)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-bold text-foreground">
                    {section.sectionName}{" "}
                    <span className="font-hindi text-xs font-normal text-muted-foreground">
                      • {section.sectionNameHindi}
                    </span>
                  </span>
                  {expandedSections[section.sectionName] ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections[section.sectionName] && (
                  <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {section.categories
                      .filter((cat) => !search || cat.toLowerCase().includes(search.toLowerCase()))
                      .map((cat) => (
                        <Button
                          key={cat}
                          size="sm"
                          variant={selectedCategory === cat ? "default" : "outline"}
                          onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                          className="text-xs"
                        >
                          {categoryIcons[cat] || "🏪"} {cat}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-4">
              <Button size="sm" variant="destructive" onClick={() => setSelectedCategory("")}>
                ✕ {t("clear_filter")}: {selectedCategory}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Shop listings */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h3 className="mb-1 text-xl font-bold text-foreground">
          {selectedCategory || t("all")} {t("shops")}{" "}
          <span className="font-hindi text-base font-normal text-muted-foreground">• {t("nearby_shops")}</span>
        </h3>
        <p className="mb-2 text-sm text-muted-foreground">
          {filteredShops.length} {t("results_found")} {search && `${t("for")} "${search}"`}
        </p>
        {filteredShops.some(s => s.premium && s.verified) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
            <span className="text-lg">🇮🇳</span>
            <p className="font-hindi text-sm text-foreground">
              बॉस, मैंने आपके लिए <span className="font-bold text-accent">प्रीमियम दुकानें</span> सबसे ऊपर रख दी हैं। आप सीधे <span className="font-bold text-green-india">व्हाट्सएप</span> पर बात कर सकते हैं।
            </p>
          </div>
        )}

        {filteredShops.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t("no_shops_found")}</p>
            <p className="font-hindi text-sm text-muted-foreground">
              {t("no_shops_msg")}
            </p>
          </div>
        )}
      </main>

      {/* Shop Map — Registered Shops Only */}
      <ShopMap />

      {/* Footer */}
      <footer className="relative z-10 bg-primary py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">🇮🇳</p>
              <h4 className="text-lg font-bold text-primary-foreground">Mera Bharat Dukaan</h4>
              <p className="mt-2 text-sm text-primary-foreground/60">
                {t("footer_desc")}
              </p>
              {/* Atmanirbhar Bharat badge */}
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                <span className="text-sm">🇮🇳</span>
                <span className="text-[10px] font-bold text-accent">आत्मनिर्भर भारत • Atmanirbhar Bharat</span>
              </div>
            </div>
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">{t("quick_links")}</h5>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground">{t("home")}</Link>
                <Link to="/merchant" className="text-primary-foreground/70 hover:text-primary-foreground">{t("register_shop")}</Link>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground">{t("terms")}</Link>
                <Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground">
                  <HelpCircle className="mr-1 inline h-3 w-3" />{t("help_support")}
                </Link>
              </div>
            </div>
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">{t("support")}</h5>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <a href="mailto:helpline.bharatdukaan@gmail.com" className="hover:text-primary-foreground break-all">
                  helpline.bharatdukaan@gmail.com
                </a>
              </div>
              <a
                href="https://wa.me/919203645007?text=नमस्ते%20भारत%20दुकान%20हेल्प%20डेस्क%20🙏"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-[hsl(140,70%,70%)] hover:text-[hsl(140,80%,80%)]"
              >
                <span className="text-base">🟢</span>
                <span>WhatsApp: +91 9203645007</span>
              </a>
              <p className="mt-1 font-hindi text-[11px] text-primary-foreground/60">
                हेल्प डेस्क (केवल व्हाट्सएप मैसेज)
              </p>
              <p className="mt-1 font-hindi text-[10px] text-primary-foreground/40">
                कृपया कॉल न करें, केवल व्हाट्सएप सहायता।
              </p>
              <p className="mt-3 text-xs text-primary-foreground/40">{t("official_support")}</p>
            </div>
          </div>
          <div className="tiranga-stripe mt-8 h-1 w-full rounded-full" />
          
          {/* Digital India & Staff Access */}
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1">
                <span className="text-sm">🏛️</span>
                <span className="text-[10px] font-semibold text-primary-foreground/70">{t("digital_india_badge")}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between gap-2 text-sm text-primary-foreground/50">
            <span className="flex-1 text-center">{t("copyright")}</span>
            <AdminPinAccess className="text-[9px] text-primary-foreground/20 hover:text-primary-foreground/50 underline-offset-2 hover:underline" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
