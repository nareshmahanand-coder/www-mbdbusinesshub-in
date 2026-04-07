import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import ClassifiedsCategoryGrid from "@/components/classifieds/CategoryGrid";
import ClassifiedsAdCard from "@/components/classifieds/AdCard";
import ClassifiedsPostDialog from "@/components/classifieds/PostDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, Plus, X, MapPin } from "lucide-react";

export interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  condition: string;
  contact_phone: string;
  photos: string[];
  is_sold: boolean;
  created_at: string;
  user_id: string;
}

const cities = ["All", "Bhilai", "Durg", "Raipur", "Bilaspur", "Korba", "Rajnandgaon"];

const ClassifiedsPage = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 500000]);

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from("classifieds")
      .select("*").eq("is_sold", false).order("created_at", { ascending: false });
    if (data) setAds(data as ClassifiedAd[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return ads.filter(a => {
      const q = search.toLowerCase();
      const matchesSearch = !search || a.title?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q);
      const matchesCategory = !selectedCategory || a.category === selectedCategory;
      const matchesCity = cityFilter === "All" || a.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchesPrice = (a.price ?? 0) >= priceRange[0] && (a.price ?? 0) <= priceRange[1];
      return matchesSearch && matchesCategory && matchesCity && matchesPrice;
    });
  }, [ads, search, selectedCategory, cityFilter, priceRange]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setCityFilter("All");
    setPriceRange([0, 500000]);
    setSearch("");
  };

  const hasActiveFilters = selectedCategory || cityFilter !== "All" || priceRange[0] > 0 || priceRange[1] < 500000;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-3 py-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोजें — Cars, Mobiles, Furniture..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="container mx-auto px-3 pb-3 space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Filters</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Price: ₹{priceRange[0].toLocaleString("en-IN")} – ₹{priceRange[1].toLocaleString("en-IN")}
                </label>
                <Slider
                  min={0} max={500000} step={5000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-3 py-4">
        {/* Category Grid */}
        <ClassifiedsCategoryGrid
          selected={selectedCategory}
          onSelect={cat => setSelectedCategory(cat === selectedCategory ? null : cat)}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {selectedCategory ? selectedCategory : "Fresh Recommendations"}
            </h2>
            <p className="text-xs text-muted-foreground">{filtered.length} ads found</p>
          </div>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-xs text-accent font-medium">
              View All
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">कोई विज्ञापन नहीं मिला</p>
            <p className="text-xs text-muted-foreground mt-1">Try changing your filters or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((ad, idx) => (
              <ClassifiedsAdCard key={ad.id} ad={ad} isFeatured={idx < 2} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Sell Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-full h-12 px-7 bg-accent text-accent-foreground shadow-lg shadow-accent/30 text-sm font-bold hover:bg-accent/90 active:scale-95 transition-transform"
        >
          <Plus className="h-5 w-5 mr-1.5" /> Sell
        </Button>
      </div>

      {/* Post Ad Dialog */}
      <ClassifiedsPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPosted={loadAds}
      />
    </div>
  );
};

export default ClassifiedsPage;
