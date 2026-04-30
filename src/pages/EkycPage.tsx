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
          )}

          <section className="rounded-lg border border-border bg-background p-4">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" /> Aadhaar Verification
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Enter Aadhaar Number <span className="font-hindi text-muted-foreground">(आधार कार्ड नंबर डालें)</span></label>
                <Input
                  inputMode="numeric"
                  placeholder="1234 5678 9012"
                  value={formatAadhaar(aadhaar)}
                  onChange={(e) => {
                    if (aadhaarVerified) return;
                    setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12));
                    if (otpSent) {
                      setOtpSent(false);
                      setSurepassClientId(null);
                      setOtp("");
                    }
                  }}
                  maxLength={14}
                  disabled={aadhaarVerified}
                  className="h-12 text-center text-lg font-bold tracking-widest"
                />
              </div>

              {/* Surepass OTP step */}
              {!aadhaarVerified && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-bold text-foreground">
                    Step 1: Verify Aadhaar via OTP <span className="font-hindi text-muted-foreground">(आधार OTP से सत्यापन)</span>
                  </p>
                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={sendAadhaarOtp}
                      disabled={sendingOtp || aadhaar.replace(/\D/g, "").length !== 12}
                      className="h-11 w-full font-bold"
                    >
                      {sendingOtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</> : <>OTP भेजें • Send OTP</>}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="font-hindi text-xs text-muted-foreground">
                        आधार से लिंक मोबाइल नंबर पर भेजा गया 6 अंकों का OTP दर्ज करें
                      </p>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, ""))}>
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={resendCooldown > 0 || sendingOtp}
                          onClick={sendAadhaarOtp}
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                        </Button>
                        <Button
                          type="button"
                          onClick={verifyAadhaarOtp}
                          disabled={verifyingOtp || otp.length !== 6}
                          className="font-bold"
                        >
                          {verifyingOtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify OTP"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {aadhaarVerified && (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div className="text-xs">
                      <p className="font-bold text-green-700">✓ आधार सत्यापित • Aadhaar Verified via Surepass</p>
                      {verifiedProfile?.full_name && (
                        <p className="mt-1 text-foreground"><span className="font-semibold">Name:</span> {verifiedProfile.full_name}</p>
                      )}
                      {verifiedProfile?.dob && (
                        <p className="text-foreground"><span className="font-semibold">DOB:</span> {verifiedProfile.dob}</p>
                      )}
                      {verifiedProfile?.aadhaar_last4 && (
                        <p className="text-foreground"><span className="font-semibold">Aadhaar:</span> XXXX XXXX {verifiedProfile.aadhaar_last4}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {!aadhaarVerified && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-muted/30 p-4 text-center">
              <p className="text-sm font-bold text-foreground">Step 2 & 3 locked</p>
              <p className="mt-1 font-hindi text-xs text-muted-foreground">
                आधार OTP सत्यापन पूरा होने के बाद Document Upload और Selfie सेक्शन दिखेंगे
              </p>
            </div>
          )}

          {aadhaarVerified && (
          <>
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <Upload className="h-5 w-5 text-primary" /> Document Upload System
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {documentSlots.map((item) => {
                const isPdf = item.value?.startsWith("data:application/pdf");
                return (
                  <div key={item.target} className="rounded-lg border border-border bg-background p-3">
                    <input ref={item.inputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => handleFile(item.target, e.target.files?.[0])} />
                    <input id={`capture-${item.target}`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(item.target, e.target.files?.[0])} />
                    <p className="mb-2 text-sm font-bold text-foreground">{item.title}</p>
                    <p className="mb-3 font-hindi text-xs text-muted-foreground">{item.hindi}</p>
                    {item.value ? (
                      <div className="relative aspect-[1.6/1] overflow-hidden rounded-md border border-primary/30 bg-muted">
                        {isPdf ? <div className="flex h-full items-center justify-center text-sm font-bold text-primary">PDF Uploaded</div> : <img src={item.value} alt={item.title} className="h-full w-full object-cover" />}
                        <button type="button" onClick={() => setImageValue(item.target, null)} className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground" aria-label="Remove upload">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => document.getElementById(`capture-${item.target}`)?.click()}>
                          <Camera className="h-5 w-5" /> Capture
                        </Button>
                        <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => item.inputRef.current?.click()}>
                          <Upload className="h-5 w-5" /> Gallery
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <UserCheck className="h-5 w-5 text-primary" /> Selfie Verification
            </h2>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 font-hindi text-xs font-semibold text-foreground">
              सुनिश्चित करें कि फोटो में आपका चेहरा और आधार कार्ड साफ़ दिख रहा हो
            </div>

            {cameraOn && (
              <div className="rounded-lg border border-primary/30 bg-background p-3">
                <div className="aspect-square overflow-hidden rounded-md bg-muted">
                  <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" onClick={capture} className="font-bold"><Camera className="mr-2 h-4 w-4" /> Capture</Button>
                  <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {selfieSlots.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.target} className="rounded-lg border border-border bg-background p-3">
                    <input ref={item.inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFile(item.target, e.target.files?.[0])} />
                    <p className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground"><Icon className="h-4 w-4 text-primary" /> {item.title}</p>
                    <p className="mb-3 font-hindi text-xs text-muted-foreground">{item.hindi}</p>
                    {item.value ? (
                      <div className="relative aspect-square overflow-hidden rounded-md border border-primary/30 bg-muted">
                        <img src={item.value} alt={item.title} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setImageValue(item.target, null)} className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground" aria-label="Remove selfie">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => startCamera(item.target)} disabled={cameraOn}>
                          <Camera className="h-5 w-5" /> Capture
                        </Button>
                        <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => item.inputRef.current?.click()}>
                          <Upload className="h-5 w-5" /> Gallery
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <Button onClick={handleSubmit} disabled={submitting || !canSubmit} className="h-14 w-full text-base font-extrabold shadow-lg">
            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><ShieldCheck className="mr-2 h-5 w-5" /> Submit KYC</>}
          </Button>
          </>
          )}
        </CardContent>
      </div>
    </main>
  );
};

export default EkycPage;
