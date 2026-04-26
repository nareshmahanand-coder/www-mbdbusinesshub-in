import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shopCategories } from "@/data/sampleShops";
import { Store, CheckCircle, Crown, ShieldCheck, Eye, HelpCircle, Image, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import KycDocUpload from "@/components/KycDocUpload";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";

const MERCHANT_PLANS = [
  {
    id: "monthly",
    label: "मर्चेंट मंथली प्रीमियम",
    price: 1,
    days: 30,
    theme: "saffron",
  },
  {
    id: "yearly",
    label: "मर्चेंट सालाना प्रीमियम",
    price: 12,
    days: 365,
    theme: "green",
  },
];

const MerchantPortal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const accessMessage = (location.state as { accessMessage?: string } | null)?.accessMessage;
  const [submitted, setSubmitted] = useState(false);
  const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [failedPlan, setFailedPlan] = useState<"monthly" | "yearly" | null>(null);
  
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const shopPhotoRef = useRef<HTMLInputElement>(null);

  // KYC Documents
  const [aadharUrl, setAadharUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [gstUrl, setGstUrl] = useState("");
  const [fssaiUrl, setFssaiUrl] = useState("");

  const [form, setForm] = useState({
    shopName: "", shopNameHindi: "", category: "", address: "",
    pincode: "", whatsapp: "", phone: "", description: "", ownerName: "", aadhaarLast4: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); return; }
    if (!form.shopName || !form.category || !form.address || !form.pincode || !form.whatsapp || !form.ownerName) {
      toast.error("Please fill all required fields"); return;
    }
    if (form.aadhaarLast4 && form.aadhaarLast4.length !== 4) { toast.error("Aadhaar last-4 must be 4 digits"); return; }
    if (!aadharUrl) { toast.error("कृपया आधार कार्ड की फोटो अपलोड करें"); return; }
    if (!panUrl) { toast.error("कृपया पैन कार्ड की फोटो अपलोड करें"); return; }
    const { error } = await supabase.from("merchant_profiles").insert({
      user_id: user.id,
      owner_name: form.ownerName,
      aadhaar_last4: form.aadhaarLast4,
      shop_name: form.shopName,
      shop_name_hindi: form.shopNameHindi,
      category: form.category,
      address: form.address,
      pincode: form.pincode,
      whatsapp: form.whatsapp,
      phone: form.phone,
      description: form.description,
      photos: shopPhotos,
      aadhar_url: aadharUrl,
      pan_url: panUrl,
      gst_url: gstUrl,
      fssai_url: fssaiUrl,
      access_status: "active",
    });
    if (error) { toast.error("Shop registration failed"); return; }
    setSubmitted(true);
    toast.success("Shop registration submitted for verification!");
  };

  const handleSubscribe = async (plan: typeof MERCHANT_PLANS[number]) => {
    if (!user) { toast.error("Please login first"); return; }
    setPayingPlan(plan.id as "monthly" | "yearly");
    setFailedPlan(null);

    try {
      await startInstantRazorpayPayment({
        module: "merchant_premium",
        plan: plan.id as "monthly" | "yearly",
        onSuccess: () => {
          toast.success("Payment successful — Merchant Premium activated!");
          window.location.reload();
        },
        onFailure: () => setFailedPlan(plan.id as "monthly" | "yearly"),
      });
    } catch (error) {
      setFailedPlan(plan.id as "monthly" | "yearly");
      toast.error(error instanceof Error ? error.message : "Payment failed. Please retry.");
    } finally {
      setPayingPlan(null);
    }
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
        {accessMessage && (
          <Card className="mb-6 border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm font-medium text-destructive">{accessMessage}</CardContent>
          </Card>
        )}
        <div className="mb-6 text-center">
          <Store className="mx-auto mb-2 h-10 w-10 text-saffron" />
          <h1 className="font-hindi text-2xl font-extrabold leading-snug text-foreground sm:text-3xl">
            अपनी दुकान को शहर में सबसे ऊपर दिखाएं और ज्यादा ग्राहक पाएं!
          </h1>
          <p className="mt-2 text-lg font-semibold text-foreground">Register Your Shop</p>
          <p className="mt-1 text-sm text-muted-foreground">Free listing • 0% Commission • Direct payments</p>
        </div>

        {!settings.merchant_registrations_enabled && (
          <Card className="mb-6 border-accent/40 bg-accent/5">
            <CardContent className="py-6 text-center">
              <h2 className="text-lg font-bold text-foreground">New merchant registrations are closed</h2>
              <p className="mt-2 font-hindi text-sm text-muted-foreground">नए दुकानदार रजिस्ट्रेशन फिलहाल बंद हैं।</p>
            </CardContent>
          </Card>
        )}


        {settings.merchant_registrations_enabled && <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Shop Details • <span className="font-hindi font-normal">दुकान की जानकारी</span></CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input id="ownerName" placeholder="Business owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="aadhaarLast4">Aadhaar Last-4</Label>
                  <Input id="aadhaarLast4" placeholder="1234" value={form.aadhaarLast4} onChange={(e) => setForm({ ...form, aadhaarLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })} maxLength={4} />
                </div>
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

              {/* KYC Documents */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">📄 KYC Documents • <span className="font-hindi">दस्तावेज़ सत्यापन</span></p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycDocUpload label="Aadhar Card" labelHindi="आधार कार्ड" required value={aadharUrl} onChange={setAadharUrl} userId={user?.id || ""} folder="kyc-aadhar" />
                  <KycDocUpload label="PAN Card" labelHindi="पैन कार्ड" required value={panUrl} onChange={setPanUrl} userId={user?.id || ""} folder="kyc-pan" />
                  <KycDocUpload label="GST Certificate" labelHindi="जीएसटी प्रमाणपत्र" value={gstUrl} onChange={setGstUrl} userId={user?.id || ""} folder="kyc-gst" />
                  <KycDocUpload label="FSSAI License" labelHindi="फूड लाइसेंस" value={fssaiUrl} onChange={setFssaiUrl} userId={user?.id || ""} folder="kyc-fssai" />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Store className="mr-2 h-5 w-5" /> Submit for Verification
              </Button>
            </form>
          </CardContent>
        </Card>}

        {/* Premium - Tiranga themed Razorpay subscriptions */}
        <Card
          className="mb-6 overflow-hidden border-0 shadow-lg"
          style={{
            borderTop: "6px solid #FF9933",
            borderBottom: "6px solid #138808",
            background: "linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 50%, #ECFDF5 100%)",
          }}
        >
          <CardHeader className="text-center">
            <Crown className="mx-auto mb-1 h-8 w-8 text-[#FF9933]" />
            <CardTitle className="font-hindi text-xl text-foreground">
              मर्चेंट पोर्टल प्रीमियम • Merchant Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="font-hindi text-sm leading-relaxed text-foreground/90 bg-white/60 rounded-lg p-3 border border-border">
              <strong>मर्चेंट पोर्टल प्रीमियम क्यों चुनें?</strong> प्रीमियम मर्चेंट बनने पर आपको जीरो कमीशन बिक्री, एडवांस वेंडर डैशबोर्ड और अपनी दुकान को प्राथमिकता के साथ लिस्ट करने की सुविधा मिलती है। अपना पसंदीदा ऑटो-डेबिट प्लान चुनें और व्यापार बढ़ाएं।
            </p>

            <ul className="space-y-2 font-hindi text-sm">
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#138808]" /><span>0% कमीशन — पूरी कमाई आपकी।</span></li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#138808]" /><span>दुकान के नाम के साथ <strong>'Verified'</strong> का निशान।</span></li>
              <li className="flex items-start gap-2"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-[#138808]" /><span>प्राथमिकता लिस्टिंग — सबसे ऊपर दिखेंगे।</span></li>
            </ul>

            <div className="grid gap-3 sm:grid-cols-2">
              {MERCHANT_PLANS.map((plan) => {
                const isSaffron = plan.theme === "saffron";
                const bg = isSaffron ? "#FF9933" : "#138808";
                return (
                  <button
                    key={plan.id}
                    type="button"
                    disabled
                    className="group flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl px-4 py-5 text-white font-bold opacity-90 shadow-md"
                    style={{ backgroundColor: bg }}
                  >
                    <span className="font-hindi text-base leading-tight">{plan.label}</span>
                    {payingPlan === plan.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="text-2xl font-extrabold">₹{plan.price}</span>}
                    <span className="font-hindi text-xs opacity-95">ऑटो-डेबिट • {plan.days} दिन</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs opacity-95">
                      Payment paused for review
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-muted-foreground font-hindi">
              Razorpay review के लिए पेमेंट बटन अस्थायी रूप से बंद हैं; पूरा मर्चेंट फ्लो देखने के लिए खुला है।
            </p>
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
