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
import { Store, Plus, Phone, MapPin, Star, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ServiceProvider {
  id: string;
  name: string;
  service_type: string;
  city: string;
  phone: string;
  description: string;
  rating: number;
  is_verified: boolean;
  user_id: string;
  created_at: string;
}

const serviceTypes = [
  "Electrician", "Plumber", "Carpenter", "Doctor", "Tutor",
  "Driver", "Cook / Chef", "Tailor", "Painter", "AC Repair",
  "Mobile Repair", "CA / Tax Consultant", "Lawyer", "Other",
];

const ServicesPage = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", service_type: "", city: "", phone: "", description: "",
  });

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("service_providers")
      .select("*").order("created_at", { ascending: false });
    if (data) setProviders(data as ServiceProvider[]);
    setLoading(false);
  };

  const addProvider = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.service_type) { toast.error("Name and service type required"); return; }
    setSaving(true);
    const { error } = await supabase.from("service_providers").insert({ ...form, user_id: user.id });
    setSaving(false);
    if (error) toast.error("Failed to add service");
    else {
      toast.success("Service listed!");
      setForm({ name: "", service_type: "", city: "", phone: "", description: "" });
      setDialogOpen(false);
      loadProviders();
    }
  };

  const filtered = providers.filter(p => {
    const q = search.toLowerCase();
    return !search || p.name.toLowerCase().includes(q) || p.service_type.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" /> भारत मित्र — Services
            </h1>
            <p className="text-sm text-muted-foreground">Find local service providers near you</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> List Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>List Your Service</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Your Name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                <Select value={form.service_type} onValueChange={v => setForm(f => ({...f, service_type: v}))}>
                  <SelectTrigger><SelectValue placeholder="Service Type *" /></SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                <Textarea placeholder="Description of your services" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} />
                <Button onClick={addProvider} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "List My Service"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <Input placeholder="Search by name, service, city..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Headphones className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No service providers listed yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">{p.service_type}</Badge>
                    </div>
                    {p.is_verified && <Badge className="bg-[hsl(var(--green-india))] text-white text-[10px]">Verified ✓</Badge>}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    {p.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{p.city}</span>}
                    {p.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-accent" />{p.rating}</span>}
                  </div>
                  {p.phone && (
                    <a href={`tel:${p.phone}`}>
                      <Button size="sm" className="w-full bg-[hsl(var(--green-india))] text-white hover:bg-[hsl(140,60%,30%)]">
                        <Phone className="mr-1 h-3.5 w-3.5" /> Call Now
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
