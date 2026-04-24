import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { SUPERUSER_FLAG } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, MessageCircle, Lock, Mail } from "lucide-react";

const HELPLINE_WA = "919203645007";
const SUPERUSER_PIN = "02032026";
const SUPERUSER_EMAIL = "superuser@mbd.local";
const SUPERUSER_PASSWORD = "MBD_SuperUser_02032026!";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const handleSuperUserPin = async () => {
    if (pin !== SUPERUSER_PIN) {
      toast.error("गलत PIN / Invalid PIN");
      return;
    }
    setPinLoading(true);
    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: SUPERUSER_EMAIL,
        password: SUPERUSER_PASSWORD,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: SUPERUSER_EMAIL,
          password: SUPERUSER_PASSWORD,
          options: {
            data: { full_name: "Super User", phone: "+910000000000" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
          toast.error(signUpError.message);
          setPinLoading(false);
          return;
        }
        const retry = await supabase.auth.signInWithPassword({
          email: SUPERUSER_EMAIL,
          password: SUPERUSER_PASSWORD,
        });
        if (retry.error) {
          toast.error("Super User लॉगिन विफल। पुनः प्रयास करें।");
          setPinLoading(false);
          return;
        }
      }

      localStorage.setItem(SUPERUSER_FLAG, "true");
      window.dispatchEvent(new Event("mbd-superuser-changed"));
      toast.success("🛡️ Super User Mode सक्रिय / Bypass Active");
      setPinDialogOpen(false);
      setPinLoading(false);
      navigate("/", { replace: true });
    } catch (e: any) {
      console.error("Super user login error:", e);
      toast.error("लॉगिन विफल।");
      setPinLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (phone.length !== 10) {
      toast.error("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें");
      return;
    }

    setLoading(true);
    try {
      // Temporary phone-only login (no OTP). Will be replaced by Aadhaar OTP via SurePass.
      const fakeEmail = `${phone}@mbd.local`;
      const password = `mbd_${phone}_secure`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
          options: {
            data: {
              full_name: `User ${phone}`,
              phone: `+91${phone}`,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) {
          toast.error(signUpError.message || "लॉगिन विफल। पुनः प्रयास करें।");
          setLoading(false);
          return;
        }

        // Try sign-in again after signup (in case email confirmation is off)
        const { error: retrySignIn } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password,
        });
        if (retrySignIn) {
          toast.error("खाता बनाया गया, कृपया पुनः लॉगिन करें।");
          setLoading(false);
          return;
        }
      }

      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      toast.success("लॉगिन सफल! कृपया Aadhaar KYC पूरा करें।");
      setLoading(false);
      navigate("/ekyc", { replace: true });
    } catch (error: any) {
      console.error("Phone login error:", error);
      toast.error("लॉगिन विफल। पुनः प्रयास करें।");
      setLoading(false);
    }
  };

  const handleWhatsAppVerify = async () => {
    if (phone.length !== 10) {
      toast.error("पहले 10 अंकों का मोबाइल नंबर दर्ज करें");
      return;
    }
    setLoading(true);
    try {
      const fakeEmail = `${phone}@mbd.local`;
      const password = `mbd_${phone}_secure`;

      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password,
          options: {
            data: { full_name: `User ${phone}`, phone: `+91${phone}` },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) {
          toast.error(signUpError.message || "खाता नहीं बना।");
          setLoading(false);
          return;
        }
        const retry = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
        signInData = retry.data;
      }

      const userId = signInData?.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            phone: `+91${phone}`,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      const message = encodeURIComponent(
        `नमस्ते Mera Bharat Dukaan!\nकृपया मेरा नंबर सत्यापित करें / Please verify my number.\n\nMobile: +91${phone}\nUser ID: ${userId ?? "new"}`,
      );
      window.open(`https://wa.me/${HELPLINE_WA}?text=${message}`, "_blank");

      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      toast.success("WhatsApp खुल रहा है। संदेश भेजें और वापस आएँ।");
      setLoading(false);
      navigate("/ekyc", { replace: true });
    } catch (error: any) {
      console.error("Phone login error:", error);
      toast.error("लॉगिन विफल। पुनः प्रयास करें।");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const host = window.location.hostname;
      const isProdDomain =
        host.endsWith("mbdbusinesshub.in") || host === "localhost";
      const redirect_uri = isProdDomain
        ? window.location.origin
        : "https://shop.mbdbusinesshub.in";

      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
      if (result.error) {
        toast.error(result.error.message || "Google लॉगिन विफल / Google sign-in failed");
        setGoogleLoading(false);
      }
    } catch (e: any) {
      console.error("Google login error:", e);
      toast.error("लॉगिन विफल। पुनः प्रयास करें।");
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(to bottom, #FFE6CC 0%, #FFF4E6 25%, #FFFFFF 50%, #E8F5E9 75%, #C8E6C9 100%)",
      }}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl p-[3px] shadow-2xl" style={{
          background: "linear-gradient(to bottom, #FF9933 0%, #FF9933 12%, #FFFFFF 35%, #FFFFFF 65%, #138808 88%, #138808 100%)",
        }}>
        <Card className="w-full border-0 shadow-none bg-white/95 backdrop-blur-md rounded-[22px]">
          <CardHeader className="text-center space-y-4 pb-2 pt-8">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF9933] via-white to-[#138808] blur-md opacity-70" />
              <img
                src={logoCircle}
                alt="Mera Bharat Dukaan"
                className="relative mx-auto h-28 w-28 rounded-full object-cover shadow-xl border-4 border-white"
              />
            </div>
            <div className="space-y-1">
              <CardTitle
                className="text-3xl font-extrabold tracking-tight text-[#0B1F4B]"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.5px" }}
              >
                मेरा भारत दुकान
              </CardTitle>
              <p className="text-sm font-bold text-[#0B1F4B]/80 tracking-wide uppercase">
                Mera Bharat Dukaan
              </p>
              <p className="text-xs text-muted-foreground italic">
                Digital India Marketplace · डिजिटल भारत
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="h-1 w-8 rounded-full bg-[#FF9933]" />
              <span className="h-1 w-8 rounded-full bg-white border border-border" />
              <span className="h-1 w-8 rounded-full bg-[#138808]" />
            </div>
          </CardHeader>

          <CardContent className="space-y-5 flex flex-col items-center justify-center px-6 pb-8 pt-6">
            {/* WhatsApp Verify (collapses to inline phone + verify) */}
            {!showPhoneInput ? (
              <Button
                onClick={() => setShowPhoneInput(true)}
                className="w-full h-14 bg-[#0B6623] hover:bg-[#094f1b] active:bg-[#073d15] text-white font-extrabold text-base gap-3 shadow-lg shadow-[#0B6623]/30 rounded-xl border-0 tracking-wide"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp से Verify करें
              </Button>
            ) : (
              <div className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="rounded-md border border-input bg-muted px-2.5 h-12 flex items-center text-sm font-bold text-[#0B1F4B]">
                  +91
                </span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="10-अंकों का नंबर"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 h-12 text-base font-semibold tracking-wider"
                  maxLength={10}
                />
                <Button
                  onClick={handleWhatsAppVerify}
                  disabled={loading || phone.length !== 10}
                  className="h-12 px-4 bg-[#0B6623] hover:bg-[#094f1b] text-white font-bold rounded-md shadow-md shadow-[#0B6623]/30"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            )}

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/80 px-3 font-semibold text-muted-foreground rounded-full">
                  या / OR
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-14 bg-[#FF9933] hover:bg-[#e6852b] active:bg-[#cc7424] text-white font-extrabold text-base gap-3 shadow-lg shadow-[#FF9933]/30 rounded-xl border-0 tracking-wide"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.3 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.3 29.1 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.7 13.2-4.7l-6.1-5.2c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.5 39.1 16.2 43.5 24 43.5z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.1 5.2c-.4.4 6.3-4.6 6.3-14.7 0-1.2-.1-2.3-.4-3.5z"/>
                  </svg>
                </span>
              )}
              Google Email से लॉगिन करें
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground font-medium">
                Terms of Service & Privacy Policy
              </a>
            </p>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-[#138808]/20 px-3 py-1 text-[10px] font-bold text-[#0B1F4B] shadow-sm">
                🇮🇳 Digital India Initiative
              </span>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setPinDialogOpen(true)}
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground underline-offset-2 hover:underline"
              >
                Official Authorized System
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Authorized Access
            </DialogTitle>
            <DialogDescription>
              Enter the master PIN to unlock Super User mode.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            placeholder="••••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => e.key === "Enter" && handleSuperUserPin()}
            className="text-center text-lg tracking-widest"
            maxLength={8}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPinDialogOpen(false);
                setPin("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSuperUserPin} disabled={pinLoading || pin.length < 4}>
              {pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
