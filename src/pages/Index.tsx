import { useState, useMemo } from "react";
import { Search, MapPin, Store, ShoppingBag, Users, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleShops, shopCategories } from "@/data/sampleShops";
import ShopCard from "@/components/ShopCard";
import AppHeader from "@/components/AppHeader";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

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

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative z-10 bg-primary py-12 text-center">
        <div className="container mx-auto px-4">
          <img src={logo} alt="Mera Bharat Dukaan" className="mx-auto mb-4 h-24 w-24 rounded-full shadow-lg border-4 border-primary-foreground/20 object-cover" />
          <h2 className="mb-1 text-3xl font-extrabold text-primary-foreground">
            अपनी दुकान, अपना भारत
          </h2>
          <p className="mb-1 text-lg font-semibold text-primary-foreground/80">
            Mera Bharat Dukaan
          </p>
          <p className="mb-6 text-sm text-primary-foreground/60 font-hindi">
            सत्यमेव जयते • 0% Commission • Direct to Merchant
          </p>

          {/* Search bar */}
          <div className="mx-auto flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shops, category, or pincode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-primary-foreground pl-10 text-foreground border-0 shadow-md"
              />
            </div>
            <Button
              onClick={handleLocationAccess}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-md"
            >
              <MapPin className="mr-1 h-4 w-4" />
              {locationGranted ? "Located" : "Near Me"}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-b bg-card py-6">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-8 px-4 text-center">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-saffron" />
            <div>
              <p className="text-xl font-bold text-foreground">4+</p>
              <p className="text-xs text-muted-foreground">Shops Listed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-green-india" />
            <div>
              <p className="text-xl font-bold text-foreground">100+</p>
              <p className="text-xs text-muted-foreground">Happy Customers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">0%</p>
              <p className="text-xs text-muted-foreground">Commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="relative z-10 bg-card py-4">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Browse Categories</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === "" ? "default" : "outline"}
              onClick={() => setSelectedCategory("")}
            >
              All
            </Button>
            {shopCategories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Shop listings */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <h3 className="mb-1 text-xl font-bold text-foreground">
          Shops Near You <span className="font-hindi text-base font-normal text-muted-foreground">• आपके नज़दीकी दुकानें</span>
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

      {/* Footer */}
      <footer className="relative z-10 bg-primary py-8 text-center">
        <div className="tiranga-stripe mb-4 h-1 w-full" />
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground underline-offset-2 hover:underline">
              Terms & Conditions
            </Link>
            <span className="text-primary-foreground/30">|</span>
            <Link to="/help" className="text-primary-foreground/80 hover:text-primary-foreground underline-offset-2 hover:underline">
              Help & Support
            </Link>
          </div>
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-primary-foreground/70">
            <Mail className="h-4 w-4" />
            <a href="mailto:helpline.bharatdukaan@gmail.com" className="hover:text-primary-foreground underline-offset-2 hover:underline">
              helpline.bharatdukaan@gmail.com
            </a>
          </div>
          <p className="text-sm text-primary-foreground/70">
            © 2026 Mera Bharat Dukaan • <span className="font-hindi">सत्यमेव जयते</span>
          </p>
          <p className="mt-1 text-xs text-primary-foreground/50">Made in India 🇮🇳 with ❤️</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
