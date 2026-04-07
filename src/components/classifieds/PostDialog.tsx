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
  "Furniture", "Pets", "Fashion", "Books", "Other",
];

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
    condition: "used", contact_phone: "",
  });

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
      onOpenChange(false);
      onPosted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Post a New Ad</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <ImageUpload
            images={adPhotos}
            onImagesChange={setAdPhotos}
            maxImages={5}
            folder="classifieds"
            label="Upload Photos (up to 5)"
          />
          <Input placeholder="Ad Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
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
          <Button onClick={postAd} disabled={saving} className="w-full bg-accent text-accent-foreground">
            {saving ? "Posting..." : "Post Ad"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassifiedsPostDialog;
