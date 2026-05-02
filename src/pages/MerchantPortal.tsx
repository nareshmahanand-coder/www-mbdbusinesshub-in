import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shopCategories } from "@/data/sampleShops";
import { Store, CheckCircle, Crown, ShieldCheck, Eye, HelpCircle, Image, Loader2, Upload, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { startMerchantPortalPaymentLink, syncLatestRazorpayPayment } from "@/lib/razorpayPayments";

const MERCHANT_PLANS = [
  {
    id: "monthly",
    label: "Merchant Portal ₹99 Monthly Plan",
    days: 30,
    theme: "saffron",
  },
  {
    id: "yearly",
    label: "Merchant Portal ₹999 Yearly Plan",
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
  const [syncingPlan, setSyncingPlan] = useState<"monthly" | "yearly" | null>(null);
  
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const shopPhotoRef = useRef<HTMLInputElement>(null);

  // KYC documents
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>("");
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>("");
  const [panUrl, setPanUrl] = useState<string>("");
  const [gstUrl, setGstUrl] = useState<string>("");
  const [foodLicenseUrl, setFoodLicenseUrl] = useState<string>("");
  const [skipGst, setSkipGst] = useState(false);
  const [skipFood, setSkipFood] = useState(false);
  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const foodRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    shopName: "", shopNameHindi: "", category: "", address: "",
    pincode: "", whatsapp: "", phone: "", description: "", ownerName: "",
    aadhaarNumber: "", panNumber: "",
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

  const handleKycUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    setter: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileUpload(file, folder);
    if (url) { setter(url); toast.success("Document uploaded!"); }
  };

  const isAadhaarValid = /^\d{12}$/.test(form.aadhaarNumber.replace(/\s/g, ""));
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.toUpperCase());
  const kycReady = !!aadhaarFrontUrl && !!aadhaarBackUrl && !!panUrl && isAadhaarValid && isPanValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); return; }
    if (!form.shopName || !form.category || !form.address || !form.pincode || !form.whatsapp || !form.ownerName) {
      toast.error("Please fill all required fields"); return;
    }
    if (!isAadhaarValid) { toast.error("कृपया मान्य 12-अंकीय आधार नंबर दर्ज करें"); return; }
    if (!isPanValid) { toast.error("कृपया मान्य PAN नंबर दर्ज करें (ABCDE1234F)"); return; }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) { toast.error("आधार कार्ड के दोनों फ़ोटो अपलोड करें"); return; }
    if (!panUrl) { toast.error("PAN कार्ड का फ़ोटो अपलोड करें"); return; }
    const { error } = await supabase.from("merchant_profiles").insert({
      user_id: user.id,
      owner_name: form.ownerName,
      aadhaar_last4: form.aadhaarNumber.slice(-4),
      aadhaar_number: form.aadhaarNumber,
      aadhaar_front_url: aadhaarFrontUrl,
      aadhaar_back_url: aadhaarBackUrl,
      pan_number: form.panNumber.toUpperCase(),
      pan_url: panUrl,
      gst_certificate_url: skipGst ? null : (gstUrl || null),
      food_license_url: skipFood ? null : (foodLicenseUrl || null),
      shop_name: form.shopName,
      shop_name_hindi: form.shopNameHindi,
      category: form.category,
      address: form.address,
      pincode: form.pincode,
      whatsapp: form.whatsapp,
      phone: form.phone,
      description: form.description,
      photos: shopPhotos,
      access_status: "active",
    });
    if (error) { toast.error("Shop registration failed"); return; }
    toast.success("रजिस्ट्रेशन सफल! कृपया सब्सक्रिप्शन प्लान चुनें।");
    // Redirect to subscription/payment section immediately
    setTimeout(() => {
      const el = document.getElementById("merchant-subscription");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    setSubmitted(true);
  };

  const handleSubscribe = async (plan: typeof MERCHANT_PLANS[number]) => {
    if (!user) { toast.error("Please login first"); return; }
    setPayingPlan(plan.id as "monthly" | "yearly");
    setFailedPlan(null);

    try {
      await startMerchantPortalPaymentLink({
        plan: plan.id as "monthly" | "yearly",
        onSuccess: () => {
          toast.success("Payment successful — Merchant Premium activated!");
          window.location.href = "/merchant-dashboard";
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

  const handleManualSync = async (planId: "monthly" | "yearly") => {
    setSyncingPlan(planId);
    try {
      const result = await syncLatestRazorpayPayment({ module: "merchant_premium", plan: planId });
      if (result.ok) {
        toast.success("Payment confirmed — Merchant Premium activated!");
        window.location.href = "/merchant-dashboard";
      } else {
        toast.info(result.error || "Payment confirmation is still pending. Please try again shortly.");
      }
    } finally {
      setSyncingPlan(null);
    }
  };

  const renderSubscriptionCard = () => (
    <Card
      id="merchant-subscription"
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
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#138808]">
          Optional Upgrade • वैकल्पिक अपग्रेड
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="font-hindi text-sm leading-relaxed text-foreground/90 bg-white/60 rounded-lg p-3 border border-border">
          <strong>रजिस्ट्रेशन पूरी तरह मुफ़्त है।</strong> प्रीमियम लेना ज़रूरी नहीं है — लेकिन प्रीमियम मर्चेंट बनने पर आपको जीरो कमीशन बिक्री, एडवांस वेंडर डैशबोर्ड और अपनी दुकान को प्राथमिकता के साथ लिस्ट करने की सुविधा मिलती है।
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
                onClick={() => handleSubscribe(plan)}
                disabled={payingPlan !== null}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-5 text-white font-bold shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80"
                style={{ backgroundColor: bg }}
              >
                {payingPlan === plan.id ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="text-base font-extrabold leading-tight">{plan.label}</span>}
              </button>
            );
          })}
        </div>
        {failedPlan && (
          <Button onClick={() => handleManualSync(failedPlan)} disabled={syncingPlan !== null} variant="outline" className="w-full">
            {syncingPlan === failedPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Manual Sync
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const KycUploadTile = ({
    label, hindi, url, onPick, onClear, optional, skipped, onSkipToggle,
  }: { label: string; hindi: string; url: string; onPick: () => void; onClear: () => void; optional?: boolean; skipped?: boolean; onSkipToggle?: () => void; }) => (
    <div className="rounded-xl border-2 border-dashed border-border p-3 bg-white/50">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">
          {label} {optional ? <span className="text-xs text-muted-foreground">(Optional)</span> : <span className="text-destructive">*</span>}
          <span className="block font-hindi text-[11px] text-muted-foreground">{hindi}</span>
        </Label>
        {optional && onSkipToggle && (
          <Button type="button" size="sm" variant={skipped ? "secondary" : "outline"} onClick={onSkipToggle} className="h-7 px-2 text-[11px]">
            {skipped ? "Skipped ✓" : "Skip"}
          </Button>
        )}
      </div>
      {url && !skipped ? (
        <div className="relative">
          <img src={url} alt={label} className="h-28 w-full rounded-lg object-cover border border-border" />
          <button type="button" onClick={onClear} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : skipped ? (
        <p className="text-center text-xs text-muted-foreground py-6">Skipped</p>
      ) : (
        <button type="button" onClick={onPick} disabled={uploading}
          className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-[#FF9933]/50 bg-[#FF9933]/5 hover:bg-[#FF9933]/10 transition-colors">
          <div className="text-center">
            <Upload className="mx-auto h-5 w-5 text-[#FF9933]" />
            <p className="mt-1 text-[11px] font-semibold text-[#1a237e]">{uploading ? "Uploading..." : "Upload"}</p>
          </div>
        </button>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div className="ashoka-watermark tiranga-bg min-h-screen">
        <AppHeader />
        <div className="relative z-10 container mx-auto max-w-2xl px-4 py-8">
          <Card className="mb-6 border-green-india/40 bg-green-50">
            <CardContent className="py-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-14 w-14 text-green-india" />
              <h2 className="mb-1 text-xl font-bold text-foreground">Registration Submitted!</h2>
              <p className="font-hindi text-base text-foreground/80">आपकी दुकान पंजीकरण सफल!</p>
              <p className="mt-3 rounded-lg bg-[#FF9933]/10 px-3 py-2 font-hindi text-sm font-semibold text-[#1a237e]">
                रजिस्ट्रेशन पूरा करने के लिए सब्सक्रिप्शन/भुगतान अनिवार्य है।
              </p>
            </CardContent>
          </Card>
          {renderSubscriptionCard()}
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
                   <Label htmlFor="aadhaarNumber">Aadhaar Number * <span className="font-hindi">(आधार नंबर)</span></Label>
                   <Input id="aadhaarNumber" placeholder="12-digit Aadhaar" value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} maxLength={12} required />
                 </div>
                <div>
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <Input id="shopName" placeholder="e.g., Sai Kirana" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="shopNameHindi">दुकान का नाम (Hindi)</Label>
                  <Input id="shopNameHindi" placeholder="e.g., साई किराना" value={form.shopNameHindi} onChange={(e) => setForm({ ...form, shopNameHindi: e.target.value })} className="font-hindi" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="panNumber">PAN Number * <span className="font-hindi">(पैन नंबर)</span></Label>
                  <Input id="panNumber" placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase().slice(0, 10) })} maxLength={10} required />
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

              {/* Mandatory KYC Documents */}
              <div className="rounded-xl border-2 border-[#1a237e]/20 bg-[#1a237e]/5 p-3 space-y-3">
                <div className="text-center">
                  <p className="font-hindi text-sm font-bold text-[#1a237e]">अनिवार्य KYC दस्तावेज़</p>
                  <p className="text-[11px] text-muted-foreground">Aadhaar (Front + Back) and PAN photos are required</p>
                </div>
                <input type="file" accept="image/*" ref={aadhaarFrontRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-aadhaar-front", setAadhaarFrontUrl)} />
                <input type="file" accept="image/*" ref={aadhaarBackRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-aadhaar-back", setAadhaarBackUrl)} />
                <input type="file" accept="image/*" ref={panRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-pan", setPanUrl)} />
                <input type="file" accept="image/*" ref={gstRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-gst", setGstUrl)} />
                <input type="file" accept="image/*" ref={foodRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-food", setFoodLicenseUrl)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycUploadTile label="Aadhaar Front" hindi="आधार फ्रंट फ़ोटो" url={aadhaarFrontUrl} onPick={() => aadhaarFrontRef.current?.click()} onClear={() => setAadhaarFrontUrl("")} />
                  <KycUploadTile label="Aadhaar Back" hindi="आधार बैक फ़ोटो" url={aadhaarBackUrl} onPick={() => aadhaarBackRef.current?.click()} onClear={() => setAadhaarBackUrl("")} />
                  <KycUploadTile label="PAN Card" hindi="पैन कार्ड फ़ोटो" url={panUrl} onPick={() => panRef.current?.click()} onClear={() => setPanUrl("")} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycUploadTile label="GST Certificate" hindi="GST प्रमाणपत्र" url={gstUrl} onPick={() => gstRef.current?.click()} onClear={() => setGstUrl("")} optional skipped={skipGst} onSkipToggle={() => { setSkipGst((s) => !s); if (!skipGst) setGstUrl(""); }} />
                  <KycUploadTile label="Food License" hindi="फ़ूड लाइसेंस" url={foodLicenseUrl} onPick={() => foodRef.current?.click()} onClear={() => setFoodLicenseUrl("")} optional skipped={skipFood} onSkipToggle={() => { setSkipFood((s) => !s); if (!skipFood) setFoodLicenseUrl(""); }} />
                </div>
                {!kycReady && (
                  <p className="text-center text-[11px] font-semibold text-destructive font-hindi">
                    सबमिट करने के लिए आधार और पैन के सभी फ़ोटो व नंबर भरना अनिवार्य है।
                  </p>
                )}
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

              <Button type="submit" className="w-full" size="lg" disabled={!kycReady || uploading}>
                <Store className="mr-2 h-5 w-5" /> Submit & Continue to Subscription
              </Button>
              <p className="text-center font-hindi text-xs text-muted-foreground">
                रजिस्ट्रेशन पूरा करने के लिए सब्सक्रिप्शन/भुगतान अनिवार्य है।
              </p>
            </form>
          </CardContent>
        </Card>}

        {renderSubscriptionCard()}

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
