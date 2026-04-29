import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import ClassifiedsCategoryGrid from "@/components/classifieds/CategoryGrid";
import ClassifiedsAdCard from "@/components/classifieds/AdCard";
import ClassifiedsPostDialog from "@/components/classifieds/PostDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, SlidersHorizontal, Plus, X, MapPin, ChevronLeft, ChevronRight, MessageCircle, Phone, ShieldCheck, HeartHandshake, Eye, Home, ClipboardList, UserCircle, Archive, Trash2, Loader2, Navigation, Bell, CheckCircle2, Send, Lock } from "lucide-react";
import { City, State } from "country-state-city";
import { reverseGeocodeIndiaLocation, searchIndiaLocations } from "@/lib/googleLocation";

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

interface ClassifiedConversation {
  id: string;
  classified_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  archived_by?: string[];
}

interface ContactRequest {
  id: string;
  classified_id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending" | "approved" | "rejected";
  message: string;
  created_at: string;
}

interface ClassifiedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const topCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow", "Patna", "Bhopal"];
const petCategories = ["Pets", "Dogs", "Fishes & Aquarium", "Pet Food/Accessories"];
type LocationSuggestion = { name: string; label: string; type: string };
const locationKey = (value = "") => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const matchesLocation = (adCity = "", selectedLocation = "All") => {
  if (selectedLocation === "All") return true;
  const adTokens = locationKey(adCity);
  const selectedTokens = locationKey(selectedLocation);
  return adTokens.some(token => selectedTokens.includes(token)) || selectedTokens.some(token => adTokens.includes(token));
};
const indiaLocations = [
  ...topCities.map(city => ({ name: city, label: city, type: "Top City" })),
  ...State.getStatesOfCountry("IN").map(state => ({ name: state.name, label: state.name, type: "State" })),
  ...(City.getCitiesOfCountry("IN") ?? []).map(city => ({ name: city.name, label: `${city.name}, ${city.stateCode}`, type: "City" })),
] satisfies LocationSuggestion[];

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [activeSection, setActiveSection] = useState<"home" | "chats" | "myAds" | "account">("home");
  const [conversations, setConversations] = useState<ClassifiedConversation[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [activeConversation, setActiveConversation] = useState<ClassifiedConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ClassifiedMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [remoteLocationResults, setRemoteLocationResults] = useState<LocationSuggestion[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAds(); }, []);
  useEffect(() => { if (user) { loadConversations(); loadContactRequests(); } }, [user]);

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from("classifieds")
      .select("*").order("created_at", { ascending: false });
    if (data) setAds(data as ClassifiedAd[]);
    setLoading(false);
  };

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from("classified_conversations" as any)
      .select("*").order("last_message_at", { ascending: false });
    if (data) setConversations(data as unknown as ClassifiedConversation[]);
  };

  const loadContactRequests = async () => {
    if (!user) return;
    const { data } = await supabase.from("classified_contact_requests" as any)
      .select("*").order("created_at", { ascending: false });
    if (data) setContactRequests(data as unknown as ContactRequest[]);
  };

  const filtered = useMemo(() => {
    return ads.filter(a => {
      const q = search.toLowerCase();
      const matchesSearch = !search || a.title?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q);
      const matchesCategory = !selectedCategory || a.category === selectedCategory || (selectedCategory === "Pets" && petCategories.includes(a.category));
      const matchesCity = matchesLocation(a.city, cityFilter);
      const matchesPrice = (a.price ?? 0) >= priceRange[0] && (a.price ?? 0) <= priceRange[1];
      return !a.is_sold && matchesSearch && matchesCategory && matchesCity && matchesPrice;
    });
  }, [ads, search, selectedCategory, cityFilter, priceRange]);

  const myAds = useMemo(() => ads.filter(ad => ad.user_id === user?.id), [ads, user?.id]);
  const visibleConversations = useMemo(() => conversations.filter(c => user && !(c.archived_by || []).includes(user.id)), [conversations, user]);
  const sellerRequests = useMemo(() => contactRequests.filter(request => request.seller_id === user?.id), [contactRequests, user?.id]);
  const pendingSellerRequests = useMemo(() => sellerRequests.filter(request => request.status === "pending"), [sellerRequests]);
  const requestForSelectedAd = useMemo(() => selectedAd ? contactRequests.find(request => request.classified_id === selectedAd.id && request.buyer_id === user?.id) : undefined, [contactRequests, selectedAd, user?.id]);
  const isSelectedNumberApproved = requestForSelectedAd?.status === "approved";
  const locationResults = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return topCities.map(city => ({ name: city, label: city, type: "Top City" }));
    const localMatches = indiaLocations.filter(location => location.label.toLowerCase().includes(q) || location.name.toLowerCase().includes(q)).slice(0, 40);
    const seen = new Set<string>();
    return [...remoteLocationResults, ...localMatches].filter(location => {
      const key = location.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 60);
  }, [locationSearch, remoteLocationResults]);

  useEffect(() => {
    const query = locationSearch.trim();
    if (query.length < 2) {
      setRemoteLocationResults([]);
      setLocationSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLocationSearching(true);
      try {
        const results = await searchIndiaLocations(query);
        setRemoteLocationResults(results);
      } catch (error) {
        if (!controller.signal.aborted) setRemoteLocationResults([]);
      } finally {
        if (!controller.signal.aborted) setLocationSearching(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [locationSearch]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setCityFilter("All");
    setPriceRange([0, 500000]);
    setSearch("");
  };

  const chooseLocation = (location: string) => {
    setCityFilter(location);
    setLocationSearch(location === "All" ? "" : location);
    setLocationSearchOpen(false);
    setShowFilters(false);
    toast.success(location === "All" ? "Showing all India" : `Location set to ${location}`);
  };

  const updateLocationSearch = (value: string) => {
    setLocationSearch(value);
    setLocationSearchOpen(true);
    setCityFilter(value.trim() || "All");
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) { toast.error("GPS is not available on this device"); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude, longitude } = position.coords;
        const exactLocation = await reverseGeocodeIndiaLocation(latitude, longitude);
        chooseLocation(exactLocation);
      } catch {
        toast.error("Could not detect area name. Please search your location.");
      } finally {
        setLocationBusy(false);
      }
    }, () => { setLocationBusy(false); toast.error("Location permission denied"); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  const hasActiveFilters = selectedCategory || cityFilter !== "All" || priceRange[0] > 0 || priceRange[1] < 500000;
  const selectedPhotos = selectedAd?.photos?.filter(Boolean) || [];

  const openAd = (ad: ClassifiedAd) => {
    setSelectedAd(ad);
    setActivePhoto(0);
    setLightboxOpen(false);
    setChatMessage(`Hi, I am interested in your ${ad.title}. Is it still available?`);
  };

  const nextPhoto = () => setActivePhoto(i => selectedPhotos.length ? (i + 1) % selectedPhotos.length : 0);
  const prevPhoto = () => setActivePhoto(i => selectedPhotos.length ? (i - 1 + selectedPhotos.length) % selectedPhotos.length : 0);

  const startChatForAd = async (ad: ClassifiedAd, messageText?: string) => {
    if (!user) { toast.info("Please login to chat with the seller."); return; }
    if (ad.user_id === user.id) { toast.info("This is your own listing."); return; }
    const message = messageText?.trim() || `Hi, I am interested in your ${ad.title}.`;
    const { data: existing } = await supabase.from("classified_conversations" as any)
      .select("id").eq("classified_id", ad.id).eq("buyer_id", user.id).eq("seller_id", ad.user_id).maybeSingle();
    const existingConversation = existing as { id?: string } | null;
    const createdConversation = existingConversation?.id ? null : (await supabase.from("classified_conversations" as any).insert({
      classified_id: ad.id, buyer_id: user.id, seller_id: ad.user_id,
    }).select("id").single()).data as { id?: string } | null;
    const conversationId = existingConversation?.id || createdConversation?.id;
    if (!conversationId) { toast.error("Chat could not be started right now"); return; }
    const { error } = await supabase.from("classified_messages" as any).insert({ conversation_id: conversationId, sender_id: user.id, message });
    if (error) toast.error("Message not sent");
    else { toast.success("Chat started with seller"); await loadConversations(); setActiveSection("chats"); }
  };

  const requestSellerNumber = async (ad: ClassifiedAd) => {
    if (!user) { toast.info("Please login to request seller number."); return; }
    if (ad.user_id === user.id) { toast.info("This is your own listing."); return; }
    const existing = contactRequests.find(request => request.classified_id === ad.id && request.buyer_id === user.id);
    if (existing?.status === "approved") { toast.success("Seller approved your request. Number is visible now."); return; }
    if (existing?.status === "pending") { toast.info("Your request is already pending with the seller."); return; }
    const message = `Buyer is interested in ${ad.title} and requested your mobile number.`;
    const { error } = await supabase.from("classified_contact_requests" as any).insert({ classified_id: ad.id, buyer_id: user.id, seller_id: ad.user_id, message });
    if (error) toast.error("Could not send request");
    else { toast.success("Request sent to seller for approval"); await loadContactRequests(); await startChatForAd(ad, `Hi, I am interested in ${ad.title}. Please approve my number request if convenient.`); }
  };

  const updateContactRequest = async (request: ContactRequest, status: "approved" | "rejected") => {
    const { error } = await supabase.from("classified_contact_requests" as any).update({ status }).eq("id", request.id);
    if (error) toast.error("Could not update request");
    else { toast.success(status === "approved" ? "Mobile number request approved" : "Request rejected"); loadContactRequests(); }
  };

  const startChat = async () => {
    if (!selectedAd) return;
    await startChatForAd(selectedAd, chatMessage);
  };

  const updateAdSoldStatus = async (ad: ClassifiedAd) => {
    if (!user || ad.user_id !== user.id) { toast.error("Only the seller can update this ad"); return; }
    const { error } = await supabase.from("classifieds").update({ is_sold: true }).eq("id", ad.id).eq("user_id", user.id);
    if (error) toast.error("Could not mark as sold");
    else { toast.success("Marked as sold"); loadAds(); }
  };

  const deleteAd = async (ad: ClassifiedAd) => {
    if (!user || ad.user_id !== user.id) { toast.error("Only the seller can delete this ad"); return; }
    const { error } = await supabase.from("classifieds").delete().eq("id", ad.id).eq("user_id", user.id);
    if (error) toast.error("Could not delete ad");
    else { toast.success("Ad deleted"); setSelectedAd(null); loadAds(); }
  };

  const archiveConversation = async (conversation: ClassifiedConversation) => {
    if (!user) return;
    const archivedBy = Array.from(new Set([...(conversation.archived_by || []), user.id]));
    const { error } = await supabase.from("classified_conversations" as any).update({ archived_by: archivedBy }).eq("id", conversation.id);
    if (error) toast.error("Could not archive chat");
    else { toast.success("Chat archived"); loadConversations(); }
  };

  const deleteConversation = async (conversation: ClassifiedConversation) => {
    const { error } = await supabase.from("classified_conversations" as any).delete().eq("id", conversation.id);
    if (error) toast.error("Could not delete chat");
    else { toast.success("Chat deleted"); loadConversations(); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      {/* OLX-style Location + Search Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto flex items-start gap-2 px-3 pt-2">
          <div className="relative flex-1">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <Input
                ref={locationInputRef}
                value={locationSearch}
                onChange={e => updateLocationSearch(e.target.value)}
                onFocus={() => setLocationSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setLocationSearchOpen(false), 140)}
                onKeyDown={e => {
                  if (e.key === "Enter" && locationSearch.trim()) chooseLocation(locationSearch.trim());
                  if (e.key === "Escape") setLocationSearchOpen(false);
                }}
                placeholder={cityFilter === "All" ? "Search area, city or PIN across India" : cityFilter}
                className="h-11 rounded-lg border-2 border-accent/40 bg-background pl-9 pr-9 text-sm font-bold shadow-sm focus-visible:ring-1"
              />
              {locationSearching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
            </div>
            {locationSearchOpen && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                <button className="flex w-full items-center gap-2 border-b border-border px-3 py-3 text-left text-sm font-bold text-accent" onMouseDown={e => { e.preventDefault(); useCurrentLocation(); }} disabled={locationBusy}>
                  {locationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  {locationBusy ? "Finding exact GPS area, city and pin code..." : "Use Current Location"}
                </button>
                {locationSearch.trim() && (
                  <button className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-extrabold text-foreground hover:bg-accent/10" onMouseDown={e => { e.preventDefault(); chooseLocation(locationSearch.trim()); }}>
                    <Search className="h-4 w-4 text-accent" /> Use “{locationSearch.trim()}”
                  </button>
                )}
                <div className="max-h-72 overflow-y-auto py-1">
                  {locationResults.map((location, index) => (
                    <button key={`${location.label}-${index}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/10" onMouseDown={e => { e.preventDefault(); chooseLocation(location.label); }}>
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{location.label}</span>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{location.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-11 shrink-0 rounded-lg text-xs font-bold" onClick={useCurrentLocation} disabled={locationBusy}>
            {locationBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />} GPS
          </Button>
        </div>
        <div className="container mx-auto px-3 pb-2 pt-1.5 flex items-center gap-2">
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
                <Button variant="outline" className="h-9 w-full justify-start truncate text-xs" onClick={() => { setLocationSearchOpen(true); locationInputRef.current?.focus(); }}>
                  <MapPin className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {cityFilter === "All" ? "All India" : cityFilter}
                </Button>
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
            <p className="mt-1 text-xs text-muted-foreground">OLX-style marketplace for used items, pets, vehicles, mobiles, and household deals in {cityFilter === "All" ? "India" : cityFilter}.</p>
        </div>

        {activeSection === "home" && (
          <>
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
            <p className="text-xs text-muted-foreground">{filtered.length} ads found near {cityFilter === "All" ? "India" : cityFilter}</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((ad, idx) => (
              <ClassifiedsAdCard
                key={ad.id}
                ad={ad}
                isFeatured={idx < 2}
                onOpen={() => openAd(ad)}
                isNumberVisible={false}
                onShowNumber={() => requestSellerNumber(ad)}
                onChat={() => startChatForAd(ad)}
              />
            ))}
          </div>
        )}
          </>
        )}

        {activeSection === "myAds" && (
          <Tabs defaultValue="active" className="mt-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-foreground">My Ads</h2>
              <TabsList className="grid w-48 grid-cols-2"><TabsTrigger value="active">Active</TabsTrigger><TabsTrigger value="sold">Sold</TabsTrigger></TabsList>
            </div>
            {(["active", "sold"] as const).map(tab => {
              const tabAds = myAds.filter(ad => tab === "sold" ? ad.is_sold : !ad.is_sold);
              return (
                <TabsContent key={tab} value={tab} className="mt-0">
                  {tabAds.length === 0 ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">No {tab} ads yet.</div> : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {tabAds.map(ad => <ClassifiedsAdCard key={ad.id} ad={ad} isSeller onOpen={() => openAd(ad)} onMarkSold={() => updateAdSoldStatus(ad)} onDelete={() => deleteAd(ad)} />)}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {activeSection === "chats" && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-foreground">Chats</h2>
            {visibleConversations.length === 0 ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">No active chats yet.</div> : visibleConversations.map(conversation => {
              const ad = ads.find(item => item.id === conversation.classified_id);
              return (
                <div key={conversation.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-foreground">{ad?.title || "Marketplace chat"}</p>
                    <p className="text-xs text-muted-foreground">{conversation.seller_id === user?.id ? "Buyer conversation" : "Seller conversation"} · {new Date(conversation.last_message_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => archiveConversation(conversation)}><Archive className="h-4 w-4" /> Archive</Button>
                    <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => deleteConversation(conversation)}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OLX-style Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-lg">
        <div className="container mx-auto grid h-16 grid-cols-5 items-center px-2">
          <button className={`flex flex-col items-center gap-0.5 ${activeSection === "home" ? "text-accent" : "text-muted-foreground"}`} onClick={() => setActiveSection("home")}><Home className="h-5 w-5" /><span className="text-[10px] font-bold">Home</span></button>
          <button className={`flex flex-col items-center gap-0.5 ${activeSection === "chats" ? "text-accent" : "text-muted-foreground"}`} onClick={() => { if (!user) toast.info("Please login to view chats."); else { loadConversations(); setActiveSection("chats"); } }}><MessageCircle className="h-5 w-5" /><span className="text-[10px] font-bold">Chats</span></button>
          <button onClick={() => setDialogOpen(true)} className="relative -mt-7 flex flex-col items-center gap-1 text-foreground">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-accent text-accent-foreground shadow-lg"><Plus className="h-7 w-7" /></span>
            <span className="text-[10px] font-extrabold">Sell</span>
          </button>
          <button className={`flex flex-col items-center gap-0.5 ${activeSection === "myAds" ? "text-accent" : "text-muted-foreground"}`} onClick={() => { if (!user) toast.info("Please login to manage your ads."); else setActiveSection("myAds"); }}><ClipboardList className="h-5 w-5" /><span className="text-[10px] font-bold">My Ads</span></button>
          <button className={`flex flex-col items-center gap-0.5 ${activeSection === "account" ? "text-accent" : "text-muted-foreground"}`} onClick={() => setActiveSection("account")}><UserCircle className="h-5 w-5" /><span className="text-[10px] font-bold">Account</span></button>
        </div>
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
                    <button type="button" onClick={() => setLightboxOpen(true)} className="block h-full w-full cursor-zoom-in">
                      <img src={selectedPhotos[activePhoto]} alt={selectedAd.title} className="h-full w-full object-contain" />
                    </button>
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
                    {selectedAd.is_sold && <Badge className="bg-destructive text-destructive-foreground">SOLD</Badge>}
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
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><HeartHandshake className="h-4 w-4 text-accent" /> {selectedAd.user_id === user?.id ? "Manage Listing" : "Contact Seller"}</h3>
                  {selectedAd.user_id === user?.id ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" disabled={selectedAd.is_sold} onClick={() => updateAdSoldStatus(selectedAd)} className="h-11">Mark as Sold</Button>
                      <Button variant="destructive" onClick={() => deleteAd(selectedAd)} className="h-11">Delete Ad</Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" disabled={selectedAd.is_sold} onClick={() => isSelectedNumberApproved ? toast.success("Seller approved this number") : requestSellerNumber(selectedAd)} className="h-11">
                          <Phone className="h-4 w-4" /> {selectedAd.is_sold ? "Sold Out" : isSelectedNumberApproved ? (selectedAd.contact_phone || "Number unavailable") : requestForSelectedAd?.status === "pending" ? "Request Pending" : "Request Number"}
                        </Button>
                        <Button disabled={selectedAd.is_sold} onClick={startChat} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                          <MessageCircle className="h-4 w-4" /> {selectedAd.is_sold ? "Sold Out" : "Chat with Seller"}
                        </Button>
                      </div>
                      <Textarea disabled={selectedAd.is_sold} value={chatMessage} onChange={e => setChatMessage(e.target.value)} rows={3} className="resize-none" placeholder="Write a message to the seller" />
                    </>
                  )}
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="h-[100dvh] max-h-[100dvh] w-screen max-w-none border-0 bg-background/95 p-0 sm:rounded-none">
          {selectedAd && selectedPhotos.length > 0 && (
            <div
              className="flex h-full w-full items-center justify-center p-4"
              onTouchStart={event => ((event.currentTarget.dataset.touchX = String(event.touches[0].clientX)))}
              onTouchEnd={event => {
                const start = Number(event.currentTarget.dataset.touchX || 0);
                const delta = event.changedTouches[0].clientX - start;
                if (Math.abs(delta) > 40) delta < 0 ? nextPhoto() : prevPhoto();
              }}
            >
              <img src={selectedPhotos[activePhoto]} alt={selectedAd.title} className="max-h-[88dvh] max-w-full object-contain" />
              {selectedPhotos.length > 1 && (
                <>
                  <Button size="icon" variant="secondary" className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full" onClick={prevPhoto}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full" onClick={nextPhoto}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {selectedPhotos.map((_, index) => <span key={index} className={`h-2 w-2 rounded-full ${index === activePhoto ? "bg-accent" : "bg-muted"}`} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassifiedsPage;
