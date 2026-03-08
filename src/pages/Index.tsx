import { useState, useMemo } from "react";
import { Search, MapPin, Store, ShoppingBag, Users, Mail, Building, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleShops, shopCategories, categoryIcons } from "@/data/sampleShops";
import ShopCard from "@/components/ShopCard";
import AppHeader from "@/components/AppHeader";
import { Link } from "react-router-dom";

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);

  const filteredShops = useMemo(() => {
    return sampleShops.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nameHindi.includes(search) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase()) ||
        s.pincode.includes(search);
      const matchCategory = !selectedCategory || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  const handleLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false)
      );
    }
  };

  // Show top 8 categories as icon cards
  const topCategories = shopCategories.slice(0, 8);

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative z-10 overflow-hidden bg-gradient-to-b from-primary via-primary to-[hsl(240,100%,18%)] py-16 text-center">
        {/* Ashoka Chakra overlay */}
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
          <p className="mb-8 text-sm text-primary-foreground/60">
            Connecting 1.4 Billion Indians to their local shopkeepers — digitally.
          </p>

          {/* Search bar */}
          <div className="mx-auto flex max-w-xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shops, products, services..."
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-10 text-center">
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

      {/* Browse by Category - Icon Cards */}
      <section className="relative z-10 bg-background py-8">
        <div className="container mx-auto px-4">
          <h3 className="mb-5 text-xl font-bold text-foreground">Browse by Category</h3>
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
          {/* All categories pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === "" ? "default" : "outline"}
              onClick={() => setSelectedCategory("")}
            >
              All
            </Button>
            {shopCategories.slice(8).map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
              >
                {categoryIcons[cat] || "🏪"} {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Shop listings */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h3 className="mb-1 text-xl font-bold text-foreground">
          Nearby Shops <span className="font-hindi text-base font-normal text-muted-foreground">• आपके नज़दीकी दुकानें</span>
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">Within 10 km • Risali, Bhilai Area</p>

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
            <p className="text-sm text-muted-foreground">Try a different search or category</p>
          </div>
        )}
      </main>

      {/* Footer - 3 column navy */}
      <footer className="relative z-10 bg-primary py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">🇮🇳</p>
              <h4 className="text-lg font-bold text-primary-foreground">Mera Bharat Dukaan</h4>
              <p className="mt-2 text-sm text-primary-foreground/60">
                A Digital India initiative connecting local shopkeepers directly with customers. Zero commission. 100% desi.
              </p>
            </div>
            {/* Quick Links */}
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">Quick Links</h5>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground">Home</Link>
                <Link to="/merchant" className="text-primary-foreground/70 hover:text-primary-foreground">Register Your Shop</Link>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground">Terms & Conditions</Link>
                <Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground">Help & Support</Link>
              </div>
            </div>
            {/* Support */}
            <div>
              <h5 className="mb-3 font-bold text-primary-foreground">Support</h5>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <a href="mailto:helpline.bharatdukaan@gmail.com" className="hover:text-primary-foreground">
                  helpline.bharatdukaan@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="tiranga-stripe mt-8 h-1 w-full rounded-full" />
          <p className="mt-4 text-center text-sm text-primary-foreground/50">
            © 2026 Mera Bharat Dukaan. Made with ❤️ in India.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
