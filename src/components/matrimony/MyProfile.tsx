import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Crown, Image, Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { MatrimonyProfile } from "@/pages/MatrimonyPage";
import { startMarriageBureauPaymentLink, syncLatestRazorpayPayment } from "@/lib/razorpayPayments";

interface Props {
  user: any;
  myProfile: MatrimonyProfile | null;
  onReload: () => void;
}

const MatrimonyMyProfile = ({ user, myProfile, onReload }: Props) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [failedPlan, setFailedPlan] = useState<"monthly" | "yearly" | null>(null);
  const [syncingPlan, setSyncingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [successRedirect, setSuccessRedirect] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>("");
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>("");
  const [panUrl, setPanUrl] = useState<string>("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [kycUploading, setKycUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", height: "", education: "",
    profession: "", city: "", about_me: "", family_background: "",
    hobbies: "", job_details: "",
  });

  useEffect(() => {
    if (myProfile) {
      setForm({
        name: myProfile.name, gender: myProfile.gender, dob: myProfile.dob || "",
        height: myProfile.height, education: myProfile.education, profession: myProfile.profession,
        city: myProfile.city, about_me: myProfile.about_me, family_background: myProfile.family_background || "",
        hobbies: myProfile.hobbies || "", job_details: myProfile.job_details || "",
      });
      setAadhaarFrontUrl(myProfile.aadhaar_front_url || "");
      setAadhaarBackUrl(myProfile.aadhaar_back_url || "");
      setPanUrl(myProfile.pan_url || "");
      setAadhaarNumber(myProfile.aadhaar_number || "");
      setPanNumber(myProfile.pan_number || "");
    }
  }, [myProfile]);

  const isAadhaarValid = /^\d{12}$/.test(aadhaarNumber);
  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase());
  const kycReady = !!aadhaarFrontUrl && !!aadhaarBackUrl && !!panUrl && isAadhaarValid && isPanValid;

  const handleKycUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    setter: (url: string) => void,
  ) => {
    if (!user) { toast.error("Please login first"); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    setKycUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/matrimony-${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setKycUploading(false); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    setter(urlData.publicUrl);
    toast.success("Document uploaded!");
    setKycUploading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !myProfile) { toast.error("Please create profile first"); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/matrimony-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    const newPhotos = [...(myProfile.photos || []), urlData.publicUrl];
    await supabase.from("matrimony_profiles").update({ photos: newPhotos }).eq("id", myProfile.id);
    toast.success("Photo uploaded!");
    setUploading(false);
    onReload();
  };


  const handlePremiumPayment = async (plan: "monthly" | "yearly") => {
    if (!user) { toast.error("Please login first"); return; }
    if (!myProfile) { toast.error("Please create profile first"); return; }

    setPayingPlan(plan);
    setFailedPlan(null);

    try {
      await startMarriageBureauPaymentLink({
        plan,
        onSuccess: () => {
          toast.success("Payment Successful — Marriage Bureau Premium अब Active है!");
          onReload();
          navigate("/dashboard", { replace: true });
        },
        onFailure: () => setFailedPlan(plan),
      });
    } catch (error) {
      setFailedPlan(plan);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please retry.");
    } finally {
      setPayingPlan(null);
    }
  };

  const handleManualSync = async (plan: "monthly" | "yearly") => {
    setSyncingPlan(plan);
    try {
      const result = await syncLatestRazorpayPayment({ module: "marriage_bureau", plan });
      if (result.ok) {
        toast.success("Payment Successful — Marriage Bureau Premium अब Active है!");
        onReload();
        navigate("/dashboard", { replace: true });
      } else {
        toast.info(result.error || "Payment confirmation is still pending. Please try again shortly.");
      }
    } finally {
      setSyncingPlan(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isAadhaarValid) { toast.error("कृपया मान्य 12-अंकीय आधार नंबर दर्ज करें"); return; }
    if (!isPanValid) { toast.error("कृपया मान्य PAN नंबर दर्ज करें (ABCDE1234F)"); return; }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) { toast.error("आधार कार्ड के दोनों फ़ोटो अपलोड करें"); return; }
    if (!panUrl) { toast.error("PAN कार्ड का फ़ोटो अपलोड करें"); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      updated_at: new Date().toISOString(),
      aadhaar_number: aadhaarNumber,
      aadhaar_front_url: aadhaarFrontUrl,
      aadhaar_back_url: aadhaarBackUrl,
      pan_number: panNumber.toUpperCase(),
      pan_url: panUrl,
    };
    if (myProfile) {
      const { error } = await supabase.from("matrimony_profiles").update(payload).eq("id", myProfile.id);
      if (error) toast.error("Save failed"); else {
        toast.success("Profile updated! कृपया सब्सक्रिप्शन चुनें।");
        onReload();
        setTimeout(() => document.getElementById("matrimony-subscription")?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } else {
      const { error } = await supabase.from("matrimony_profiles").insert(payload);
      if (error) toast.error("Save failed"); else {
        toast.success("Profile created! कृपया सब्सक्रिप्शन चुनें।");
        onReload();
        setTimeout(() => document.getElementById("matrimony-subscription")?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    }
    setSaving(false);
  };

  const KycTile = ({
    label, hindi, url, onPick, onClear,
  }: { label: string; hindi: string; url: string; onPick: () => void; onClear: () => void; }) => (
    <div className="rounded-xl border-2 border-dashed border-border p-2 bg-white/60">
      <div className="mb-1.5">
        <p className="text-xs font-semibold">{label} <span className="text-destructive">*</span></p>
        <p className="font-hindi text-[10px] text-muted-foreground">{hindi}</p>
      </div>
      {url ? (
        <div className="relative">
          <img src={url} alt={label} className="h-24 w-full rounded-lg object-cover border border-border" />
          <button type="button" onClick={onClear} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={onPick} disabled={kycUploading}
          className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-[#FF9933]/50 bg-[#FF9933]/5 hover:bg-[#FF9933]/10">
          <div className="text-center">
            <Upload className="mx-auto h-4 w-4 text-[#FF9933]" />
            <p className="mt-0.5 text-[10px] font-semibold text-[#1a237e]">{kycUploading ? "Uploading..." : "Upload"}</p>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <Card className="max-w-lg mx-auto bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-[hsl(340,60%,35%)]" /> My Matrimony Profile
        </CardTitle>
        {myProfile && (
          <Badge className={myProfile.is_published
            ? "bg-[hsl(140,60%,35%)] text-white border-0"
            : "bg-muted text-muted-foreground border-0"}>
            {myProfile.is_published ? "Published ✓" : "Unpublished — Subscribe to publish"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        <Select value={form.gender} onValueChange={v => setForm(f => ({...f, gender: v}))}>
          <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <label className="text-xs text-muted-foreground">Date of Birth</label>
          <Input type="date" value={form.dob} onChange={e => setForm(f => ({...f, dob: e.target.value}))} />
        </div>
        <Input placeholder={"Height (e.g. 5'8\")"} value={form.height} onChange={e => setForm(f => ({...f, height: e.target.value}))} />
        <Input placeholder="Education" value={form.education} onChange={e => setForm(f => ({...f, education: e.target.value}))} />
        <Input placeholder="Profession" value={form.profession} onChange={e => setForm(f => ({...f, profession: e.target.value}))} />
        <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
        <Textarea placeholder="Job Details (कार्य विवरण)" value={form.job_details} onChange={e => setForm(f => ({...f, job_details: e.target.value}))} rows={2} />
        <Textarea placeholder="Family Background (पारिवारिक पृष्ठभूमि)" value={form.family_background} onChange={e => setForm(f => ({...f, family_background: e.target.value}))} rows={2} />
        <Textarea placeholder="Hobbies (शौक)" value={form.hobbies} onChange={e => setForm(f => ({...f, hobbies: e.target.value}))} rows={2} />
        <Textarea placeholder="About Me (अपने बारे में)..." value={form.about_me} onChange={e => setForm(f => ({...f, about_me: e.target.value}))} rows={3} />

        {/* Mandatory KYC */}
        <div className="rounded-xl border-2 border-[#1a237e]/20 bg-[#1a237e]/5 p-3 space-y-3">
          <div className="text-center">
            <p className="font-hindi text-sm font-bold text-[#1a237e]">अनिवार्य KYC दस्तावेज़</p>
            <p className="text-[11px] text-muted-foreground">Aadhaar (Front + Back) और PAN फ़ोटो अनिवार्य हैं</p>
          </div>
          <Input
            placeholder="Aadhaar Number * (12 digits)"
            value={aadhaarNumber}
            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
            maxLength={12}
          />
          <Input
            placeholder="PAN Number * (ABCDE1234F)"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
            maxLength={10}
          />
          <input type="file" accept="image/*" ref={aadhaarFrontRef} className="hidden" onChange={(e) => handleKycUpload(e, "aadhaar-front", setAadhaarFrontUrl)} />
          <input type="file" accept="image/*" ref={aadhaarBackRef} className="hidden" onChange={(e) => handleKycUpload(e, "aadhaar-back", setAadhaarBackUrl)} />
          <input type="file" accept="image/*" ref={panRef} className="hidden" onChange={(e) => handleKycUpload(e, "pan", setPanUrl)} />
          <div className="grid gap-2 grid-cols-3">
            <KycTile label="Aadhaar Front" hindi="आधार फ्रंट" url={aadhaarFrontUrl} onPick={() => aadhaarFrontRef.current?.click()} onClear={() => setAadhaarFrontUrl("")} />
            <KycTile label="Aadhaar Back" hindi="आधार बैक" url={aadhaarBackUrl} onPick={() => aadhaarBackRef.current?.click()} onClear={() => setAadhaarBackUrl("")} />
            <KycTile label="PAN Card" hindi="पैन कार्ड" url={panUrl} onPick={() => panRef.current?.click()} onClear={() => setPanUrl("")} />
          </div>
          {!kycReady && (
            <p className="text-center text-[11px] font-semibold text-destructive font-hindi">
              सेव करने के लिए आधार और पैन के सभी फ़ोटो व नंबर भरना अनिवार्य है।
            </p>
          )}
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Photos (फोटो)</label>
          {myProfile?.photos && myProfile.photos.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {myProfile.photos.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i+1}`} className="h-16 w-16 rounded-xl object-cover border border-border" />
              ))}
            </div>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || !myProfile}>
            <Image className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>
          {!myProfile && <p className="text-[10px] text-muted-foreground mt-1">Create profile first to upload photos</p>}
        </div>

        <Button onClick={handleSave} disabled={saving || !kycReady || kycUploading} className="w-full bg-[hsl(340,60%,25%)] hover:bg-[hsl(340,60%,30%)] text-white">
          {saving ? "Saving..." : myProfile ? "Update & Continue to Subscription" : "Create & Continue to Subscription"}
        </Button>
        <p className="text-center font-hindi text-[11px] text-muted-foreground">
          रजिस्ट्रेशन पूरा करने के लिए सब्सक्रिप्शन/भुगतान अनिवार्य है।
        </p>

        {/* Marriage Bureau Premium */}
        <div
          id="matrimony-subscription"
          className="mt-4 overflow-hidden rounded-2xl border-2 border-[#138808]/40 shadow-sm"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="bg-gradient-to-b from-[#FF9933]/5 to-[#138808]/5 p-5">
            <div className="flex flex-col items-center text-center">
              <Crown className="h-7 w-7 text-[#FF9933]" />
              <h3 className="mt-2 text-lg font-extrabold font-hindi text-[hsl(340,60%,30%)]">
                मैरिज ब्यूरो प्रीमियम
              </h3>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                🇮🇳 Verified Profiles • Unlimited Contacts 🇮🇳
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800">
              <p className="font-hindi font-bold">मैरिज ब्यूरो प्रीमियम क्यों चुनें?</p>
              <p className="mt-1 font-hindi">
                प्रोफेशनल मेंबरशिप में आपको{" "}
                <strong className="text-[#FF9933]">सत्यापित प्रोफाइल्स (Verified Profiles)</strong> तक सीधी पहुँच,{" "}
                <strong className="text-[#FF9933]">असीमित संपर्क विवरण</strong> और प्राथमिकता के आधार पर मैचमेकिंग सहायता मिलती है। Yearly: ₹999 Plan चुने।
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => handlePremiumPayment("monthly")}
                disabled={payingPlan !== null}
                className="w-full rounded-xl bg-[#FF9933] px-4 py-4 text-base font-extrabold text-white shadow-md"
              >
                {payingPlan === "monthly" ? "Processing..." : "Marriage Bureau ₹99 Monthly Plan"}
              </button>
              <button
                type="button"
                onClick={() => handlePremiumPayment("yearly")}
                disabled={payingPlan !== null}
                className="w-full rounded-xl bg-[#138808] px-4 py-4 text-base font-extrabold text-white shadow-md"
              >
                {payingPlan === "yearly" ? "Processing..." : "Marriage Bureau ₹999 Yearly Plan"}
              </button>
            </div>

            <p className="mt-3 text-center font-hindi text-[11px] text-gray-600">
              सुरक्षित Razorpay पेमेंट के बाद आपकी verified profile publish हो जाएगी और unlimited contacts unlock होंगे।
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default MatrimonyMyProfile;
