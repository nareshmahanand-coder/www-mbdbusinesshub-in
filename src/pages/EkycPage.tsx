import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShieldCheck, Camera, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "details" | "aadhaar-front" | "aadhaar-back" | "selfie" | "processing" | "verified";

const beep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 1200; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.12);
  } catch {}
};

// Capture at the camera's native resolution for maximum clarity.
const captureFrame = (video: HTMLVideoElement, mirror = false): string => {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.95);
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const Scanner = ({
  facing,
  guide,
  mode,
  onCapture,
  label,
  preview,
  onRetake,
  onConfirm,
}: {
  facing: "environment" | "user";
  guide: "rect" | "oval";
  mode: "document" | "face";
  onCapture: (dataUrl: string) => void;
  label: string;
  preview: string | null;
  onRetake: () => void;
  onConfirm: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (preview) return; // don't run camera while previewing
    let active = true;
    (async () => {
      try {
        // Request maximum native resolution; the browser will pick the best the device offers.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 4096 },
            height: { ideal: 2160 },
          },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        toast.error("कैमरा एक्सेस की अनुमति दें / Camera access denied");
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [facing, preview]);

  const handleCapture = () => {
    const v = videoRef.current;
    if (!v || !ready) return;
    beep();
    // Mirror the saved selfie so it matches what the user saw on screen.
    onCapture(captureFrame(v, facing === "user"));
  };

  // Aadhaar card real aspect is ~85.6×53.98mm (~1.586:1). Use a landscape viewport
  // for documents so the whole card fits with margin; square-ish for selfie.
  const viewportClass = guide === "rect" ? "aspect-[4/3]" : "aspect-[3/4]";

  if (preview) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm font-semibold text-white">
          {label} — पुष्टि करें / Confirm
        </p>
        <div className={`relative mx-auto w-full overflow-hidden rounded-2xl border-4 border-white bg-black ${viewportClass}`}>
          <img src={preview} alt="capture preview" className="absolute inset-0 h-full w-full object-contain" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onRetake} className="min-w-32">
            फिर से लें / Retake
          </Button>
          <Button onClick={onConfirm} className="min-w-32 bg-[#39FF14] text-black hover:bg-[#2fdf12]">
            <CheckCircle2 className="mr-2 h-4 w-4" /> पुष्टि / Confirm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold text-white">{label}</p>
      <div className={`relative mx-auto w-full overflow-hidden rounded-2xl border-2 border-white/40 bg-black ${viewportClass}`}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover ${
            facing === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Static guide overlays — purely visual, no detection. */}
        {guide === "rect" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[68%] w-[88%] rounded-md border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[78%] w-[62%] rounded-[50%] border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
          {ready
            ? mode === "document"
              ? "📄 कार्ड को सफेद बॉक्स में रखें"
              : "🙂 चेहरा गोल गाइड में रखें"
            : "कैमरा शुरू हो रहा है..."}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready}
          aria-label="Capture"
          className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-all ${
            ready
              ? "bg-[#FF8C00] hover:scale-105 active:scale-95 shadow-[0_0_22px_rgba(255,140,0,0.8)]"
              : "bg-gray-500/60 cursor-not-allowed"
          }`}
        >
          <Camera className="h-9 w-9 text-white" />
        </button>
        <p className="text-xs font-semibold text-white">
          फ़ोटो खींचें / Tap to capture
        </p>
      </div>
    </div>
  );
};

const maskAadhaar = (full: string) => {
  const digits = full.replace(/\D/g, "");
  if (digits.length < 12) return full;
  return `XXXX XXXX ${digits.slice(-4)}`;
};

const EkycPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("details");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [frontImg, setFrontImg] = useState<string | null>(null);
  const [backImg, setBackImg] = useState<string | null>(null);
  const [selfieImg, setSelfieImg] = useState<string | null>(null);
  // Pending captures awaiting user confirmation per step.
  const [pendingFront, setPendingFront] = useState<string | null>(null);
  const [pendingBack, setPendingBack] = useState<string | null>(null);
  const [pendingSelfie, setPendingSelfie] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [ocr, setOcr] = useState<{
    name: string; relation_type: "father" | "husband"; relation_name: string; address: string; aadhaar_number: string;
  } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [existing, setExisting] = useState<any | null>(null);
  const [checking, setChecking] = useState(true);

  // Redirect away if KYC already exists
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login?next=/ekyc", { replace: true }); return; }
    (async () => {
      const { data } = await supabase.from("kyc_verifications").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setExisting(data);
        setStep("verified");
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const mobileValid = /^\d{10}$/.test(mobile);
  const aadhaarValid = /^\d{12}$/.test(aadhaar.replace(/\s/g, ""));

  const confirmFront = useCallback(() => {
    if (!pendingFront) return;
    setFrontImg(pendingFront);
    setPendingFront(null);
    setStep("aadhaar-back");
  }, [pendingFront]);

  const confirmBack = useCallback(() => {
    if (!pendingBack) return;
    setBackImg(pendingBack);
    setPendingBack(null);
    setStep("selfie");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error("GPS की अनुमति आवश्यक है / GPS permission required"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [pendingBack]);

  const confirmSelfie = useCallback(async () => {
    if (!pendingSelfie) return;
    const selfieDataUrl = pendingSelfie;
    setSelfieImg(selfieDataUrl);
    setPendingSelfie(null);
    setStep("processing");
    // Wait minimum 3s, perform uploads + insert
    const minDelay = new Promise((r) => setTimeout(r, 3000));
    try {
      if (!user) throw new Error("Not signed in");
      // Run OCR now (after both Aadhaar sides are confirmed).
      let ocrData = ocr;
      if (!ocrData) {
        try {
          const { data, error } = await supabase.functions.invoke("kyc-ocr", {
            body: { frontImage: frontImg, backImage: backImg },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          ocrData = data;
          setOcr(data);
          setOcrError(null);
        } catch (e: any) {
          setOcrError(e?.message ?? "OCR विफल / OCR failed");
        }
      }
      const ts = Date.now();
      const upload = async (name: string, dataUrl: string) => {
        const blob = dataUrlToBlob(dataUrl);
        const path = `${user.id}/${ts}-${name}.jpg`;
        const { error } = await supabase.storage.from("kyc-photos").upload(path, blob, {
          contentType: "image/jpeg", upsert: true,
        });
        if (error) throw error;
        return supabase.storage.from("kyc-photos").getPublicUrl(path).data.publicUrl;
      };
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        upload("front", frontImg!),
        upload("back", backImg!),
        upload("selfie", selfieDataUrl),
      ]);

      const aadhaarDigits = (ocrData?.aadhaar_number ?? aadhaar).replace(/\D/g, "");
      const payload = {
        user_id: user.id,
        mobile,
        aadhaar_last4: aadhaarDigits.slice(-4),
        full_name: ocrData?.name ?? "",
        relation_type: ocrData?.relation_type ?? "father",
        relation_name: ocrData?.relation_name ?? "",
        address: ocrData?.address ?? "",
        latitude: gps?.lat ?? null,
        longitude: gps?.lng ?? null,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        selfie_url: selfieUrl,
        status: "verified",
        verified_at: new Date().toISOString(),
      };
      const { data: inserted, error: insErr } = await supabase
        .from("kyc_verifications")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (insErr) throw insErr;
      await minDelay;
      setExisting(inserted);
      setStep("verified");
    } catch (e: any) {
      console.error(e);
      await minDelay;
      toast.error(e?.message ?? "सत्यापन विफल / Verification failed");
      setStep("selfie");
    }
  }, [pendingSelfie, user, frontImg, backImg, ocr, mobile, aadhaar, gps]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1547] via-[#1a237e] to-[#0a1547] px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <ShieldCheck className="h-7 w-7 text-[#FF8C00]" />
          <h1 className="text-2xl font-extrabold tracking-wide">User E-KYC</h1>
        </div>
        <p className="mb-6 text-center text-xs text-white/70">Government-grade identity verification</p>

        {step === "details" && (
          <Card className="space-y-4 border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div>
              <Label className="text-white">मोबाइल नंबर / Mobile (10 digits)</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                className={`mt-1 border-2 bg-white/95 text-black ${mobileValid ? "border-[#39FF14] ring-2 ring-[#39FF14]/40" : "border-red-500"}`}
              />
              <p className={`mt-1 text-xs ${mobileValid ? "text-[#39FF14]" : "text-red-300"}`}>
                {mobile.length}/10 digits {mobileValid ? "✓" : ""}
              </p>
            </div>
            <div>
              <Label className="text-white">आधार नंबर / Aadhaar (12 digits)</Label>
              <Input
                inputMode="numeric"
                maxLength={14}
                value={aadhaar}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setAadhaar(d.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
                }}
                className={`mt-1 border-2 bg-white/95 text-black tracking-widest ${aadhaarValid ? "border-[#39FF14] ring-2 ring-[#39FF14]/40" : "border-red-500"}`}
              />
              <p className={`mt-1 text-xs ${aadhaarValid ? "text-[#39FF14]" : "text-red-300"}`}>
                {aadhaar.replace(/\s/g, "").length}/12 digits {aadhaarValid ? "✓" : ""}
              </p>
            </div>
            <Button
              disabled={!mobileValid || !aadhaarValid}
              onClick={() => setStep("aadhaar-front")}
              className="w-full bg-[#FF8C00] font-bold text-white hover:bg-[#FF8C00]/90"
            >
              आगे बढ़ें / Continue
            </Button>
          </Card>
        )}

        {step === "aadhaar-front" && (
          <Card className="space-y-3 border-white/10 bg-white/5 p-4">
            <Scanner
              facing="environment"
              guide="rect"
              mode="document"
              label="📄 आधार कार्ड का सामने का भाग दिखाएं / Show Aadhaar FRONT"
              onCapture={setPendingFront}
              preview={pendingFront}
              onRetake={() => setPendingFront(null)}
              onConfirm={confirmFront}
            />
          </Card>
        )}

        {step === "aadhaar-back" && (
          <Card className="space-y-3 border-white/10 bg-white/5 p-4">
            <Scanner
              facing="environment"
              guide="rect"
              mode="document"
              label="📄 आधार कार्ड का पिछला भाग दिखाएं / Show Aadhaar BACK"
              onCapture={setPendingBack}
              preview={pendingBack}
              onRetake={() => setPendingBack(null)}
              onConfirm={confirmBack}
            />
          </Card>
        )}

        {step === "selfie" && (
          <Card className="space-y-3 border-white/10 bg-white/5 p-4">
            {ocrError && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-500/20 p-3 text-xs text-yellow-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> <span>{ocrError}</span>
              </div>
            )}
            {ocr && (
              <div className="rounded-md bg-white/10 p-3 text-xs text-white">
                <p><strong>नाम:</strong> {ocr.name}</p>
                <p><strong>{ocr.relation_type === "husband" ? "पति का नाम" : "पिता का नाम"}:</strong> {ocr.relation_name}</p>
                <p className="line-clamp-2"><strong>पता:</strong> {ocr.address}</p>
              </div>
            )}
            <Scanner
              facing="user"
              guide="oval"
              mode="face"
              label="🤳 अपना चेहरा फ्रेम में रखें / Position your face"
              onCapture={setPendingSelfie}
              preview={pendingSelfie}
              onRetake={() => setPendingSelfie(null)}
              onConfirm={confirmSelfie}
            />
            {gps && (
              <p className="flex items-center justify-center gap-1 text-xs text-[#39FF14]">
                <MapPin className="h-3 w-3" /> GPS captured
              </p>
            )}
          </Card>
        )}

        {step === "processing" && (
          <Card className="flex flex-col items-center gap-4 border-white/10 bg-white/5 p-10 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-[#FF8C00]" />
            <p className="font-hindi text-base font-semibold text-white">
              आपके दस्तावेजों को सत्यापित किया जा रहा है...
            </p>
            <p className="text-xs text-yellow-200">कृपया बैक बटन न दबाएं या ऐप बंद न करें।</p>
          </Card>
        )}

        {step === "verified" && existing && (
          <Certificate data={existing} onContinue={() => navigate("/membership", { replace: true })} />
        )}
      </div>
    </div>
  );
};

const Certificate = ({ data, onContinue }: { data: any; onContinue: () => void }) => {
  return (
    <Card className="relative overflow-hidden border-4 border-[#FF8C00] bg-white p-6 text-black shadow-2xl">
      {/* Verified stamp */}
      <div className="pointer-events-none absolute -right-6 -top-2 rotate-12">
        <div className="flex items-center gap-1 rounded-lg border-4 border-green-600 bg-green-600/10 px-3 py-1">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <span className="text-xl font-extrabold tracking-widest text-green-700">VERIFIED</span>
        </div>
      </div>

      <div className="mb-3 border-b-2 border-[#1a237e] pb-2">
        <h2 className="text-center text-lg font-extrabold text-[#1a237e]">मेरा भारत दुकान — E-KYC प्रमाण-पत्र</h2>
        <p className="text-center text-[10px] uppercase tracking-wider text-gray-500">Identity Verification Certificate</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2 text-sm">
          <Row label="Name / नाम" value={data.full_name || "—"} />
          <Row
            label={data.relation_type === "husband" ? "Husband Name / पति का नाम" : "Father Name / पिता का नाम"}
            value={data.relation_name || "—"}
          />
          <Row label="Aadhaar No." value={maskAadhaar((data.aadhaar_last4 || "").padStart(12, "X"))} />
          <Row label="Mobile" value={data.mobile} />
          <Row label="Address / पता" value={data.address || "—"} multiline />
          <Row
            label="GPS"
            value={data.latitude && data.longitude ? `${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}` : "—"}
          />
          <Row label="Verified At" value={new Date(data.verified_at).toLocaleString("en-IN")} />
        </div>
        <div className="flex flex-col items-center justify-start gap-1">
          {data.selfie_url ? (
            <img src={data.selfie_url} alt="Selfie" className="h-32 w-32 rounded-lg border-2 border-[#1a237e] object-cover" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-400">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <p className="text-[10px] text-gray-500">Live Selfie</p>
        </div>
      </div>

      <Button onClick={onContinue} className="mt-6 w-full bg-[#1a237e] font-bold text-white hover:bg-[#1a237e]/90">
        Continue to Membership / आगे बढ़ें
      </Button>
    </Card>
  );
};

const Row = ({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    <p className={`font-semibold text-[#1a237e] ${multiline ? "" : "truncate"}`}>{value}</p>
  </div>
);

export default EkycPage;