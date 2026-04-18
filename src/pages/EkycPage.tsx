import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ShieldCheck, RefreshCw, Loader2, Upload, X, CreditCard, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKycStatus } from "@/hooks/useKycStatus";

type Side = "front" | "back";

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

const EkycPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, rejectionReason, loading, refresh } = useKycStatus();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If approved → redirect home. If pending → show waiting screen. If rejected → allow re-submit.
  useEffect(() => {
    if (!loading && status === "approved") navigate("/", { replace: true });
  }, [status, loading, navigate]);

  useEffect(() => () => stopCamera(), []);

  const handleAadhaarFile = (side: Side, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("कृपया केवल इमेज अपलोड करें • Please upload an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("फ़ाइल बहुत बड़ी है (अधिकतम 5MB) • File too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (side === "front") setAadhaarFront(result);
      else setAadhaarBack(result);
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      setPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
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
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const uploadFile = async (path: string, blob: Blob) => {
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length !== 12) return toast.error("कृपया 12 अंकों का सही आधार नंबर दर्ज करें");
    if (!aadhaarFront || !aadhaarBack) return toast.error("कृपया आधार कार्ड के दोनों तरफ की फोटो अपलोड करें");
    if (!photo) return toast.error("कृपया Live Selfie लें");
    if (!user) return;

    setSubmitting(true);
    try {
      const ts = Date.now();
      const frontPath = `${user.id}/${ts}-aadhaar-front.jpg`;
      const backPath = `${user.id}/${ts}-aadhaar-back.jpg`;
      const selfiePath = `${user.id}/${ts}-selfie.jpg`;

      await Promise.all([
        uploadFile(frontPath, dataUrlToBlob(aadhaarFront)),
        uploadFile(backPath, dataUrlToBlob(aadhaarBack)),
        uploadFile(selfiePath, dataUrlToBlob(photo)),
      ]);

      // If a previous rejected request exists → update it; else insert new.
      const { data: existing } = await supabase
        .from("kyc_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.status === "rejected") {
        const { error } = await supabase
          .from("kyc_requests")
          .update({
            aadhaar_number: digits,
            selfie_url: selfiePath,
            aadhaar_front_url: frontPath,
            aadhaar_back_url: backPath,
            status: "pending",
            rejection_reason: null,
            reviewed_by: null,
            reviewed_at: null,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kyc_requests").insert({
          user_id: user.id,
          aadhaar_number: digits,
          selfie_url: selfiePath,
          aadhaar_front_url: frontPath,
          aadhaar_back_url: backPath,
          status: "pending",
        });
        if (error) throw error;
      }

      toast.success("KYC Submitted Successfully! You can now explore the app while we review your documents.");
      await refresh();
      navigate("/", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAadhaar = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 12);
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  // Pending state — waiting for admin review
  if (status === "pending") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-8 flex items-start justify-center">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10">
              <Clock className="h-7 w-7 text-orange-500" />
            </div>
            <CardTitle className="text-xl">समीक्षा में • Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              आपका KYC एडमिन के पास भेज दिया गया है। स्वीकृत होते ही आपको सूचना मिल जाएगी।
            </p>
            <p className="text-xs text-muted-foreground">
              Your KYC has been submitted. You'll get access once an admin approves it.
            </p>
            <Button className="w-full" onClick={() => navigate("/", { replace: true })}>
              Continue to App • ऐप पर जाएं
            </Button>
            <Button variant="outline" className="w-full" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Check Status
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-8 flex items-start justify-center">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10">
            <ShieldCheck className="h-7 w-7 text-[hsl(var(--primary))]" />
          </div>
          <CardTitle className="text-xl">E-KYC सत्यापन</CardTitle>
          <p className="text-xs text-muted-foreground">सुरक्षित पहचान सत्यापन • Secure Identity Verification</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "rejected" && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-destructive">आपका KYC अस्वीकार हो गया • KYC Rejected</p>
                {rejectionReason && <p className="mt-1 text-muted-foreground">कारण: {rejectionReason}</p>}
                <p className="mt-1 text-muted-foreground">कृपया सही दस्तावेज़ के साथ दोबारा सबमिट करें।</p>
              </div>
            </div>
          )}

          {/* Aadhaar */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">आधार नंबर • Aadhaar Number</label>
            <Input
              inputMode="numeric"
              placeholder="1234 5678 9012"
              value={formatAadhaar(aadhaar)}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
              maxLength={14}
              className="text-lg tracking-widest text-center h-12"
            />
            <p className="text-[11px] text-muted-foreground text-center">12 अंकों का आधार नंबर दर्ज करें</p>
          </div>

          {/* Aadhaar Card Photos */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-[hsl(var(--primary))]" />
              आधार कार्ड फोटो • Aadhaar Card Photo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { side: "front" as Side, label: "Front Side", hindi: "सामने", value: aadhaarFront, setter: setAadhaarFront, ref: frontInputRef },
                { side: "back" as Side, label: "Back Side", hindi: "पीछे", value: aadhaarBack, setter: setAadhaarBack, ref: backInputRef },
              ]).map((item) => (
                <div key={item.side} className="space-y-1">
                  <input
                    ref={item.ref}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleAadhaarFile(item.side, e.target.files?.[0])}
                  />
                  {item.value ? (
                    <div className="relative aspect-[1.6/1] w-full overflow-hidden rounded-xl border-2 border-[hsl(var(--primary))]/40 bg-muted">
                      <img src={item.value} alt={`Aadhaar ${item.label}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => item.setter(null)}
                        className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground shadow"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                        <p className="text-[10px] font-medium text-white">{item.label} • {item.hindi}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => item.ref.current?.click()}
                      className="flex aspect-[1.6/1] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary))]/10"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px] font-semibold leading-tight text-center px-1">
                        Upload Aadhaar<br />{item.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{item.hindi} वाला भाग</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">कैमरा से क्लिक करें या गैलरी से चुनें • Click or choose from gallery</p>
          </div>

          {/* Selfie */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Live Selfie • लाइव सेल्फी</label>
            <div className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Selfie" className="h-full w-full object-cover" />
              ) : cameraOn ? (
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <Camera className="mx-auto h-10 w-10 mb-2 opacity-60" />
                  <p className="text-sm">अपनी फोटो लें</p>
                </div>
              )}
            </div>

            {!cameraOn && !photo && (
              <Button type="button" variant="outline" className="w-full h-11" onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" /> Take Photo • फोटो लें
              </Button>
            )}
            {cameraOn && (
              <Button type="button" className="w-full h-11" onClick={capture}>
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            )}
            {photo && (
              <Button type="button" variant="outline" className="w-full h-11" onClick={startCamera}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retake • दोबारा लें
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 text-base font-semibold bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <><ShieldCheck className="mr-2 h-5 w-5" /> Submit for Verification • सबमिट करें</>
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default EkycPage;
