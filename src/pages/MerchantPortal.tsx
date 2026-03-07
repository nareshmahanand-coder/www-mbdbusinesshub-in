import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shopCategories } from "@/data/sampleShops";
import { Store, Upload, CheckCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";

const MerchantPortal = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    shopNameHindi: "",
    category: "",
    address: "",
    pincode: "",
    whatsapp: "",
    phone: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.category || !form.address || !form.pincode || !form.whatsapp) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Shop registration submitted for verification!");
  };

  if (submitted) {
    return (
      <div className="ashoka-watermark tiranga-bg min-h-screen">
        <AppHeader />
        <div className="relative z-10 flex flex-1 items-center justify-center py-20">
          <Card className="mx-4 max-w-md text-center">
            <CardContent className="py-12">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-india" />
              <h2 className="mb-2 text-2xl font-bold text-foreground">Registration Submitted!</h2>
              <p className="font-hindi text-lg text-muted-foreground">आपकी दुकान पंजीकरण सफल!</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Your shop will be visible after admin verification. You'll be notified via WhatsApp.
              </p>
              <Button className="mt-6" onClick={() => setSubmitted(false)}>
                Register Another Shop
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />
      <div className="relative z-10 container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <Store className="mx-auto mb-2 h-10 w-10 text-saffron" />
          <h2 className="text-2xl font-bold text-foreground">Register Your Shop</h2>
          <p className="font-hindi text-muted-foreground">अपनी दुकान रजिस्टर करें</p>
          <p className="mt-1 text-sm text-muted-foreground">Free listing • 0% Commission • Direct payments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shop Details • <span className="font-hindi font-normal">दुकान की जानकारी</span></CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <Input
                    id="shopName"
                    placeholder="e.g., Sai Kirana"
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shopNameHindi">दुकान का नाम (Hindi)</Label>
                  <Input
                    id="shopNameHindi"
                    placeholder="e.g., साई किराना"
                    value={form.shopNameHindi}
                    onChange={(e) => setForm({ ...form, shopNameHindi: e.target.value })}
                    className="font-hindi"
                  />
                </div>
              </div>

              <div>
                <Label>Category *</Label>
                <Select onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shop category" />
                  </SelectTrigger>
                  <SelectContent>
                    {shopCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Full Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Complete shop address with landmark"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="490006"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    required
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    placeholder="91XXXXXXXXXX"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="91XXXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Shop Description</Label>
                <Textarea
                  id="description"
                  placeholder="What do you sell? Any speciality?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Shop Photos</Label>
                <div className="mt-1 flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Click to upload photos</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Store className="mr-2 h-5 w-5" />
                Submit for Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantPortal;
