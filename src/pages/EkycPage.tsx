import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShieldCheck, Camera, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { persistKycVerifiedMarker } from "@/lib/capacitorSessionBridge";
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

const dataUrlToJpegBlob = (dataUrl: string, maxSide = 1800, quality = 0.88): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Image processing failed"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("Invalid captured image"));
    img.src = dataUrl;
  });

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
  const location = useLocation();
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
  // Promise that resolves once OCR has finished (success or failure). confirmSelfie awaits this
  // so the certificate is never saved with empty Name/Father/Address fields.
  const ocrPromiseRef = useRef<Promise<any | null> | null>(null);
  const membershipRedirectTimerRef = useRef<number | null>(null);
  const redirectingToMembershipRef = useRef(false);

  const goToMembership = useCallback(() => {
    if (redirectingToMembershipRef.current) return;
    redirectingToMembershipRef.current = true;
    try { navigate("/membership", { replace: true }); } catch {}
    window.setTimeout(() => {
      if (window.location.pathname !== "/membership") window.location.replace("/membership");
    }, 120);
  }, [navigate]);

  const scheduleMembershipRedirect = useCallback((delay = 2200) => {
    if (membershipRedirectTimerRef.current) window.clearTimeout(membershipRedirectTimerRef.current);
    membershipRedirectTimerRef.current = window.setTimeout(goToMembership, delay);
  }, [goToMembership]);

  useEffect(() => () => {
    if (membershipRedirectTimerRef.current) window.clearTimeout(membershipRedirectTimerRef.current);
  }, []);

  // Show the saved certificate only for a currently-valid KYC. Re-KYC/expired/pending
  // records must reopen the real upload form, not the certificate page.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/ekyc${location.search}`)}`, { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase.from("kyc_verifications").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const forceUpload = new URLSearchParams(location.search).get("mode") === "upload";
        const valid =
          data.status === "verified" &&
          !data.re_kyc_requested_at &&
          (!data.kyc_expires_at || new Date(data.kyc_expires_at).getTime() > Date.now());
        if (valid && !forceUpload) {
          setExisting(data);
          setStep("verified");
          void persistKycVerifiedMarker(user.id);
          scheduleMembershipRedirect();
        } else {
          setExisting(null);
          setMobile(data.mobile || "");
          const savedAadhaar = String(data.aadhaar_full || "").replace(/\D/g, "").slice(0, 12);
          if (savedAadhaar) setAadhaar(savedAadhaar.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
          setStep("details");
        }
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate, location.search, scheduleMembershipRedirect]);

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
    const backDataUrl = pendingBack;
    setBackImg(backDataUrl);
    setPendingBack(null);
    setStep("selfie");
    // Kick off OCR in the background using the captured front + back images.
    // Store the promise so confirmSelfie can await it before saving the certificate.
    ocrPromiseRef.current = (async () => {
      try {
        if (!frontImg) return null;
        const { data, error } = await supabase.functions.invoke("kyc-ocr", {
          body: { frontImage: frontImg, backImage: backDataUrl },
        });
        if (error) throw error;
        if (data?.name || data?.address) {
          const parsed = {
            name: data.name ?? "",
            relation_type: (data.relation_type === "husband" ? "husband" : "father") as "father" | "husband",
            relation_name: data.relation_name ?? "",
            address: data.address ?? "",
            aadhaar_number: data.aadhaar_number ?? aadhaar.replace(/\D/g, ""),
          };
          setOcr(parsed);
          setOcrError(null);
          return parsed;
        }
        return null;
      } catch (e: any) {
        console.warn("[ekyc] OCR failed, will use manual data:", e?.message);
        setOcrError("OCR सेवा उपलब्ध नहीं — manual data used");
        return null;
      }
    })();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error("GPS की अनुमति आवश्यक है / GPS permission required"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [pendingBack, frontImg, aadhaar]);

  const confirmSelfie = useCallback(async () => {
    if (!pendingSelfie) return;
    const selfieDataUrl = pendingSelfie;
    setSelfieImg(selfieDataUrl);
    setPendingSelfie(null);
    setStep("processing");
    try {
      if (!user) throw new Error("Not signed in");
      const aadhaarDigits = aadhaar.replace(/\D/g, "");
      // Wait for the background OCR to finish so Name/Father/Address are populated.
      let resolvedOcr = ocr;
      if (!resolvedOcr && ocrPromiseRef.current) {
        const fromPromise = await ocrPromiseRef.current;
        if (fromPromise) resolvedOcr = fromPromise;
      }
      const relType = resolvedOcr?.relation_type === "husband" ? "husband" : "father";
      // Strict duplicate check: same aadhaar / mobile cannot belong to another user
      const { data: dupRes, error: dupErr } = await (supabase as any).rpc("check_kyc_duplicate", {
        p_aadhaar: aadhaarDigits,
        p_mobile: mobile,
      });
      if (dupErr) {
        console.error("[ekyc] duplicate check failed", dupErr);
      } else if (dupRes?.duplicate) {
        toast.error(dupRes.message || "Duplicate entry detected");
        setStep("details");
        return;
      }
      // Upload selfie + aadhaar front/back to storage so admin certificate can show real images.
      const uploadDataUrl = async (dataUrl: string | null, name: string, capturedAt: number): Promise<string> => {
        if (!dataUrl) throw new Error(`${name} photo is missing`);
        try {
          const blob = await dataUrlToJpegBlob(dataUrl).catch(() => dataUrlToBlob(dataUrl));
          const path = `${user.id}/${capturedAt}-${name}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("kyc-photos")
            .upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("kyc-photos").getPublicUrl(path);
          if (!pub?.publicUrl) throw new Error(`${name} public URL missing`);
          return pub.publicUrl;
        } catch (e: any) {
          console.error("kyc upload exception", name, e);
          throw new Error(`${name} photo upload failed: ${e?.message || "storage error"}`);
        }
      };
      const capturedAt = Date.now();
      const [selfieUrl, frontUrl, backUrl] = await Promise.all([
        uploadDataUrl(selfieDataUrl, "selfie", capturedAt),
        uploadDataUrl(frontImg, "aadhaar-front", capturedAt),
        uploadDataUrl(backImg, "aadhaar-back", capturedAt),
      ]);
      const payload = {
        user_id: user.id,
        mobile,
        aadhaar_full: aadhaarDigits,
        aadhaar_last4: aadhaarDigits.slice(-4),
        full_name: resolvedOcr?.name ?? "",
        relation_type: relType,
        relation_name: resolvedOcr?.relation_name ?? "",
        address: resolvedOcr?.address ?? "",
        latitude: gps?.lat ?? null,
        longitude: gps?.lng ?? null,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        selfie_url: selfieUrl,
        status: "verified",
        verified_at: new Date().toISOString(),
        kyc_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        re_kyc_requested_at: null,
      };
      const { data: inserted, error: insErr } = await supabase
        .from("kyc_verifications")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (insErr) throw insErr;
      // Mirror mobile into profiles.phone so Admin Messaging Center
      // (WhatsApp / Email auto-fill) can use the saved number.
      try {
        await supabase
          .from("profiles")
          .update({ phone: mobile, phone_verified: true, phone_verified_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch (e) {
        console.warn("[ekyc] profile phone sync failed", e);
      }
      setExisting({
        ...inserted,
        selfie_preview: selfieDataUrl,
        aadhaar_front_preview: frontImg,
        aadhaar_back_preview: backImg,
      });
      setStep("verified");
      // Persist marker in localStorage + native Preferences so Android WebView
      // cannot loop back to KYC while the database cache catches up.
      await persistKycVerifiedMarker(user.id);
      // Auto-open Bharat Gaurav Membership after a brief certificate view.
      scheduleMembershipRedirect();
    } catch (e: any) {
      console.error("[ekyc] verification failed:", e);
      toast.error(e?.message ?? "सत्यापन विफल / Verification failed");
      // Restore the captured selfie into the preview state so the user can re-confirm
      // instead of being thrown back to a blank camera (which felt like a loop).
      setPendingSelfie(selfieDataUrl);
      setSelfieImg(null);
      setStep("selfie");
    }
  }, [pendingSelfie, user, ocr, mobile, aadhaar, gps, frontImg, backImg, scheduleMembershipRedirect]);

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
          <Certificate data={existing} onContinue={goToMembership} />
        )}
      </div>
    </div>
  );
};

const Certificate = ({ data, onContinue }: { data: any; onContinue: () => void }) => {
  const aadhaarDigits = String(data.aadhaar_full || "").replace(/\D/g, "");
  const aadhaarFormatted =
    aadhaarDigits.length === 12
      ? `${aadhaarDigits.slice(0, 4)} ${aadhaarDigits.slice(4, 8)} ${aadhaarDigits.slice(8, 12)}`
      : data.aadhaar_last4
        ? `XXXX XXXX ${data.aadhaar_last4}`
        : "—";
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
          <div className="rounded-md border-2 border-[#1a237e] bg-[#1a237e]/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Aadhaar No. / आधार संख्या</p>
            <p className="text-lg font-extrabold tracking-[0.2em] text-[#1a237e]">{aadhaarFormatted}</p>
          </div>
          <Row label="Mobile / मोबाइल" value={data.mobile} />
          <Row label="Address / पता" value={data.address || "—"} multiline />
          <Row
            label="GPS"
            value={data.latitude && data.longitude ? `${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}` : "—"}
          />
          <Row label="Verified At" value={new Date(data.verified_at).toLocaleString("en-IN")} />
        </div>
        <div className="flex flex-col items-center justify-start gap-1">
          {data.selfie_preview || data.selfie_url ? (
            <img src={data.selfie_preview || data.selfie_url} alt="Selfie" className="h-32 w-32 rounded-lg border-2 border-[#1a237e] object-cover" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-400">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <p className="text-[10px] text-gray-500">Live Selfie</p>
        </div>
      </div>

      {/* Aadhaar Front/Back previews */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-dashed border-gray-300 pt-3">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Aadhaar Front / सामने</p>
          {data.aadhaar_front_preview || data.aadhaar_front_url ? (
            <img
              src={data.aadhaar_front_preview || data.aadhaar_front_url}
              alt="Aadhaar Front"
              className="h-24 w-full rounded-md border-2 border-gray-300 object-cover"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-[10px] text-gray-400">
              No image
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Aadhaar Back / पीछे</p>
          {data.aadhaar_back_preview || data.aadhaar_back_url ? (
            <img
              src={data.aadhaar_back_preview || data.aadhaar_back_url}
              alt="Aadhaar Back"
              className="h-24 w-full rounded-md border-2 border-gray-300 object-cover"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-[10px] text-gray-400">
              No image
            </div>
          )}
        </div>
      </div>

      <Button onClick={onContinue} className="mt-6 w-full bg-[#1a237e] font-bold text-white hover:bg-[#1a237e]/90">
        आगे बढ़ें — भारत गौरव मेंबरशिप / Continue to Membership
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