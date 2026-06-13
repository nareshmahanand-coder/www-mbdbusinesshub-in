import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { SUPERUSER_FLAG, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, Lock, Mail, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const SUPERUSER_PIN = "02032026";
const SUPERUSER_EMAIL = "superuser@mbd.local";
const SUPERUSER_PASSWORD = "MBD_SuperUser_02032026!";
const SHOP_APP_ORIGIN = "https://shop.mbdbusinesshub.in";
const POST_LOGIN_MEMBERSHIP_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";

const getStandaloneAuthOrigin = () => {
  const hostname = window.location.hostname;
  if (hostname.endsWith("mbdbusinesshub.in")) return SHOP_APP_ORIGIN;
  return window.location.origin;
};

const safeNextPath = (value: string | null) => (value?.startsWith("/") ? value : POST_LOGIN_MEMBERSHIP_PATH);

const rememberNextPath = (path: string) => {
  const safePath = safeNextPath(path);
  sessionStorage.setItem(AUTH_NEXT_KEY, safePath);
  localStorage.setItem(AUTH_NEXT_KEY, safePath);
};

type GoogleStep = "idle" | "email" | "otp";

const LoginPage = ({ initialMode = "login" }: LoginPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [googleStep, setGoogleStep] = useState<GoogleStep>("idle");
  const [googleEmail, setGoogleEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY));
  }, [location.search]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    const mobileDigits = mobile.replace(/\D/g, "");
    if (mode === "signup" && mobileDigits.length !== 10) {
      toast.error("कृपया 10-digit मोबाइल नंबर दर्ज करें / Enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    rememberNextPath(POST_LOGIN_MEMBERSHIP_PATH);
    try {
      if (mode === "signup") {
        const { data: dupRes } = await (supabase as any).rpc("check_signup_duplicate", {
          p_email: email.trim(),
          p_phone: mobileDigits,
        });
        if (dupRes?.duplicate) {
          toast.error(dupRes.message || "Already registered");
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), phone: mobileDigits },
            emailRedirectTo: `${getStandaloneAuthOrigin()}/login?next=${encodeURIComponent(POST_LOGIN_MEMBERSHIP_PATH)}`,
          },
        });
        if (error) throw error;
        const newUserId = signUpData?.user?.id;
        if (newUserId) {
          await supabase.from("profiles").upsert(
            {
              id: newUserId,
              email: email.trim(),
              phone: mobileDigits,
              display_name: fullName.trim(),
              provider: "email",
            },
            { onConflict: "id" },
          );
        }
        toast.success("Account created. Please check your email if verification is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Login successful.");
      }
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      navigate(POST_LOGIN_MEMBERSHIP_PATH, { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first to receive a reset link.");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${getStandaloneAuthOrigin()}/reset-password?next=${encodeURIComponent(nextPath)}`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email.");
    } catch (error: any) {
      toast.error(error?.message || "Could not send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  // Continue with Google → Email-OTP flow
  // 1) Detect/confirm Google email  2) Send 6-digit OTP  3) Verify → Supabase session persists
  const startGoogleFlow = () => {
    rememberNextPath(nextPath);
    // Pre-fill with last used Google email if available
    const remembered = localStorage.getItem("mbd-google-email") || "";
    setGoogleEmail(remembered);
    setOtp("");
    setGoogleStep("email");
  };

  const sendGoogleOtp = async () => {
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("कृपया valid Google email दर्ज करें / Enter a valid email.");
      return;
    }
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          // No emailRedirectTo → Supabase sends OTP code only (no magic link)
        },
      });
      if (error) throw error;
      localStorage.setItem("mbd-google-email", cleanEmail);
      setGoogleStep("otp");
      toast.success(`OTP भेज दिया गया → ${cleanEmail}`);
    } catch (error: any) {
      toast.error(error?.message || "OTP नहीं भेजा जा सका।");
    } finally {
      setGoogleBusy(false);
    }
  };

  const verifyGoogleOtp = async () => {
    if (otp.length !== 4) {
      toast.error("कृपया 4-digit OTP डालें।");
      return;
    }
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: googleEmail.trim().toLowerCase(),
        token: otp,
        type: "email",
      });
      if (error) throw error;
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      toast.success("Login successful!");
      navigate(nextPath, { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "OTP verify नहीं हुआ।");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleSuperUserPin = async () => {
    if (pin !== SUPERUSER_PIN) {
      toast.error("गलत PIN / Invalid PIN");
      return;
    }
    setPinLoading(true);
    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({ email: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: SUPERUSER_EMAIL,
          password: SUPERUSER_PASSWORD,
          options: { data: { full_name: "Super User" }, emailRedirectTo: getStandaloneAuthOrigin() },
        });
        if (signUpError && !signUpError.message.toLowerCase().includes("already")) throw signUpError;
        const retry = await supabase.auth.signInWithPassword({ email: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD });
        if (retry.error) throw retry.error;
      }
      localStorage.setItem(SUPERUSER_FLAG, "true");
      window.dispatchEvent(new Event("mbd-superuser-changed"));
      toast.success("🛡️ Super User Mode सक्रिय / Bypass Active");
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "लॉगिन विफल।");
    } finally {
      setPinLoading(false);
      setPinDialogOpen(false);
    }
  };

  return (
    <main className="min-h-screen bg-background tiranga-bg">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-background to-green-india" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div className="text-center">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="mx-auto h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl" />
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">{mode === "signup" ? "Create your account" : "Secure Login"}</h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">Digital India access · Email और Password से सुरक्षित प्रवेश</p>
          </div>

          {googleStep !== "idle" && (
            <div className="mt-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <button
                type="button"
                onClick={() => { setGoogleStep("idle"); setOtp(""); }}
                className="mb-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              {googleStep === "email" && (
                <div className="space-y-3">
                  <Label htmlFor="googleEmail" className="text-sm font-bold">
                    अपना Google email confirm करें
                  </Label>
                  <Input
                    id="googleEmail"
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    autoComplete="email webauthn"
                    inputMode="email"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    इस email पर हम 6-digit OTP भेजेंगे — verify होते ही login हो जाएगा।
                  </p>
                  <Button onClick={sendGoogleOtp} disabled={googleBusy} className="h-11 w-full">
                    {googleBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Send OTP
                  </Button>
                </div>
              )}
              {googleStep === "otp" && (
                <div className="space-y-3">
                  <Label className="text-sm font-bold">
                    6-digit OTP डालें ({googleEmail})
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
                  <Button onClick={verifyGoogleOtp} disabled={googleBusy || otp.length !== 6} className="h-11 w-full">
                    {googleBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Verify & Login
                  </Button>
                  <button
                    type="button"
                    onClick={sendGoogleOtp}
                    disabled={googleBusy}
                    className="w-full text-xs font-semibold text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />
              </div>
            )}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number / मोबाइल नंबर</Label>
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  maxLength={10}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{mode === "signup" ? "Create Password" : "Password"}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>

            {mode === "login" && (
              <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="text-sm font-semibold text-primary hover:underline">
                {resetLoading ? "Sending reset link..." : "Forgot Password?"}
              </button>
            )}

            <Button type="submit" disabled={loading} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : mode === "signup" ? <UserPlus className="mr-2 h-5 w-5" /> : <Mail className="mr-2 h-5 w-5" />}
              {mode === "signup" ? "Sign Up" : "Login"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            onClick={startGoogleFlow}
            disabled={loading || googleStep !== "idle"}
            variant="outline"
            className="h-12 w-full gap-3 border-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-semibold">Continue with Google</span>
          </Button>

          <div className="mt-5 text-center text-sm">
            {mode === "login" ? (
              <Link to={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-primary hover:underline">Don't have an account? Sign Up</Link>
            ) : (
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-primary hover:underline">Already have an account? Login</Link>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>

          <div className="mt-3 text-center">
            <AdminPinAccess />
          </div>
        </div>
      </section>

      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Authorized Access</DialogTitle>
            <DialogDescription>Enter the master PIN to unlock Super User mode.</DialogDescription>
          </DialogHeader>
          <Input type="password" inputMode="numeric" placeholder="••••••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} onKeyDown={(e) => e.key === "Enter" && handleSuperUserPin()} className="text-center text-lg tracking-widest" maxLength={8} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSuperUserPin} disabled={pinLoading || pin.length < 4}>{pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default LoginPage;