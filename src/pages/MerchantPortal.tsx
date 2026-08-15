import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shopCategories } from "@/data/sampleShops";
import { Store, CheckCircle, HelpCircle, Image, Upload, X, Crown, ShieldCheck, Eye } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MerchantPremiumLinkButton } from "@/components/MerchantPremiumLinkButton";
import { attachAgentReferral } from "@/lib/agentReferral";

const MerchantPortal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const accessMessage = (location.state as { accessMessage?: string } | null)?.accessMessage;
  const [submitted, setSubmitted] = useState(false);

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
  const aadhaarFrontCamRef = useRef<HTMLInputElement>(null);
  const aadhaarBackCamRef = useRef<HTMLInputElement>(null);
  const panCamRef = useRef<HTMLInputElement>(null);
  const gstCamRef = useRef<HTMLInputElement>(null);
  const foodCamRef = useRef<HTMLInputElement>(null);
  const shopPhotoCamRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    shopName: "", shopNameHindi: "", category: "", address: "",
    pincode: "", whatsapp: "", phone: "", description: "", ownerName: "",
    aadhaarNumber: "", panNumber: "",
  });

  const handleFileUpload = async (
    file: File,
    folder: string,
    opts: { private?: boolean } = {},
  ): Promise<string | null> => {
    if (!user) { toast.error("Please login first"); return null; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    // Sensitive merchant documents go to the private `kyc-photos` bucket
    // (admin-only access via signed URLs). Shop/product photos stay public.
    const bucket = opts.private ? "kyc-photos" : "uploads";
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return null; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
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
    const url = await handleFileUpload(file, folder, { private: true });
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
    const { data: created, error } = await supabase.from("merchant_profiles").insert({
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
    }).select("id").maybeSingle();
    if (error) { toast.error("Shop registration failed"); return; }
    await attachAgentReferral({
      merchantUserId: user.id,
      merchantProfileId: created?.id ?? null,
      shopName: form.shopName,
    }).catch(() => {});
    toast.success("मुफ़्त रजिस्ट्रेशन सफल! आप चाहें तो प्रीमियम में अपग्रेड कर सकते हैं।");
    setSubmitted(true);
  };

  const KycUploadTile = ({
    label, hindi, url, onPick, onCamera, onClear, optional, skipped, onSkipToggle,
  }: { label: string; hindi: string; url: string; onPick: () => void; onCamera?: () => void; onClear: () => void; optional?: boolean; skipped?: boolean; onSkipToggle?: () => void; }) => (
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
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onPick} disabled={uploading}
            className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-[#FF9933]/50 bg-[#FF9933]/5 hover:bg-[#FF9933]/10 transition-colors">
            <div className="text-center">
              <Upload className="mx-auto h-5 w-5 text-[#FF9933]" />
              <p className="mt-1 text-[11px] font-semibold text-[#1a237e]">{uploading ? "Uploading..." : "गैलरी"}</p>
            </div>
          </button>
          <button type="button" onClick={onCamera} disabled={uploading}
            className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-[#138808]/50 bg-[#138808]/5 hover:bg-[#138808]/10 transition-colors">
            <div className="text-center">
              <Camera className="mx-auto h-5 w-5 text-[#138808]" />
              <p className="mt-1 text-[11px] font-semibold text-[#1a237e]">{uploading ? "Uploading..." : "कैमरा"}</p>
            </div>
          </button>
        </div>
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
              <h2 className="mb-1 text-xl font-bold text-foreground">Free Registration Complete!</h2>
              <p className="font-hindi text-base text-foreground/80">आपकी दुकान का मुफ़्त पंजीकरण सफल!</p>
              <p className="mt-3 rounded-lg bg-[#138808]/10 px-3 py-2 font-hindi text-sm font-semibold text-[#138808]">
                अतिरिक्त लाभ चाहिए? नीचे से प्रीमियम में अपग्रेड करें (वैकल्पिक)।
              </p>
              <Button asChild className="mt-4" size="lg">
                <a href="/merchant-dashboard">Continue to Dashboard</a>
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
          <p className="mt-1 text-sm text-muted-foreground">Free Registration • 0% Commission • Direct payments</p>
          <p className="mt-2 inline-block rounded-full bg-[#138808]/10 px-3 py-1 font-hindi text-xs font-bold text-[#138808]">
            कोई भी मुफ़्त रजिस्टर कर सकता है — प्रीमियम वैकल्पिक है।
          </p>
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
                <input type="file" accept="image/*" capture="environment" ref={aadhaarFrontCamRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-aadhaar-front", setAadhaarFrontUrl)} />
                <input type="file" accept="image/*" capture="environment" ref={aadhaarBackCamRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-aadhaar-back", setAadhaarBackUrl)} />
                <input type="file" accept="image/*" capture="environment" ref={panCamRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-pan", setPanUrl)} />
                <input type="file" accept="image/*" capture="environment" ref={gstCamRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-gst", setGstUrl)} />
                <input type="file" accept="image/*" capture="environment" ref={foodCamRef} className="hidden" onChange={(e) => handleKycUpload(e, "kyc-food", setFoodLicenseUrl)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycUploadTile label="Aadhaar Front" hindi="आधार फ्रंट फ़ोटो" url={aadhaarFrontUrl} onPick={() => aadhaarFrontRef.current?.click()} onCamera={() => aadhaarFrontCamRef.current?.click()} onClear={() => setAadhaarFrontUrl("")} />
                  <KycUploadTile label="Aadhaar Back" hindi="आधार बैक फ़ोटो" url={aadhaarBackUrl} onPick={() => aadhaarBackRef.current?.click()} onCamera={() => aadhaarBackCamRef.current?.click()} onClear={() => setAadhaarBackUrl("")} />
                  <KycUploadTile label="PAN Card" hindi="पैन कार्ड फ़ोटो" url={panUrl} onPick={() => panRef.current?.click()} onCamera={() => panCamRef.current?.click()} onClear={() => setPanUrl("")} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KycUploadTile label="GST Certificate" hindi="GST प्रमाणपत्र" url={gstUrl} onPick={() => gstRef.current?.click()} onCamera={() => gstCamRef.current?.click()} onClear={() => setGstUrl("")} optional skipped={skipGst} onSkipToggle={() => { setSkipGst((s) => !s); if (!skipGst) setGstUrl(""); }} />
                  <KycUploadTile label="Food License" hindi="फ़ूड लाइसेंस" url={foodLicenseUrl} onPick={() => foodRef.current?.click()} onCamera={() => foodCamRef.current?.click()} onClear={() => setFoodLicenseUrl("")} optional skipped={skipFood} onSkipToggle={() => { setSkipFood((s) => !s); if (!skipFood) setFoodLicenseUrl(""); }} />
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
                <input type="file" accept="image/*" capture="environment" ref={shopPhotoCamRef} className="hidden" onChange={handleShopPhotoUpload} />
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => shopPhotoRef.current?.click()} disabled={uploading}
                    className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary">
                    <div className="text-center">
                      <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "गैलरी / Gallery"}</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => shopPhotoCamRef.current?.click()} disabled={uploading}
                    className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary">
                    <div className="text-center">
                      <Camera className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "कैमरा / Camera"}</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!kycReady || uploading}
                className="w-full h-14 text-base font-extrabold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #138808 0%, #1a237e 100%)" }}
              >
                <Store className="mr-2 h-5 w-5" /> Free Registration • मुफ़्त रजिस्ट्रेशन
              </Button>
              <p className="text-center font-hindi text-xs text-muted-foreground">
                रजिस्ट्रेशन बिल्कुल मुफ़्त है। प्रीमियम लेना वैकल्पिक है।
              </p>
            </form>
          </CardContent>
        </Card>}

        <Card className="mb-8">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h3 className="font-hindi text-lg font-semibold">मदद और सहायता • Help Desk</h3>
            <p className="font-hindi text-sm text-muted-foreground">मदद के लिए यहाँ संपर्क करें:</p>
            <a href="mailto:helpline.bharatdukaan@gmail.com" className="text-sm font-medium text-primary underline underline-offset-2">helpline.bharatdukaan@gmail.com</a>
            <Button variant="outline" asChild><a href="/help"><HelpCircle className="mr-2 h-4 w-4" /> Help Desk</a></Button>
          </CardContent>
        </Card>

        <div className="mb-8 overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-b from-orange-50/60 via-white to-green-50/60 shadow-sm">
          <div className="h-1.5 w-full bg-orange-400" />
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col items-center text-center">
              <Crown className="h-8 w-8 text-orange-500" strokeWidth={2.25} />
              <h2 className="mt-3 font-hindi text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
                मर्चेंट पोर्टल प्रीमियम • Merchant Premium
              </h2>
              <p className="mt-2 text-xs font-bold tracking-wide text-green-700 sm:text-sm">
                OPTIONAL UPGRADE • <span className="font-hindi">वैकल्पिक अपग्रेड</span>
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-orange-200 bg-white px-4 py-4">
              <p className="font-hindi text-sm leading-relaxed text-gray-800 sm:text-base">
                <span className="font-bold">रजिस्ट्रेशन पूरी तरह मुफ्त है।</span>{" "}
                प्रीमियम लेना ज़रूरी नहीं है — लेकिन प्रीमियम मर्चेंट बनने पर आपको ज़ीरो कमीशन बिक्री, एडवांस वेंडर डैशबोर्ड और अपनी दुकान को प्राथमिकता के साथ लिस्ट करने की सुविधा मिलती है।
              </p>
            </div>

            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-3 font-hindi text-sm text-gray-800 sm:text-base">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>0% कमीशन — पूरी कमाई आपकी।</span>
              </li>
              <li className="flex items-start gap-3 font-hindi text-sm text-gray-800 sm:text-base">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>दुकान के नाम के साथ <strong>'Verified'</strong> का निशान।</span>
              </li>
              <li className="flex items-start gap-3 font-hindi text-sm text-gray-800 sm:text-base">
                <Eye className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span>प्राथमिकता लिस्टिंग — सबसे ऊपर दिखेंगे।</span>
              </li>
            </ul>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MerchantPremiumLinkButton
                paymentUrl="https://rzp.io/rzp/md63vYt8"
                plan="monthly"
                buttonText="Merchant Portal ₹99 Monthly Plan"
                buttonClassName="w-full rounded-2xl bg-orange-500 px-4 py-5 text-base font-bold leading-tight text-white shadow-sm transition-all hover:bg-orange-600"
              />
              <MerchantPremiumLinkButton
                paymentUrl="https://rzp.io/rzp/gdhg7YC4"
                plan="yearly"
                buttonText="Merchant Portal ₹999 Yearly Plan"
                buttonClassName="w-full rounded-2xl bg-green-600 px-4 py-5 text-base font-bold leading-tight text-white shadow-sm transition-all hover:bg-green-700"
              />
            </div>
          </div>
          <div className="h-1.5 w-full bg-green-500" />
        </div>
      </div>
    </div>
  );
};

export default MerchantPortal;
