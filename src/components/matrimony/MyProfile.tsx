import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Crown, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import KycDocUpload from "@/components/KycDocUpload";
import type { MatrimonyProfile } from "@/pages/MatrimonyPage";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";

interface Props {
  user: any;
  myProfile: MatrimonyProfile | null;
  onReload: () => void;
}

const MatrimonyMyProfile = ({ user, myProfile, onReload }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [failedPlan, setFailedPlan] = useState<"monthly" | "yearly" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aadharUrl, setAadharUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", height: "", education: "",
    profession: "", city: "", about_me: "", family_background: "",
    hobbies: "", job_details: "",
  });

  useEffect(() => {
    if (myProfile) {
      setAadharUrl(myProfile.aadhar_url || "");
      setPanUrl(myProfile.pan_url || "");
      setForm({
        name: myProfile.name, gender: myProfile.gender, dob: myProfile.dob || "",
        height: myProfile.height, education: myProfile.education, profession: myProfile.profession,
        city: myProfile.city, about_me: myProfile.about_me, family_background: myProfile.family_background || "",
        hobbies: myProfile.hobbies || "", job_details: myProfile.job_details || "",
      });
    }
  }, [myProfile]);

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
      await startInstantRazorpayPayment({
        module: "marriage_bureau",
        plan,
        onSuccess: () => {
          toast.success("Payment successful — profile published!");
          onReload();
          window.location.reload();
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

  const handleSave = async () => {
    if (!user) return;
    if (!aadharUrl) { toast.error("कृपया आधार कार्ड की फोटो अपलोड करें"); return; }
    if (!panUrl) { toast.error("कृपया पैन कार्ड की फोटो अपलोड करें"); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id, aadhar_url: aadharUrl, pan_url: panUrl, updated_at: new Date().toISOString() };
    if (myProfile) {
      const { error } = await supabase.from("matrimony_profiles").update(payload).eq("id", myProfile.id);
      if (error) toast.error("Save failed"); else { toast.success("Profile updated!"); onReload(); }
    } else {
      const { error } = await supabase.from("matrimony_profiles").insert(payload);
      if (error) toast.error("Save failed"); else { toast.success("Profile created!"); onReload(); }
    }
    setSaving(false);
  };

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

        {/* KYC Documents */}
        <div className="rounded-xl border border-border bg-[hsl(340,20%,97%)] p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">📄 KYC Documents • <span className="font-hindi">दस्तावेज़ सत्यापन</span></p>
          <div className="grid gap-3 sm:grid-cols-2">
            <KycDocUpload label="Aadhar Card" labelHindi="आधार कार्ड" required value={aadharUrl} onChange={setAadharUrl} userId={user?.id || ""} folder="kyc-aadhar" />
            <KycDocUpload label="PAN Card" labelHindi="पैन कार्ड" required value={panUrl} onChange={setPanUrl} userId={user?.id || ""} folder="kyc-pan" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[hsl(340,60%,25%)] hover:bg-[hsl(340,60%,30%)] text-white">
          {saving ? "Saving..." : myProfile ? "Update Profile" : "Create Profile"}
        </Button>

        {myProfile && !myProfile.is_published && (
          <Card
            className="overflow-hidden border-0 shadow-lg"
            style={{
              borderTop: "5px solid #FF9933",
              borderBottom: "5px solid #138808",
              borderLeft: "2px solid #FF9933",
              borderRight: "2px solid #138808",
            }}
          >
            <CardContent className="p-5 space-y-4 bg-gradient-to-br from-[#FF9933]/10 via-white to-[#138808]/10">
              <div className="text-center space-y-1">
                <Crown className="mx-auto h-9 w-9 text-[#FF9933]" />
                <h4 className="font-extrabold text-[#1a237e] font-hindi text-base">
                  मैरिज ब्यूरो प्रीमियम
                </h4>
                <p className="text-[11px] text-muted-foreground font-semibold tracking-wide">
                  🇮🇳 Verified Profiles • Unlimited Contacts 🇮🇳
                </p>
              </div>

              <div className="rounded-xl bg-white border-2 border-[#1a237e]/20 p-3">
                <p className="font-bold text-xs text-[#1a237e] mb-1.5 font-hindi">
                  मैरिज ब्यूरो प्रीमियम क्यों चुनें?
                </p>
                <p className="font-hindi text-[12px] leading-relaxed text-foreground">
                  प्रोफेशनल मेंबरशिप में आपको <span className="font-bold text-[#FF9933]">सत्यापित प्रोफाइल्स (Verified Profiles)</span> तक सीधी पहुँच, <span className="font-bold text-[#138808]">असीमित संपर्क विवरण</span> और प्राथमिकता के आधार पर मैचमेकिंग सहायता मिलती है। Yearly: ₹99 प्लान चुनें।
                </p>
              </div>

              <Button
                type="button"
                onClick={() => handlePremiumPayment("yearly")}
                disabled={payingPlan !== null}
                className="w-full h-13 py-3 text-sm font-extrabold text-white shadow-lg rounded-xl font-hindi relative"
                style={{ backgroundColor: "#138808" }}
              >
                <span className="absolute -top-2 right-3 rounded-full bg-[#FF9933] px-2 py-0.5 text-[9px] font-bold text-white">
                  BEST VALUE
                </span>
                {payingPlan === "yearly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yearly: ₹99"}
              </Button>

              {failedPlan && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePremiumPayment(failedPlan)}
                  disabled={payingPlan !== null}
                  className="w-full h-10 text-sm font-bold border-[#1a237e] text-[#1a237e] rounded-lg"
                >
                  Retry Payment
                </Button>
              )}

              <p className="text-center text-[10px] text-muted-foreground font-hindi">
                सुरक्षित Razorpay पेमेंट के बाद आपकी verified profile publish हो जाएगी और unlimited contacts unlock होंगे।
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default MatrimonyMyProfile;
