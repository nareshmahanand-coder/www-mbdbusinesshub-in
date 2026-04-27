import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SUPERUSER_FLAG } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, MessageCircle, Lock } from "lucide-react";

const HELPLINE_WA = "919203645007";
const SUPERUSER_PIN = "02032026";
const SUPERUSER_EMAIL = "superuser@mbd.local";
const SUPERUSER_PASSWORD = "MBD_SuperUser_02032026!";

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        console.error("Google login error:", result.error);
        toast.error("Google लॉगिन ब्लॉक हुआ। कृपया दोबारा प्रयास करें / Google login was blocked. Please retry.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate("/", { replace: true });
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
        <div className="w-full max-w-md">
          {/* Layered tricolor border wrapper */}
          <div
            className="rounded-[28px] p-[6px] shadow-2xl"
            style={{
              background:
                "linear-gradient(180deg, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)",
              boxShadow:
                "0 20px 50px -15px rgba(11,31,75,0.25), 0 0 0 1px rgba(255,153,51,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <div
              className="rounded-[24px] bg-white px-6 pt-7 pb-6"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -4px rgba(11,31,75,0.08)",
              }}
            >
              {/* Logo */}
              <div className="text-center">
                <div className="relative mx-auto w-fit">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF9933] via-white to-[#138808] blur-md opacity-60" />
                  <img
                    src={logoCircle}
                    alt="Mera Bharat Dukaan"
                    className="relative mx-auto h-24 w-24 rounded-full object-cover shadow-xl border-4 border-white"
                  />
                </div>
                <h1
                  className="mt-4 text-[28px] leading-tight font-extrabold tracking-tight text-[#0B1F4B]"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  मेरा भारत दुकान
                </h1>
                <p className="text-[13px] font-bold text-[#0B1F4B]/70 tracking-[0.2em] uppercase mt-1">
                  Mera Bharat Dukaan
                </p>
                <p className="text-xs italic text-[#0B1F4B]/60 mt-1">
                  Digital India Marketplace · डिजिटल भारत
                </p>
                {/* Tricolor separator */}
                <div className="mx-auto mt-3 flex items-center justify-center gap-1">
                  <span className="h-1.5 w-10 rounded-full bg-[#FF9933]" />
                  <span className="h-1.5 w-10 rounded-full bg-white border border-[#0B1F4B]/10" />
                  <span className="h-1.5 w-10 rounded-full bg-[#138808]" />
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="mt-6">
                {!showPhoneInput ? (
                  <Button
                    onClick={() => setShowPhoneInput(true)}
                    className="w-full h-14 bg-[#0B6623] hover:bg-[#094f1b] active:bg-[#073d15] text-white font-extrabold text-[16px] shadow-lg shadow-[#0B6623]/30 rounded-xl border-0 tracking-wide"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
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
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#0B1F4B]/15" />
                <span className="text-[11px] font-bold text-[#0B1F4B]/60 tracking-widest">या / OR</span>
                <div className="flex-1 h-px bg-[#0B1F4B]/15" />
              </div>

              {/* Google Login Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full h-14 bg-[#FF9933] hover:bg-[#e6852b] active:bg-[#cc7424] text-white font-extrabold text-[16px] shadow-lg shadow-[#FF9933]/30 rounded-xl border-0 tracking-wide"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-white mr-2 shadow-sm">
                      <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </span>
                    गूगल ईमेल से लॉगिन करें
                  </>
                )}
              </Button>

              <p className="mt-5 text-center text-[11px] text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="/terms" className="underline hover:text-foreground font-medium">
                  Terms
                </a>
                {", "}
                <a href="/privacy-policy" className="underline hover:text-foreground font-medium">
                  Privacy Policy
                </a>
                {" and "}
                <a href="/refund-policy" className="underline hover:text-foreground font-medium">
                  Refund Policy
                </a>
              </p>

              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#138808]/30 px-3 py-1 text-[11px] font-bold text-[#0B1F4B] shadow-sm">
                  🇮🇳 Digital India Initiative
                </span>
              </div>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setPinDialogOpen(true)}
                  className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground underline-offset-2 hover:underline"
                >
                  Official Authorized System
                </button>
              </div>
            </div>
          </div>
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
