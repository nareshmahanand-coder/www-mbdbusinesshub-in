import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shopCategories } from "@/data/sampleShops";
import { Store, Upload, CheckCircle, Crown, ShieldCheck, Eye, HelpCircle, AlertTriangle, Image } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PaymentQRSection from "@/components/PaymentQRSection";

const UPI_ID = "Nmahanand1@ybl";
const UPI_BASE = `upi://pay?pa=${UPI_ID}&pn=MeraBharatDukaan&cu=INR`;

const PLANS = [
  { id: "monthly", label: "मासिक प्लान (₹99)", labelEn: "Monthly Plan", price: 99, days: 30 },
  { id: "yearly", label: "सालाना प्लान (₹999)", labelEn: "Yearly Plan", price: 999, days: 365 },
];

const MerchantPortal = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0].id);
  const [premiumDaysLeft] = useState(3);
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const shopPhotoRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    shopName: "", shopNameHindi: "", category: "", address: "",
    pincode: "", whatsapp: "", phone: "", description: "",
  });

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleFileUpload = async (file: File, folder: string): Promise<string | null> => {
    if (!user) { toast.error("Please login first"); return null; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return null; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    setUploading(false);
    return urlData.publicUrl;
  };

  const handleShopPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileUpload(file, "shop");
    if (url) { setShopPhotos(prev => [...prev, url]); toast.success("Photo uploaded!"); }
  };

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileUpload(file, "payment");
    if (url) { setScreenshotUrl(url); toast.success("Screenshot uploaded!"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.category || !form.address || !form.pincode || !form.whatsapp) {
      toast.error("Please fill all required fields"); return;
    }
    setSubmitted(true);
    toast.success("Shop registration submitted for verification!");
  };

  const handleScreenshotUpload = () => {
    if (!transactionId.trim()) { toast.error("कृपया Transaction ID भरें"); return; }
    if (!screenshotUrl) { toast.error("कृपया Screenshot upload करें"); return; }
    toast.success("पेमेंट स्क्रीनशॉट अपलोड हो गया! Admin जल्द verify करेंगे।");
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
              <p className="mt-4 text-sm text-muted-foreground">Your shop will be visible after admin verification.</p>
              <Button className="mt-6" onClick={() => setSubmitted(false)}>Register Another Shop</Button>
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
          <h1 className="font-hindi text-2xl font-extrabold leading-snug text-foreground sm:text-3xl">
            अपनी दुकान को शहर में सबसे ऊपर दिखाएं और ज्यादा ग्राहक पाएं!
          </h1>
          <p className="mt-2 text-lg font-semibold text-foreground">Register Your Shop</p>
          <p className="mt-1 text-sm text-muted-foreground">Free listing • 0% Commission • Direct payments</p>
        </div>

        {premiumDaysLeft <= 3 && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 px-4 py-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-accent" />
            <p className="font-hindi text-sm font-semibold text-foreground">
              चेतावनी: आपका प्रीमियम प्लान {premiumDaysLeft} दिन में खत्म होने वाला है! टॉप पर बने रहने के लिए रिन्यू करें।
            </p>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Shop Details • <span className="font-hindi font-normal">दुकान की जानकारी</span></CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <Input id="shopName" placeholder="e.g., Sai Kirana" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="shopNameHindi">दुकान का नाम (Hindi)</Label>
                  <Input id="shopNameHindi" placeholder="e.g., साई किराना" value={form.shopNameHindi} onChange={(e) => setForm({ ...form, shopNameHindi: e.target.value })} className="font-hindi" />
                </div>
              </div>
              <div>
                <Label>Category *</Label>
                <Select onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select shop category" /></SelectTrigger>
                  <SelectContent>
                    {shopCategories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">Full Address *</Label>
                <Textarea id="address" placeholder="Complete shop address with landmark" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" placeholder="490006" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required maxLength={6} />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input id="whatsapp" placeholder="91XXXXXXXXXX" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="91XXXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="description">Shop Description</Label>
                <Textarea id="description" placeholder="What do you sell? Any speciality?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Shop Photos</Label>
                {shopPhotos.length > 0 && (
                  <div className="flex gap-2 mt-1 mb-2 flex-wrap">
                    {shopPhotos.map((url, i) => (
                      <img key={i} src={url} alt={`Shop ${i+1}`} className="h-16 w-16 rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" ref={shopPhotoRef} className="hidden" onChange={handleShopPhotoUpload} />
                <button type="button" onClick={() => shopPhotoRef.current?.click()} disabled={uploading}
                  className="mt-1 flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary">
                  <div className="text-center">
                    <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photos"}</p>
                  </div>
                </button>
              </div>
              <Button type="submit" className="w-full" size="lg">
                <Store className="mr-2 h-5 w-5" /> Submit for Verification
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Premium */}
        <Card className="mb-6 border-2 border-accent">
          <CardHeader className="text-center">
            <Crown className="mx-auto mb-1 h-8 w-8 text-accent" />
            <CardTitle className="font-hindi text-xl">प्रीमियम मेंबरशिप • Premium Membership</CardTitle>
            <p className="font-hindi mt-2 text-sm text-muted-foreground">मात्र ₹99 में प्रीमियम मेंबर बनें।</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${selectedPlan === plan.id ? "border-accent bg-accent/10 shadow-md" : "border-border hover:border-accent/50"}`}>
                  <p className="font-hindi text-sm font-bold text-foreground">{plan.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-accent">₹{plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.days} days</p>
                </button>
              ))}
            </div>
            <ul className="space-y-2 font-hindi text-sm">
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-india" /><span>आपकी दुकान ग्राहकों को सबसे पहले ऊपर दिखेगी।</span></li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-india" /><span>दुकान के नाम के साथ <strong>'Verified'</strong> का निशान लगेगा।</span></li>
              <li className="flex items-start gap-2"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-green-india" /><span>ज्यादा से ज्यादा लोग आपकी दुकान देख पाएंगे।</span></li>
            </ul>

            {/* UPI Direct Pay */}
            <PaymentQRSection amount={currentPlan.price} label={`₹${currentPlan.price}`} />

            {/* Payment proof - Transaction ID + Screenshot (Admin approval required) */}
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <p className="font-hindi text-sm font-semibold text-foreground">पेमेंट करने के बाद Transaction ID और Screenshot अपलोड करें</p>
              <div>
                <Label htmlFor="txnId" className="font-hindi">Transaction ID *</Label>
                <Input id="txnId" placeholder="e.g., T2403081234567890" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
              </div>
              <div className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-accent/50 transition-colors hover:border-accent"
                onClick={() => screenshotRef.current?.click()}>
                <input type="file" accept="image/*" ref={screenshotRef} className="hidden" onChange={handleScreenshotFileChange} />
                <div className="text-center">
                  {screenshotUrl ? (
                    <img src={screenshotUrl} alt="Screenshot" className="h-16 rounded object-contain" />
                  ) : (
                    <>
                      <Upload className="mx-auto h-5 w-5 text-accent" />
                      <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload Screenshot"}</p>
                    </>
                  )}
                </div>
              </div>
              <Button onClick={handleScreenshotUpload} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-5">
                <Upload className="mr-2 h-4 w-4" /> Submit Payment Proof
              </Button>
              <p className="text-center text-[10px] text-muted-foreground font-hindi">Admin अप्रूव करते ही आपकी दुकान Premium हो जाएगी</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h3 className="font-hindi text-lg font-semibold">मदद और सहायता • Help Desk</h3>
            <p className="font-hindi text-sm text-muted-foreground">मदद के लिए यहाँ संपर्क करें:</p>
            <a href="mailto:helpline.bharatdukaan@gmail.com" className="text-sm font-medium text-primary underline underline-offset-2">helpline.bharatdukaan@gmail.com</a>
            <Button variant="outline" asChild><a href="/help"><HelpCircle className="mr-2 h-4 w-4" /> Help Desk</a></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MerchantPortal;
