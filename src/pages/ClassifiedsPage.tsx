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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, SlidersHorizontal, Plus, X, MapPin, ChevronLeft, ChevronRight, MessageCircle, Phone, ShieldCheck, HeartHandshake, Eye } from "lucide-react";

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

const conditionLabel = (condition?: string) => {
  const labels: Record<string, string> = {
    new: "Brand new",
    "like-new": "Like new",
    used: "Good used condition",
    old: "Old but usable",
  };
  return labels[condition || ""] || condition || "Used item";
};

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
  const [selectedAd, setSelectedAd] = useState<ClassifiedAd | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

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
  const selectedPhotos = selectedAd?.photos?.filter(Boolean) || [];

  const openAd = (ad: ClassifiedAd) => {
    setSelectedAd(ad);
    setActivePhoto(0);
    setShowNumber(false);
    setChatMessage(`Hi, I am interested in your ${ad.title}. Is it still available?`);
  };

  const nextPhoto = () => setActivePhoto(i => selectedPhotos.length ? (i + 1) % selectedPhotos.length : 0);
  const prevPhoto = () => setActivePhoto(i => selectedPhotos.length ? (i - 1 + selectedPhotos.length) % selectedPhotos.length : 0);

  const startChat = async () => {
    if (!user || !selectedAd) return;
    if (selectedAd.user_id === user.id) { toast.info("This is your own listing."); return; }
    const message = chatMessage.trim() || `Hi, I am interested in your ${selectedAd.title}.`;
    const { data: existing } = await supabase.from("classified_conversations" as any)
      .select("id").eq("classified_id", selectedAd.id).eq("buyer_id", user.id).eq("seller_id", selectedAd.user_id).maybeSingle();
    const existingConversation = existing as { id?: string } | null;
    const createdConversation = existingConversation?.id ? null : (await supabase.from("classified_conversations" as any).insert({
      classified_id: selectedAd.id, buyer_id: user.id, seller_id: selectedAd.user_id,
    }).select("id").single()).data as { id?: string } | null;
    const conversationId = existingConversation?.id || createdConversation?.id;
    if (!conversationId) { toast.error("Chat could not be started right now"); return; }
    const { error } = await supabase.from("classified_messages" as any).insert({ conversation_id: conversationId, sender_id: user.id, message });
    if (error) toast.error("Message not sent");
    else toast.success("Chat started with seller");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-3 py-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search used items — mobiles, bikes, furniture..."
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
        <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <h1 className="text-xl font-extrabold text-foreground">Buy & Sell Old Items</h1>
          <p className="mt-1 text-xs text-muted-foreground">Browse verified second-hand listings with photos, condition details, location, and seller chat.</p>
        </div>

        {/* Category Grid */}
        <ClassifiedsCategoryGrid
          selected={selectedCategory}
          onSelect={cat => setSelectedCategory(cat === selectedCategory ? null : cat)}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <div>
              <h2 className="text-base font-bold text-foreground">
                {selectedCategory ? selectedCategory : "Latest second-hand deals"}
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
          <ClassifiedsAdCard key={ad.id} ad={ad} isFeatured={idx < 2} onOpen={() => openAd(ad)} />
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

      <Dialog open={!!selectedAd} onOpenChange={open => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto p-0">
          {selectedAd && (
            <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
              <div className="bg-muted/50 p-3 md:p-5">
                <div
                  className="relative aspect-square overflow-hidden rounded-lg bg-card md:aspect-[4/3]"
                  onTouchStart={event => ((event.currentTarget.dataset.touchX = String(event.touches[0].clientX)))}
                  onTouchEnd={event => {
                    const start = Number(event.currentTarget.dataset.touchX || 0);
                    const delta = event.changedTouches[0].clientX - start;
                    if (Math.abs(delta) > 40) delta < 0 ? nextPhoto() : prevPhoto();
                  }}
                >
                  {selectedPhotos.length ? (
                    <img src={selectedPhotos[activePhoto]} alt={selectedAd.title} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo available</div>
                  )}
                  {selectedPhotos.length > 1 && (
                    <>
                      <Button size="icon" variant="secondary" className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={prevPhoto}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={nextPhoto}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {selectedPhotos.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {selectedPhotos.map((photo, index) => (
                      <button key={photo + index} onClick={() => setActivePhoto(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${index === activePhoto ? "border-accent" : "border-border"}`}>
                        <img src={photo} alt={`${selectedAd.title} ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5 p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="text-left text-2xl font-extrabold leading-tight">{selectedAd.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-3xl font-extrabold text-foreground">₹{(selectedAd.price ?? 0).toLocaleString("en-IN")}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {conditionLabel(selectedAd.condition)}</Badge>
                    {selectedAd.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedAd.city}</span>}
                    <span>{new Date(selectedAd.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>

                <section className="space-y-2 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><Eye className="h-4 w-4 text-accent" /> Item Description & Condition</h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {selectedAd.description?.trim() || "Seller has not added a detailed description yet. Please use chat to ask about usage, age, defects, bill, warranty, and pickup details."}
                  </p>
                </section>

                <section className="space-y-3 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><HeartHandshake className="h-4 w-4 text-accent" /> Contact Seller</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => setShowNumber(true)} className="h-11">
                      <Phone className="h-4 w-4" /> {showNumber ? (selectedAd.contact_phone || "Number unavailable") : "Show Number"}
                    </Button>
                    <Button onClick={startChat} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                      <MessageCircle className="h-4 w-4" /> Chat with Seller
                    </Button>
                  </div>
                  <Textarea value={chatMessage} onChange={e => setChatMessage(e.target.value)} rows={3} className="resize-none" placeholder="Write a message to the seller" />
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassifiedsPage;
