import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, RefreshCw, Loader2, AlertCircle, Clock, Landmark, Camera, X, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKycStatus } from "@/hooks/useKycStatus";

type DocKey = "aadhaar_front" | "aadhaar_back" | "selfie";

const DocUpload = ({
  label, labelHindi, value, onChange, userId, folder, disabled,
}: {
  label: string; labelHindi: string; value: string; onChange: (path: string) => void;
  userId: string; folder: DocKey; disabled?: boolean;
}) => {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File too large (max 5 MB)");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    onChange(path);
    toast.success(`${label} uploaded`);
    setUploading(false);
  };
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-xs font-bold text-foreground">
        {label} <span className="font-hindi text-muted-foreground">({labelHindi})</span>
        <span className="text-sm text-destructive">*</span>
      </label>
      {value ? (
        <div className="relative inline-block">
          <div className="flex h-24 w-32 items-center justify-center rounded-lg border-2 border-primary/40 bg-primary/5">
            <FileCheck className="h-8 w-8 text-primary" />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="mt-1 text-[10px] font-bold text-primary">✓ Uploaded</p>
        </div>
      ) : (
        <label className="flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="text-xs">{uploading ? "Uploading…" : `Take/Upload ${label}`}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading || disabled}
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
};

const EkycPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, rejectionReason, loading, refresh } = useKycStatus();

  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [frontPath, setFrontPath] = useState("");
  const [backPath, setBackPath] = useState("");
  const [selfiePath, setSelfiePath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatAadhaar = (v: string) => v.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  const aadhaarDigits = aadhaar.replace(/\D/g, "");
  const mobileDigits = mobile.replace(/\D/g, "");
  const canSubmit =
    aadhaarDigits.length === 12 &&
    mobileDigits.length === 10 &&
    !!frontPath && !!backPath && !!selfiePath &&
    !submitting;

  const submit = async () => {
    if (!user) return toast.error("Login required");
    if (!canSubmit) return toast.error("कृपया सभी फ़ील्ड भरें और दस्तावेज़ अपलोड करें");
    setSubmitting(true);
    try {
      // Remove any prior request for this user (rejected/none) so we have one current row
      await supabase.from("kyc_requests").delete().eq("user_id", user.id);

      const { error } = await supabase.from("kyc_requests").insert({
        user_id: user.id,
        aadhaar_number: aadhaarDigits,
        aadhaar_linked_mobile: mobileDigits,
        aadhaar_front_url: frontPath,
        aadhaar_back_url: backPath,
        selfie_url: selfiePath,
        selfie_with_aadhaar_url: selfiePath,
        status: "pending",
      });
      if (error) throw error;

      // Also persist the mobile on the profile for admin view
      await supabase.from("profiles").update({ phone: mobileDigits }).eq("id", user.id);

      toast.success("✓ KYC जमा हो गया — Admin समीक्षा करेगा");
      await refresh();
      setTimeout(() => navigate("/dashboard", { replace: true }), 600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (status === "pending" || status === "approved") {
    const isApproved = status === "approved";
    return (
      <main className="flex min-h-screen items-start justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-primary/20 bg-card shadow-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {isApproved ? <ShieldCheck className="h-8 w-8 text-primary" /> : <Clock className="h-8 w-8 text-primary" />}
            </div>
            <h1 className="text-xl font-extrabold text-foreground">
              {isApproved ? "KYC Approved" : "KYC Submitted — Pending Review"}
            </h1>
            <p className="font-hindi text-sm text-muted-foreground">
              {isApproved
                ? "आपका KYC स्वीकृत हो गया है।"
                : "आपका KYC जमा हो गया है। Admin द्वारा समीक्षा की जा रही है। आप dashboard का उपयोग कर सकते हैं।"}
            </p>
            <Button className="h-12 w-full font-bold" onClick={() => navigate("/dashboard", { replace: true })}>
              Dashboard पर जाएं
            </Button>
            <Button variant="outline" className="w-full" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Check Status
            </Button>
          </CardContent>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-primary/20 bg-card shadow-2xl">
        <header className="bg-primary px-5 py-6 text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <Landmark className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">Aadhaar e-KYC</h1>
              <p className="mt-1 font-hindi text-sm text-primary-foreground/90">पहचान सत्यापन • Manual Verification</p>
            </div>
          </div>
        </header>

        <CardContent className="space-y-5 p-5">
          {status === "rejected" && (
            <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="text-xs">
                <p className="font-semibold text-destructive">KYC Rejected</p>
                {rejectionReason && <p className="mt-1 text-muted-foreground">कारण: {rejectionReason}</p>}
                <p className="mt-1 text-muted-foreground">कृपया दोबारा सही दस्तावेज़ जमा करें।</p>
              </div>
            </div>
          )}

          <section className="space-y-4 rounded-lg border border-border bg-background p-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Aadhaar Number <span className="font-hindi text-muted-foreground">(आधार नंबर)</span>
              </label>
              <Input
                inputMode="numeric"
                placeholder="1234 5678 9012"
                value={formatAadhaar(aadhaar)}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                maxLength={14}
                className="h-12 text-center text-lg font-bold tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Mobile Number <span className="font-hindi text-muted-foreground">(मोबाइल नंबर)</span>
              </label>
              <Input
                inputMode="numeric"
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                className="h-12 text-center text-lg font-bold tracking-widest"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DocUpload
                label="Aadhaar Front"
                labelHindi="आधार सामने"
                value={frontPath}
                onChange={setFrontPath}
                userId={user?.id || ""}
                folder="aadhaar_front"
              />
              <DocUpload
                label="Aadhaar Back"
                labelHindi="आधार पीछे"
                value={backPath}
                onChange={setBackPath}
                userId={user?.id || ""}
                folder="aadhaar_back"
              />
            </div>

            <DocUpload
              label="Selfie"
              labelHindi="अपनी फोटो"
              value={selfiePath}
              onChange={setSelfiePath}
              userId={user?.id || ""}
              folder="selfie"
            />

            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-14 w-full text-base font-extrabold shadow-lg"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting…</>
              ) : (
                <><ShieldCheck className="mr-2 h-5 w-5" /> Submit KYC & Continue</>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Admin द्वारा review के बाद approve / reject किया जाएगा। तब तक आप dashboard का उपयोग कर सकते हैं।
            </p>
          </section>
        </CardContent>
      </div>
    </main>
  );
};

export default EkycPage;
