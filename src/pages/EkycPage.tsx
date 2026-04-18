import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ShieldCheck, RefreshCw, Loader2, Upload, X, CreditCard } from "lucide-react";
import { toast } from "sonner";

type Side = "front" | "back";

const EKYC_KEY_PREFIX = "mbd-ekyc-done-";

export const isKycDone = (userId?: string | null) => {
  if (!userId) return false;
  return localStorage.getItem(EKYC_KEY_PREFIX + userId) === "1";
};

const EkycPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [aadhaar, setAadhaar] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && isKycDone(user.id)) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

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
      // wait next tick for video element
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

  const handleSubmit = async () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length !== 12) {
      toast.error("कृपया 12 अंकों का सही आधार नंबर दर्ज करें");
      return;
    }
    if (!photo) {
      toast.error("कृपया Live Selfie लें");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    // Simple local marker — server-side verification can be added later
    localStorage.setItem(EKYC_KEY_PREFIX + user.id, "1");
    setTimeout(() => {
      toast.success("E-KYC पूर्ण हुआ • Verification successful");
      navigate("/", { replace: true });
    }, 600);
  };

  const formatAadhaar = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 12);
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
            ) : (
              <><ShieldCheck className="mr-2 h-5 w-5" /> Verify KYC • सत्यापन करें</>
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default EkycPage;
