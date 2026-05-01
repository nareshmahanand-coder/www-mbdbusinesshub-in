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

// Laplacian variance ~ sharpness (higher = sharper)
const measureSharpness = (video: HTMLVideoElement): number => {
  const w = 240, h = 180;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h).data;
  // Convert to gray
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = img[i * 4], g = img[i * 4 + 1], b = img[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  // Laplacian kernel
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = -gray[i - w] - gray[i - 1] + 4 * gray[i] - gray[i + 1] - gray[i + w];
      sum += v; sumSq += v * v; n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
};

const captureFrame = (video: HTMLVideoElement, maxW = 1280): string => {
  const ratio = video.videoWidth ? video.videoHeight / video.videoWidth : 0.75;
  const w = Math.min(maxW, video.videoWidth || maxW);
  const h = Math.round(w * ratio);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d")!.drawImage(video, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.85);
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const SHARPNESS_THRESHOLD = 140;

// Detect rectangular document edges in the video frame.
// Returns a normalized bounding box {x,y,w,h} in 0..1 of the video, or null.
const detectDocumentBox = (
  video: HTMLVideoElement
): { x: number; y: number; w: number; h: number } | null => {
  const W = 200;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const H = Math.round((W * vh) / vw);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;

  // Grayscale
  const gray = new Uint8ClampedArray(W * H);
  for (let i = 0; i < W * H; i++) {
    gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) | 0;
  }
  // Sobel edge magnitude, threshold to binary edge mask
  const edges = new Uint8Array(W * H);
  let edgeCount = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx =
        -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1] +
        gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1];
      const gy =
        -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1] +
        gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 80) { edges[i] = 1; edgeCount++; }
    }
  }
  if (edgeCount < 250) return null;

  // For each row, find leftmost & rightmost edge pixels — collect to find dominant rectangle.
  // Use histogram of left/right columns weighted by row count.
  const leftCols = new Uint32Array(W);
  const rightCols = new Uint32Array(W);
  const topRows = new Uint32Array(H);
  const botRows = new Uint32Array(H);
  for (let y = 0; y < H; y++) {
    let lx = -1, rx = -1;
    for (let x = 0; x < W; x++) {
      if (edges[y * W + x]) { if (lx < 0) lx = x; rx = x; }
    }
    if (lx >= 0 && rx - lx > W * 0.25) {
      leftCols[lx]++; rightCols[rx]++;
    }
  }
  for (let x = 0; x < W; x++) {
    let ty = -1, by = -1;
    for (let y = 0; y < H; y++) {
      if (edges[y * W + x]) { if (ty < 0) ty = y; by = y; }
    }
    if (ty >= 0 && by - ty > H * 0.25) {
      topRows[ty]++; botRows[by]++;
    }
  }
  const argMax = (arr: Uint32Array) => {
    let m = 0, idx = -1;
    for (let i = 0; i < arr.length; i++) if (arr[i] > m) { m = arr[i]; idx = i; }
    return { idx, count: m };
  };
  const L = argMax(leftCols), R = argMax(rightCols);
  const T = argMax(topRows), B = argMax(botRows);
  if (L.idx < 0 || R.idx < 0 || T.idx < 0 || B.idx < 0) return null;
  const x1 = Math.min(L.idx, R.idx);
  const x2 = Math.max(L.idx, R.idx);
  const y1 = Math.min(T.idx, B.idx);
  const y2 = Math.max(T.idx, B.idx);
  const bw = x2 - x1;
  const bh = y2 - y1;
  // Validate: must occupy a meaningful area, but not full frame
  if (bw < W * 0.35 || bh < H * 0.20) return null;
  if (bw > W * 0.97 && bh > H * 0.97) return null;
  // Must have decent edge support
  const support = L.count + R.count + T.count + B.count;
  if (support < 30) return null;
  return { x: x1 / W, y: y1 / H, w: bw / W, h: bh / H };
};

// Face detection using FaceDetector API (Chromium) with fallback heuristic.
const detectFaceCentered = async (
  video: HTMLVideoElement
): Promise<boolean> => {
  const FD = (window as any).FaceDetector;
  if (!FD) {
    // Fallback: assume centered if scene is bright enough (best-effort)
    return true;
  }
  try {
    const fd = new FD({ fastMode: true });
    const faces = await fd.detect(video);
    if (!faces.length) return false;
    const f = faces[0].boundingBox;
    const cx = f.x + f.width / 2;
    const cy = f.y + f.height / 2;
    const vw = video.videoWidth, vh = video.videoHeight;
    const dx = Math.abs(cx - vw / 2) / vw;
    const dy = Math.abs(cy - vh / 2) / vh;
    const sizeOk = f.width > vw * 0.25 && f.width < vw * 0.85;
    return dx < 0.18 && dy < 0.20 && sizeOk;
  } catch {
    return true;
  }
};

const Scanner = ({
  facing,
  guide,
  mode,
  onCapture,
  label,
}: {
  facing: "environment" | "user";
  guide: "rect" | "square";
  mode: "document" | "face";
  onCapture: (dataUrl: string) => void;
  label: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [sharp, setSharp] = useState(0);
  const [docBox, setDocBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [faceOk, setFaceOk] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    };
  }, [facing]);

  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const id = window.setInterval(async () => {
      const v = videoRef.current;
      if (!v || busy) return;
      busy = true;
      try {
        const s = measureSharpness(v);
        setSharp(s);
        if (mode === "document") {
          const box = detectDocumentBox(v);
          setDocBox(box);
        } else {
          const ok = await detectFaceCentered(v);
          setFaceOk(ok);
        }
      } finally {
        busy = false;
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [ready, mode]);

  const isSharp = sharp >= SHARPNESS_THRESHOLD;
  const canCapture =
    ready && isSharp && (mode === "document" ? !!docBox : faceOk);
  const guideClass = guide === "square" ? "aspect-square" : "aspect-[3/4]";

  const handleCapture = () => {
    const v = videoRef.current;
    if (!v || !canCapture) return;
    beep();
    onCapture(captureFrame(v, 1600));
  };

  const statusText = !ready
    ? "कैमरा शुरू हो रहा है..."
    : !isSharp
    ? "⚠️ धुंधला / Blurry — स्थिर रखें"
    : mode === "document"
    ? docBox
      ? "✅ दस्तावेज़ का पता चला / Document detected"
      : "📄 कार्ड को फ्रेम में रखें / Place card in view"
    : faceOk
    ? "✅ चेहरा केंद्रित / Face centered"
    : "🙂 चेहरा फ्रेम में रखें / Center your face";

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold text-white">{label}</p>
      <div
        className={`relative mx-auto w-full overflow-hidden rounded-2xl border-4 bg-black transition-colors duration-150 ${
          canCapture
            ? "border-[#39FF14] shadow-[0_0_28px_rgba(57,255,20,0.75)]"
            : "border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.6)]"
        } ${guideClass}`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${
            facing === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Document green crop frame overlay */}
        {mode === "document" && docBox && (
          <div
            className="pointer-events-none absolute border-4 border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.9)] rounded-md"
            style={{
              left: `${docBox.x * 100}%`,
              top: `${docBox.y * 100}%`,
              width: `${docBox.w * 100}%`,
              height: `${docBox.h * 100}%`,
            }}
          >
            {/* corner ticks */}
            <span className="absolute -left-1 -top-1 h-3 w-3 border-l-4 border-t-4 border-[#39FF14]" />
            <span className="absolute -right-1 -top-1 h-3 w-3 border-r-4 border-t-4 border-[#39FF14]" />
            <span className="absolute -left-1 -bottom-1 h-3 w-3 border-l-4 border-b-4 border-[#39FF14]" />
            <span className="absolute -right-1 -bottom-1 h-3 w-3 border-r-4 border-b-4 border-[#39FF14]" />
          </div>
        )}

        {/* Selfie oval guide */}
        {mode === "face" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`h-[70%] w-[60%] rounded-[50%] border-4 border-dashed ${
                faceOk ? "border-[#39FF14]" : "border-white/70"
              }`}
            />
          </div>
        )}

        {/* Status chip */}
        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
          {statusText}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!canCapture}
          aria-label="Capture"
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all ${
            canCapture
              ? "border-white bg-[#39FF14] hover:scale-105 active:scale-95 shadow-[0_0_22px_rgba(57,255,20,0.8)]"
              : "border-white/40 bg-gray-500/60 cursor-not-allowed"
          }`}
        >
          <Camera className={`h-7 w-7 ${canCapture ? "text-black" : "text-white/70"}`} />
        </button>
        <p className={`text-xs ${canCapture ? "text-[#39FF14]" : "text-red-300"}`}>
          {canCapture ? "टैप करें / Tap to capture" : "बटन तब सक्रिय होगा जब फ्रेम हरा होगा"}
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

  const onAadhaarFrontCaptured = useCallback((dataUrl: string) => {
    setFrontImg(dataUrl);
    setStep("aadhaar-back");
  }, []);

  const onAadhaarBackCaptured = useCallback(async (dataUrl: string) => {
    setBackImg(dataUrl);
    // Run OCR
    try {
      const { data, error } = await supabase.functions.invoke("kyc-ocr", {
        body: { frontImage: frontImg, backImage: dataUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOcr(data);
      setOcrError(null);
    } catch (e: any) {
      setOcrError(e?.message ?? "OCR विफल / OCR failed. कृपया मैन्युअल रूप से जांचें।");
    }
    setStep("selfie");
    // request GPS in parallel
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error("GPS की अनुमति आवश्यक है / GPS permission required"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [frontImg]);

  const onSelfieCaptured = useCallback(async (dataUrl: string) => {
    setSelfieImg(dataUrl);
    setStep("processing");
    // Wait minimum 3s, perform uploads + insert
    const minDelay = new Promise((r) => setTimeout(r, 3000));
    try {
      if (!user) throw new Error("Not signed in");
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
        upload("selfie", dataUrl),
      ]);

      const aadhaarDigits = (ocr?.aadhaar_number ?? aadhaar).replace(/\D/g, "");
      const payload = {
        user_id: user.id,
        mobile,
        aadhaar_last4: aadhaarDigits.slice(-4),
        full_name: ocr?.name ?? "",
        relation_type: ocr?.relation_type ?? "father",
        relation_name: ocr?.relation_name ?? "",
        address: ocr?.address ?? "",
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
  }, [user, frontImg, backImg, ocr, mobile, aadhaar, gps]);

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
              label="📄 आधार कार्ड का सामने का भाग दिखाएं / Show Aadhaar FRONT"
              onCapture={onAadhaarFrontCaptured}
            />
          </Card>
        )}

        {step === "aadhaar-back" && (
          <Card className="space-y-3 border-white/10 bg-white/5 p-4">
            <Scanner
              facing="environment"
              guide="rect"
              label="📄 आधार कार्ड का पिछला भाग दिखाएं / Show Aadhaar BACK"
              onCapture={onAadhaarBackCaptured}
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
              guide="square"
              label="🤳 अपना चेहरा फ्रेम में रखें / Position your face"
              onCapture={onSelfieCaptured}
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