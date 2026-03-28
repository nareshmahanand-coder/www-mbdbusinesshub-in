import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Plus, Phone, MapPin, IndianRupee, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ImageUpload, { NoImage } from "@/components/ImageUpload";

interface ClassifiedAd {
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

const categories = [
  "Mobile / Tablet", "Electronics", "Furniture", "Vehicle", "Books",
  "Clothing", "Kitchen", "Sports", "Other",
];

const PhotoCarousel = ({ photos }: { photos: string[] }) => {
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) return <NoImage />;

  return (
    <div className="relative h-40 w-full overflow-hidden bg-muted">
      <img src={photos[idx]} alt="" className="h-full w-full object-cover transition-opacity" />
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 text-foreground shadow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-primary" : "bg-background/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ClassifiedsPage = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adPhotos, setAdPhotos] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", city: "",
    condition: "used", contact_phone: "",
  });

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from("classifieds")
      .select("*").eq("is_sold", false).order("created_at", { ascending: false });
    if (data) setAds(data as ClassifiedAd[]);
    setLoading(false);
  };

  const postAd = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("classifieds").insert({
      ...form, price: Number(form.price) || 0, user_id: user.id, photos: adPhotos,
    });
    setSaving(false);
    if (error) toast.error("Failed to post ad");
    else {
      toast.success("Ad posted successfully!");
      setForm({ title: "", description: "", price: "", category: "", city: "", condition: "used", contact_phone: "" });
      setAdPhotos([]);
      setDialogOpen(false);
      loadAds();
    }
  };

  const filtered = ads.filter(a => {
    const q = search.toLowerCase();
    return !search || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.city.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-accent" /> पुरानी चीजें — Buy & Sell
            </h1>
            <p className="text-sm text-muted-foreground">OLX-style classifieds for your local area</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Post Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Post a New Ad</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} />
                <Input placeholder="Price ₹" type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.condition} onValueChange={v => setForm(f => ({...f, condition: v}))}>
                  <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="old">Old</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                <Input placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} />
                <ImageUpload
                  images={adPhotos}
                  onImagesChange={setAdPhotos}
                  maxImages={5}
                  folder="classifieds"
                  label="Upload Product Photos (up to 5)"
                />
                <Button onClick={postAd} disabled={saving} className="w-full">
                  {saving ? "Posting..." : "Post Ad"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <Input placeholder="Search ads by title, category, city..." value={search}
            onChange={e => setSearch(e.target.value)} className="max-w-md" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No ads found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ad) => (
              <Card key={ad.id} className="overflow-hidden">
                <PhotoCarousel photos={ad.photos?.filter(Boolean) || []} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">{ad.title}</h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{ad.condition}</Badge>
                  </div>
                  {ad.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ad.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{ad.price?.toLocaleString("en-IN")}</span>
                    {ad.category && <span className="flex items-center gap-0.5"><Tag className="h-3 w-3" />{ad.category}</span>}
                    {ad.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{ad.city}</span>}
                  </div>
                  {ad.contact_phone && (
                    <a href={`tel:${ad.contact_phone}`}>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        <Phone className="mr-1 h-3.5 w-3.5" /> Call Seller
                      </Button>
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(ad.created_at).toLocaleDateString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassifiedsPage;
