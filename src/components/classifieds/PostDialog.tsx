import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { searchIndiaLocations, reverseGeocodeIndiaLocation, type IndiaLocationSuggestion } from "@/lib/googleLocation";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";

const categories = [
  "Cars", "Properties", "Mobiles", "Bikes", "Electronics",
  "Furniture", "Pets", "Dogs", "Fishes & Aquarium", "Pet Food/Accessories", "Fashion", "Books", "Other",
];

const vehicleCategories = ["Cars", "Bikes", "Mobiles"];
const petCategories = ["Pets", "Dogs", "Fishes & Aquarium", "Pet Food/Accessories"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted: () => void;
}

const ClassifiedsPostDialog = ({ open, onOpenChange, onPosted }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [adPhotos, setAdPhotos] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationResults, setLocationResults] = useState<IndiaLocationSuggestion[]>([]);
  const locationRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", city: "",
    condition: "used", contact_phone: "", brand: "", model_name: "", registration_year: "", breed: "", age: "",
  });

  const needsVehicleFields = vehicleCategories.includes(form.category);
  const needsPetFields = petCategories.includes(form.category);

  useEffect(() => {
    const query = form.city.trim();
    if (!locationOpen || query.length < 2) {
      setLocationResults([]);
      setLocationSearching(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLocationSearching(true);
      try {
        const results = await searchIndiaLocations(query);
        if (!cancelled) setLocationResults(results);
      } catch {
        if (!cancelled) setLocationResults([]);
      } finally {
        if (!cancelled) setLocationSearching(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [form.city, locationOpen]);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) { toast.error("GPS is not available on this device"); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const exactLocation = await reverseGeocodeIndiaLocation(position.coords.latitude, position.coords.longitude);
        setForm(f => ({ ...f, city: exactLocation }));
        setLocationOpen(false);
        toast.success("Listing location updated from GPS");
      } catch {
        toast.error("Could not detect area name. Please type your location.");
      } finally {
        setLocationBusy(false);
      }
    }, () => { setLocationBusy(false); toast.error("Location permission denied"); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };

  const buildProfessionalTitle = () => {
    const baseTitle = form.title.trim();
    const brandModel = [form.brand.trim(), form.model_name.trim()].filter(Boolean).join(" - ");
    const petTitle = [form.breed.trim(), form.age.trim() && `${form.age.trim()} old`].filter(Boolean).join(" - ");
    const prefix = needsVehicleFields ? brandModel : needsPetFields ? petTitle : form.brand.trim();
    if (!prefix) return baseTitle;
    return baseTitle && !baseTitle.toLowerCase().startsWith(prefix.toLowerCase()) ? `${prefix} ${baseTitle}` : baseTitle || prefix;
  };

  const postAd = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (needsVehicleFields && (!form.model_name.trim() || !form.registration_year.trim())) { toast.error("Model name and registration year are required"); return; }
    if (needsPetFields && (!form.breed.trim() || !form.age.trim())) { toast.error("Breed and age are required"); return; }
    if (!form.city.trim()) { toast.error("Exact item location is required"); locationRef.current?.focus(); return; }
    setSaving(true);
    const professionalTitle = buildProfessionalTitle();
    const details = [
      needsVehicleFields && `Model: ${form.model_name.trim()}\nRegistration Year: ${form.registration_year.trim()}`,
      needsPetFields && `Breed: ${form.breed.trim()}\nAge: ${form.age.trim()}`,
    ].filter(Boolean).join("\n");
    const { error } = await supabase.from("classifieds").insert({
      title: professionalTitle,
      description: [details, form.description.trim()].filter(Boolean).join("\n\n"),
      price: Number(form.price) || 0,
      category: form.category,
      city: form.city,
      condition: form.condition,
      contact_phone: form.contact_phone,
      user_id: user.id,
      photos: adPhotos,
    });
    setSaving(false);
    if (error) toast.error("Failed to post ad");
    else {
      toast.success("Ad posted successfully!");
      setForm({ title: "", description: "", price: "", category: "", city: "", condition: "used", contact_phone: "", brand: "", model_name: "", registration_year: "", breed: "", age: "" });
      setAdPhotos([]);
      onOpenChange(false);
      onPosted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Sell an Old Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <ImageUpload
            images={adPhotos}
            onImagesChange={setAdPhotos}
            maxImages={5}
            folder="classifieds"
            label="Upload Item Photos (up to 5)"
          />
          <Input placeholder="Item Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <Textarea placeholder="Describe condition, age, defects, bill/warranty, pickup details" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} />
          <Input placeholder="Price ₹" type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
          <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {(needsVehicleFields || (!needsPetFields && form.category)) && (
            <Input placeholder="Brand (e.g. Samsung, Honda, Maruti)" value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} />
          )}
          {needsVehicleFields && (
            <div className="grid grid-cols-2 gap-2">
              <Input required placeholder="Model Name *" value={form.model_name} onChange={e => setForm(f => ({...f, model_name: e.target.value}))} />
              <Input required placeholder="Registration Year *" inputMode="numeric" value={form.registration_year} onChange={e => setForm(f => ({...f, registration_year: e.target.value}))} />
            </div>
          )}
          {needsPetFields && (
            <div className="grid grid-cols-2 gap-2">
              <Input required placeholder="Breed *" value={form.breed} onChange={e => setForm(f => ({...f, breed: e.target.value}))} />
              <Input required placeholder="Age *" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} />
            </div>
          )}
          {(needsVehicleFields || needsPetFields) && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
              Preview title: {buildProfessionalTitle() || "Brand/Model Item Title"}
            </div>
          )}
          <Select value={form.condition} onValueChange={v => setForm(f => ({...f, condition: v}))}>
            <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="old">Old</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <Input
              ref={locationRef}
              placeholder="Search exact area, city or PIN *"
              value={form.city}
              onFocus={() => setLocationOpen(true)}
              onBlur={() => window.setTimeout(() => setLocationOpen(false), 140)}
              onChange={e => { setForm(f => ({...f, city: e.target.value})); setLocationOpen(true); }}
              className="pl-9 pr-9"
            />
            {locationSearching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
            {locationOpen && (
              <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                <button className="flex w-full items-center gap-2 border-b border-border px-3 py-3 text-left text-sm font-bold text-accent" onMouseDown={e => { e.preventDefault(); useCurrentLocation(); }} disabled={locationBusy}>
                  {locationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  {locationBusy ? "Finding exact item location..." : "Use Current Location"}
                </button>
                {form.city.trim() && <button className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-extrabold text-foreground hover:bg-accent/10" onMouseDown={e => { e.preventDefault(); setLocationOpen(false); }}><Search className="h-4 w-4 text-accent" /> Use “{form.city.trim()}”</button>}
                <div className="max-h-56 overflow-y-auto py-1">
                  {locationResults.map((location, index) => (
                    <button key={`${location.label}-${index}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/10" onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, city: location.label })); setLocationOpen(false); }}>
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{location.label}</span>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{location.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Input placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} />
          <Button onClick={postAd} disabled={saving} className="w-full bg-accent text-accent-foreground">
            {saving ? "Posting..." : "Post Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassifiedsPostDialog;
