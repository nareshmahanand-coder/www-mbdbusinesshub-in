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
import { lovable } from "@/integrations/lovable/index";
import { SUPERUSER_FLAG } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Info, Phone, Loader2, ShieldCheck, MessageCircle, Lock } from "lucide-react";

const HELPLINE_WA = "919203645007";
const SUPERUSER_PIN = "02032026";
const SUPERUSER_EMAIL = "superuser@mbd.local";
const SUPERUSER_PASSWORD = "MBD_SuperUser_02032026!";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    sessionStorage.setItem("bharat-mitra-pending-greet", "true");

    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (error) {
      sessionStorage.removeItem("bharat-mitra-pending-greet");
      toast.error("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-saffron/10 via-background to-green-india/10">
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-green-india" />

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-2 border-saffron/30 shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-2">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="mx-auto h-24 w-24 rounded-full object-cover shadow-lg border-4 border-saffron/40"
            />
            <CardTitle className="text-2xl font-bold text-foreground">
              मेरा भारत दुकान
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Mera Bharat Dukaan — Digital India Marketplace
            </p>
          </CardHeader>

          <CardContent className="space-y-5 flex flex-col items-center justify-center min-h-[280px]">
            <Button
              onClick={handleWhatsAppVerify}
              disabled={loading}
              className="w-full h-14 bg-[#0B6623] hover:bg-[#094f1b] text-white font-bold text-base gap-2 shadow-lg rounded-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
              WhatsApp से Verify करें
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">
                  या / OR
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-[#1f1f1f] hover:bg-black text-white font-bold text-base gap-3 shadow-lg rounded-lg border-0"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
                  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </span>
              )}
              Google Email से लॉगिन करें
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service & Privacy Policy
              </a>
            </p>

            <div className="text-center">
              <span className="inline-block rounded-full bg-green-india/10 px-3 py-1 text-[10px] font-semibold text-green-india">
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
