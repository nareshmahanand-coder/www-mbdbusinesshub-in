import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { ArrowLeft, KeyRound, Loader2, UserPlus } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";
type AuthStep = "start" | "email" | "verify";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";
const ACTIVE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const LOVABLE_CLOUD_PROJECT_URL = "https://tkenjzcyvnqnhgntmmen.supabase.co";

const safeNextPath = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : POST_LOGIN_PATH);
const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [authStep, setAuthStep] = useState<AuthStep>("start");
  const [fullName, setFullName] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY));
  }, [location.search]);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const openEmailOtp = (mode: AuthMode = authMode) => {
    setAuthMode(mode);
    setAuthStep("email");
    setOtpCode("");
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const email = otpEmail.trim();
    const name = fullName.trim();

    if (!isValidEmail(email)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }
    if (authMode === "signup" && name.length < 2) {
      toast.error("कृपया अपना नाम दर्ज करें।");
      return;
    }
    if (ACTIVE_SUPABASE_URL === LOVABLE_CLOUD_PROJECT_URL) {
      toast.error("Production Supabase URL अभी configured नहीं है। पहले Build Secret में custom URL/key जोड़ें।");
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: authMode === "signup",
          data: authMode === "signup" ? { full_name: name, name, provider: "email_otp" } : undefined,
        },
      });
      if (error) throw error;
      setAuthStep("verify");
      setOtpCode("");
      toast.success("✅ 6-digit OTP आपके email पर भेज दिया है।");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "OTP नहीं भेज सके। दोबारा कोशिश करें।"));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const email = otpEmail.trim();
    if (!isValidEmail(email)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }
    if (otpCode.length !== 6) {
      toast.error("कृपया पूरा 6-digit OTP दर्ज करें।");
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      toast.success("✅ OTP verified. Login हो रहे हैं…");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "गलत OTP. दोबारा कोशिश करें।"));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background tiranga-bg">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-background to-green-india" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
          <div className="text-center">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="mx-auto h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl"
            />
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">
              {authStep === "verify" ? "Verify OTP" : authMode === "signup" ? "Create Account" : "Login with Google"}
            </h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">
              Email डालें और 6-digit OTP app में ही verify करें।
            </p>
          </div>

          <div className="mt-6">
            {authStep === "start" ? (
              <div className="space-y-4">
                <Button type="button" variant="outline" onClick={() => openEmailOtp("login")} className="h-12 w-full">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground">
                    G
                  </span>
                  Login with Google
                </Button>
                <Button type="button" onClick={() => openEmailOtp("signup")} className="h-12 w-full">
                  <UserPlus className="h-5 w-5" />
                  Create account
                </Button>
              </div>
            ) : authStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {authMode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={otpEmail}
                    onChange={(event) => setOtpEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" disabled={otpLoading} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                  Send 6-digit OTP
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAuthStep("start")} className="w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-sm">
                  <p className="font-semibold text-foreground">{otpEmail}</p>
                  <p className="text-xs text-muted-foreground">पर 6-digit OTP भेजा गया है।</p>
                </div>
                <div className="space-y-2">
                  <Label className="block text-center">6-digit OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value.replace(/\D/g, "").slice(0, 6))}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                  Verify & Login
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAuthStep("email");
                      setOtpCode("");
                    }}
                  >
                    Change email
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setAuthStep("start")}>
                    Back
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>

          <div className="mt-3 text-center">
            <AdminPinAccess />
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;