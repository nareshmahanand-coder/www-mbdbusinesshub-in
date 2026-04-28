import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

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
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", city: "",
    condition: "used", contact_phone: "", brand: "", model_name: "", registration_year: "", breed: "", age: "",
  });

  const needsVehicleFields = vehicleCategories.includes(form.category);
  const needsPetFields = petCategories.includes(form.category);

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
          <Button onClick={postAd} disabled={saving} className="w-full bg-accent text-accent-foreground">
            {saving ? "Posting..." : "Post Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassifiedsPostDialog;
