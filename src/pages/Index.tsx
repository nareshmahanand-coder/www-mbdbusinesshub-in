import { useState, useMemo } from "react";
import { Search, MapPin, Store, Mail, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleShops, shopCategories, categoryIcons, categorySections } from "@/data/sampleShops";
import ShopCard from "@/components/ShopCard";
import AppHeader from "@/components/AppHeader";
import HeroCarousel from "@/components/HeroCarousel";
import { Link } from "react-router-dom";

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const filteredShops = useMemo(() => {
    return sampleShops.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.nameHindi.includes(search) ||
        s.category.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.pincode.includes(search) ||
        s.description.toLowerCase().includes(q);
      const matchCategory = !selectedCategory || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  // Also filter categories in search
  const filteredCategories = useMemo(() => {
    if (!search) return shopCategories;
    const q = search.toLowerCase();
    return shopCategories.filter((c) => c.toLowerCase().includes(q));
  }, [search]);

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

  // Top 8 categories for quick access
  const topCategories = shopCategories.slice(0, 8);

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative z-10 overflow-hidden bg-gradient-to-b from-primary via-primary to-[hsl(240,100%,18%)] py-12 text-center">
        <div className="tiranga-wave pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
          <span className="text-[40vw] leading-none text-primary-foreground">☸</span>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-2 inline-block rounded-full bg-primary-foreground/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
            <span className="mr-1">🇮🇳</span> A Digital India Initiative
          </div>

          <h2 className="font-hindi mb-2 text-4xl font-extrabold text-primary-foreground md:text-5xl">
            मेरा भारत दुकान
          </h2>
          <p className="mb-1 text-lg font-bold text-primary-foreground/90 md:text-xl">
            Your Neighbourhood. Your Shops. Zero Commission.
          </p>
          <p className="mb-6 text-sm text-primary-foreground/60">
            Connecting 1.4 Billion Indians to their local shopkeepers — digitally.
          </p>

          {/* Carousel */}
          <div className="mx-auto max-w-3xl mb-8">
            <HeroCarousel />
          </div>

          {/* Global Search Bar */}
          <div className="mx-auto flex max-w-xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shops, services, insurance, mechanic... / खोजें..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl border-0 bg-primary-foreground pl-10 text-foreground shadow-lg"
              />
            </div>
            <Button
              onClick={handleLocationAccess}
              className="h-12 rounded-xl bg-accent px-6 text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg text-base"
            >
              <MapPin className="mr-1 h-4 w-4" />
              {locationGranted ? "Located" : "Near Me"}
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 text-center">
            <div>
              <p className="text-3xl font-extrabold text-accent">10,000+</p>
              <p className="text-xs text-primary-foreground/60">Shops Listed</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-accent">500+</p>
              <p className="text-xs text-primary-foreground/60">Cities</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-accent">0%</p>
              <p className="text-xs text-primary-foreground/60">Commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="relative z-10 bg-background py-8">
        <div className="container mx-auto px-4">
          <h3 className="mb-5 text-xl font-bold text-foreground">
            Browse by Category <span className="font-hindi text-base font-normal text-muted-foreground">• श्रेणियाँ</span>
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

          {/* Clear filter */}
          {selectedCategory && (
            <div className="mt-4">
              <Button size="sm" variant="destructive" onClick={() => setSelectedCategory("")}>
                ✕ Clear Filter: {selectedCategory}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Shop listings */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h3 className="mb-1 text-xl font-bold text-foreground">
          {selectedCategory || "All"} Shops{" "}
          <span className="font-hindi text-base font-normal text-muted-foreground">• आपके नज़दीकी दुकानें</span>
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {filteredShops.length} results found {search && `for "${search}"`}
        </p>

        {filteredShops.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">No shops found</p>
            <p className="font-hindi text-sm text-muted-foreground">
              कोई दुकान नहीं मिली। कृपया अलग खोज या श्रेणी आज़माएं।
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Use 'Other / अन्य' category to list any unlisted service.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-primary py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">🇮🇳</p>
              <h4 className="text-lg font-bold text-primary-foreground">Mera Bharat Dukaan</h4>
              <p className="mt-2 text-sm text-primary-foreground/60">
                A Digital India initiative connecting local shopkeepers directly with customers. Zero commission. 100% desi.
              </p>
              <p className="mt-2 text-xs text-primary-foreground/40">Udyam Registered Business</p>
              {/* Atmanirbhar Bharat badge */}
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                <span className="text-sm">🇮🇳</span>
                <span className="text-[10px] font-bold text-accent">आत्मनिर्भर भारत • Atmanirbhar Bharat</span>
              </div>
            </div>
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">Quick Links</h5>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground">Home</Link>
                <Link to="/merchant" className="text-primary-foreground/70 hover:text-primary-foreground">Register Your Shop</Link>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground">Terms & Conditions</Link>
                <Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground">
                  <HelpCircle className="mr-1 inline h-3 w-3" />Help & Support
                </Link>
              </div>
            </div>
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">Support</h5>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <a href="mailto:helpline.bharatdukaan@gmail.com" className="hover:text-primary-foreground">
                  helpline.bharatdukaan@gmail.com
                </a>
              </div>
              <p className="mt-3 text-xs text-primary-foreground/40">Official Support • Bharat Dukaan</p>
            </div>
          </div>
          <div className="tiranga-stripe mt-8 h-1 w-full rounded-full" />
          
          {/* Digital India & Staff Access */}
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1">
                <span className="text-sm">🏛️</span>
                <span className="text-[10px] font-semibold text-primary-foreground/70">Digital India Initiative</span>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded border border-primary-foreground/15 px-3 py-1 text-[10px] text-primary-foreground/40 transition-colors hover:text-primary-foreground/60"
            >
              <Shield className="h-3 w-3" />
              Staff Access / System
            </Link>
          </div>
          
          <p className="mt-3 text-center text-sm text-primary-foreground/50">
            © 2026 Mera Bharat Dukaan. Made with ❤️ in India. Udyam Registered Business.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
