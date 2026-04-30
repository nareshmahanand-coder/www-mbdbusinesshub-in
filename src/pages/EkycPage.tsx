import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ShieldCheck, RefreshCw, Loader2, Upload, X, CreditCard, AlertCircle, Clock, Landmark, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKycStatus } from "@/hooks/useKycStatus";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type DocSide = "front" | "back";
type SelfieKind = "selfie" | "selfieWithAadhaar";

type CaptureTarget = DocSide | SelfieKind;

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const EkycPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, rejectionReason, loading, refresh } = useKycStatus();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);
  const selfieWithAadhaarInputRef = useRef<HTMLInputElement | null>(null);

  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieWithAadhaar, setSelfieWithAadhaar] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Surepass Aadhaar OTP state
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [surepassClientId, setSurepassClientId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState<{ full_name?: string; dob?: string; gender?: string; aadhaar_last4?: string | null } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  const sendAadhaarOtp = async () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length !== 12) return toast.error("कृपया 12 अंकों का सही आधार नंबर दर्ज करें");
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("surepass-aadhaar-otp", {
        body: { aadhaar_number: digits },
      });
      if (error) throw error;
      if (!data?.ok || !data?.client_id) throw new Error(data?.error || "OTP भेजने में त्रुटि");
      setSurepassClientId(data.client_id);
      setOtpSent(true);
      setResendCooldown(30);
      toast.success("OTP आपके आधार से लिंक मोबाइल पर भेज दिया गया है");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OTP भेजने में त्रुटि";
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyAadhaarOtp = async () => {
    if (otp.length !== 6) return toast.error("कृपया 6 अंकों का OTP दर्ज करें");
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("surepass-aadhaar-verify", {
        body: { client_id: surepassClientId || "sandbox", otp },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "OTP सत्यापन विफल");
      setAadhaarVerified(true);
      setVerifiedProfile(data.profile || null);
      toast.success("✓ Aadhaar Verified — Redirecting to Membership");
      await refresh();
      setTimeout(() => navigate("/membership", { replace: true }), 600);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OTP सत्यापन विफल";
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  const setImageValue = (target: CaptureTarget, value: string | null) => {
    if (target === "front") setAadhaarFront(value);
    if (target === "back") setAadhaarBack(value);
    if (target === "selfie") setSelfie(value);
    if (target === "selfieWithAadhaar") setSelfieWithAadhaar(value);
  };

  const handleFile = (target: CaptureTarget, file?: File) => {
    if (!file) return;
    const allowPdf = target === "front" || target === "back";
    const allowed = allowPdf ? ["image/jpeg", "image/jpg", "image/png", "application/pdf"] : ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error(allowPdf ? "केवल JPEG, PNG या PDF फ़ाइल अपलोड करें" : "केवल JPEG या PNG फोटो अपलोड करें");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("फ़ाइल बहुत बड़ी है (अधिकतम 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageValue(target, reader.result as string);
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
    setCaptureTarget(null);
  };

  const startCamera = async (target: CaptureTarget) => {
    try {
      setImageValue(target, null);
      setCaptureTarget(target);
      const facingMode = target === "front" || target === "back" || target === "selfieWithAadhaar" ? "environment" : "user";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 900 }, height: { ideal: 900 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      toast.error("कैमरा एक्सेस नहीं मिला • Camera access denied");
      setCaptureTarget(null);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !captureTarget) return;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    setImageValue(captureTarget, canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const uploadFile = async (path: string, blob: Blob) => {
    const { error } = await supabase.storage.from("kyc-documents").upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length !== 12) return toast.error("कृपया 12 अंकों का सही आधार नंबर दर्ज करें");
    if (!aadhaarVerified) return toast.error("कृपया पहले OTP द्वारा अपना आधार सत्यापित करें");
    if (!aadhaarFront || !aadhaarBack) return toast.error("कृपया आधार कार्ड के Front और Back दोनों अपलोड करें");
    if (!selfie) return toast.error("कृपया अपनी साफ सेल्फी फोटो डालें");
    if (!selfieWithAadhaar) return toast.error("कृपया आधार कार्ड हाथ में पकड़कर सेल्फी डालें");
    if (!user) return;

    setSubmitting(true);
    try {
      const ts = Date.now();
      const frontPath = `${user.id}/${ts}-aadhaar-front.jpg`;
      const backPath = `${user.id}/${ts}-aadhaar-back.jpg`;
      const selfiePath = `${user.id}/${ts}-selfie.jpg`;
      const selfieWithAadhaarPath = `${user.id}/${ts}-selfie-with-aadhaar.jpg`;

      await Promise.all([
        uploadFile(frontPath, dataUrlToBlob(aadhaarFront)),
        uploadFile(backPath, dataUrlToBlob(aadhaarBack)),
        uploadFile(selfiePath, dataUrlToBlob(selfie)),
        uploadFile(selfieWithAadhaarPath, dataUrlToBlob(selfieWithAadhaar)),
      ]);

      const { data: existing } = await supabase
        .from("kyc_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload = {
        aadhaar_number: digits,
        aadhaar_linked_mobile: "",
        selfie_url: selfiePath,
        selfie_with_aadhaar_url: selfieWithAadhaarPath,
        aadhaar_front_url: frontPath,
        aadhaar_back_url: backPath,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      };

      if (existing && existing.status === "rejected") {
        const { error } = await supabase.from("kyc_requests").update(payload as never).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("kyc_requests")
          .insert({ user_id: user.id, ...payload } as never)
          .select("id")
          .single();
        if (error) throw error;

        if (inserted?.id) {
          supabase.functions.invoke("kyc-auto-verify", { body: { kycRequestId: inserted.id } }).catch(() => {});
        }
      }

      toast.success("KYC Submitted — Processing...");
      await wait(2000);
      await refresh();
      navigate("/membership", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const canSubmit = aadhaarVerified && aadhaar.replace(/\D/g, "").length === 12 && aadhaarFront && aadhaarBack && selfie && selfieWithAadhaar;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main className="flex min-h-screen items-start justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md border border-primary/20 shadow-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">KYC Processing</h1>
            <p className="font-hindi text-sm text-muted-foreground">आपका e-KYC जमा हो गया है। अब भारत गौरव मेंबरशिप पूरा करें।</p>
            <Button className="h-12 w-full font-bold" onClick={() => navigate("/membership", { replace: true })}>
              Bharat Gaurav Membership पर जाएं
            </Button>
            <Button variant="outline" className="w-full" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Check Status
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const documentSlots = [
    { target: "front" as const, title: "Aadhaar Front Side", hindi: "आधार सामने का भाग", value: aadhaarFront, inputRef: frontInputRef },
    { target: "back" as const, title: "Aadhaar Back Side", hindi: "आधार पीछे का भाग", value: aadhaarBack, inputRef: backInputRef },
  ];

  const selfieSlots = [
    { target: "selfie" as const, title: "Upload Your Selfie", hindi: "अपनी एक साफ़ सेल्फी फोटो डालें", value: selfie, inputRef: selfieInputRef, icon: UserCheck },
    { target: "selfieWithAadhaar" as const, title: "Selfie with Aadhaar", hindi: "आधार कार्ड को हाथ में पकड़कर अपनी एक सेल्फी फोटो डालें", value: selfieWithAadhaar, inputRef: selfieWithAadhaarInputRef, icon: ShieldCheck },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-primary/20 bg-card shadow-2xl">
        <header className="bg-primary px-5 py-6 text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <Landmark className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">आधिकारिक ई-केवाईसी (Official e-KYC)</h1>
              <p className="mt-1 font-hindi text-sm text-primary-foreground/90">आपकी सुरक्षा और पहचान के लिए ई-केवाईसी अनिवार्य है।</p>
            </div>
          </div>
        </header>

        <CardContent className="space-y-6 p-5">
          {status === "rejected" && (
            <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="text-xs">
                <p className="font-semibold text-destructive">आपका KYC अस्वीकार हो गया • KYC Rejected</p>
                {rejectionReason && <p className="mt-1 text-muted-foreground">कारण: {rejectionReason}</p>}
                <p className="mt-1 text-muted-foreground">कृपया सही दस्तावेज़ के साथ दोबारा सबमिट करें।</p>
              </div>
            </div>
          <section className="rounded-lg border border-border bg-background p-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" /> Aadhaar Verification
            </h2>

            <div className="space-y-5">
              {/* Aadhaar Number + Send OTP */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Aadhaar Number <span className="font-hindi text-muted-foreground">(आधार नंबर)</span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    inputMode="numeric"
                    placeholder="1234 5678 9012"
                    value={formatAadhaar(aadhaar)}
                    onChange={(e) => {
                      if (aadhaarVerified) return;
                      setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12));
                    }}
                    maxLength={14}
                    disabled={aadhaarVerified}
                    className="h-12 flex-1 text-center text-lg font-bold tracking-widest sm:text-left"
                  />
                  <Button
                    type="button"
                    onClick={sendAadhaarOtp}
                    disabled={sendingOtp || aadhaarVerified || aadhaar.replace(/\D/g, "").length !== 12 || resendCooldown > 0}
                    className="h-12 font-bold sm:w-44"
                  >
                    {sendingOtp ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : otpSent ? (
                      "Resend OTP"
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              </div>

              {/* OTP Box — always visible */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Enter 6-Digit OTP <span className="font-hindi text-muted-foreground">(6 अंकों का OTP)</span>
                </label>
                <div className="flex justify-center rounded-lg border border-border bg-muted/30 py-3">
                  <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, ""))} disabled={aadhaarVerified}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg font-bold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Sandbox mode: any 6 digits will be accepted as success
                </p>
              </div>

              {/* Verify & Proceed */}
              <Button
                type="button"
                onClick={verifyAadhaarOtp}
                disabled={verifyingOtp || aadhaarVerified || otp.length !== 6 || aadhaar.replace(/\D/g, "").length !== 12}
                className="h-14 w-full text-base font-extrabold shadow-lg"
              >
                {verifyingOtp ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                ) : aadhaarVerified ? (
                  <><ShieldCheck className="mr-2 h-5 w-5" /> Verified — Redirecting...</>
                ) : (
                  <><ShieldCheck className="mr-2 h-5 w-5" /> Verify & Proceed</>
                )}
              </Button>

              {aadhaarVerified && (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-center text-xs font-bold text-green-700">
                  ✓ Aadhaar Verified — Taking you to Bharat Gaurav Membership
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </div>
    </main>
  );
};

export default EkycPage;
