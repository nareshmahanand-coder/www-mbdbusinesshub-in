import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { sendOtp, renderRecaptcha, resetRecaptcha, type ConfirmationResult } from "@/lib/firebase";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { AlertTriangle, LogIn, Phone, Loader2, ShieldCheck } from "lucide-react";

const getOtpErrorContent = (error: any) => {
  const code = typeof error?.code === "string" ? error.code : undefined;
  const details = [code, error?.message].filter(Boolean).join(" — ") || "Unknown error";

  switch (code) {
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
    case "auth/missing-app-credential":
      return {
        message: "reCAPTCHA सत्यापन विफल हुआ। कृपया checkbox दोबारा पूरा करें और फिर OTP भेजें।",
        details,
      };
    case "auth/too-many-requests":
      return {
        message: "बहुत अधिक प्रयास। कुछ देर बाद पुनः प्रयास करें।",
        details,
      };
    case "auth/quota-exceeded":
      return {
        message: "SMS quota पूरी हो चुकी है। कृपया बाद में पुनः प्रयास करें।",
        details,
      };
    case "auth/invalid-phone-number":
      return {
        message: "मोबाइल नंबर अमान्य है। कृपया सही 10 अंकों का नंबर दर्ज करें।",
        details,
      };
    default:
      return {
        message: "OTP भेजने में विफल। कृपया पुनः प्रयास करें।",
        details,
      };
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [otpError, setOtpError] = useState<{ message: string; details: string } | null>(null);

  useEffect(() => {
    renderRecaptcha("recaptcha-container")
      .then(() => setRecaptchaReady(true))
      .catch((err) => {
        setRecaptchaReady(false);
        console.error("reCAPTCHA render error:", err);
      });
  }, []);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें");
      return;
    }

    setOtpError(null);
    setLoading(true);

    try {
      const confirmation = await sendOtp(`+91${phone}`);
      confirmationRef.current = confirmation;
      setOtpSent(true);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (error: any) {
      console.error("Firebase OTP error:", error);
      const nextError = getOtpErrorContent(error);
      setRecaptchaReady(false);
      setOtpError(nextError);

      try {
        await resetRecaptcha("recaptcha-container");
        setRecaptchaReady(true);
      } catch (resetError) {
        console.error("reCAPTCHA reset error:", resetError);
      }

      toast.error(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);

    if (otp.length !== 6 || !confirmationRef.current) {
      toast.error("कृपया सही 6 अंकों का OTP दर्ज करें");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase
      await confirmationRef.current.confirm(otp);

      // Now sign into Supabase with fake-email pattern
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
          },
        });

        if (signUpError) {
          toast.error(signUpError.message || "लॉगिन विफल। पुनः प्रयास करें।");
          setLoading(false);
          return;
        }
      }

      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      toast.success("लॉगिन सफल! 🎉");
      setLoading(false);
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("OTP verify error:", error);
      const msg = error?.code === "auth/invalid-verification-code"
        ? "गलत OTP। कृपया सही OTP दर्ज करें।"
        : "सत्यापन विफल। पुनः प्रयास करें।";
      toast.error(msg);
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

          <CardContent className="space-y-5">
            <div className="rounded-xl bg-saffron/10 border border-saffron/20 p-4 text-center">
              <p className="font-hindi text-sm leading-relaxed text-foreground">
                अपना मोबाइल नंबर दर्ज करें और OTP के साथ सुरक्षित लॉगिन करें
              </p>
            </div>

            {otpError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>OTP request failed</AlertTitle>
                <AlertDescription className="space-y-1 break-words">
                  <p>{otpError.message}</p>
                  <p className="text-xs">{otpError.details}</p>
                </AlertDescription>
              </Alert>
            )}

            {!otpSent ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="मोबाइल नंबर दर्ज करें"
                    value={phone}
                    onChange={(e) => {
                      setOtpError(null);
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    }}
                    className="flex-1 text-lg"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                <div id="recaptcha-container" className="flex justify-center" />
                <Button
                  onClick={handleSendOtp}
                  disabled={phone.length !== 10 || loading || !recaptchaReady}
                  style={{ backgroundColor: "#C71585" }}
                  className="w-full text-white hover:opacity-90 hover:!bg-[#C71585] font-bold text-base py-5 gap-2 shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                  OTP भेजें / Get OTP
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-green-india/10 border border-green-india/20 p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    📩 OTP sent to <strong>+91 {phone}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    कृपया अपने मोबाइल पर प्राप्त OTP दर्ज करें
                  </p>
                </div>
                <Input
                  type="tel"
                  placeholder="6 अंकों का OTP दर्ज करें"
                  value={otp}
                  onChange={(e) => {
                    setOtpError(null);
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5 gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  सत्यापित करें / Verify & Login
                </Button>
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setOtpError(null);
                    confirmationRef.current = null;
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  ← नंबर बदलें
                </button>
              </>
            )}

            <div className="relative">
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
              style={{ backgroundColor: "#C71585" }}
              className="w-full text-white hover:opacity-90 hover:!bg-[#C71585] font-bold text-base py-5 gap-2 shadow-lg border-0"
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
              Login with Google
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
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default LoginPage;
