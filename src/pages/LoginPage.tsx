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
import { ArrowLeft, KeyRound, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";
type AuthView = "password" | "emailOtp";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";

const safeNextPath = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : POST_LOGIN_PATH);
const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("password");
  const [passwordMode, setPasswordMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY));
  }, [location.search]);

  useEffect(() => {
    setPasswordMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handlePasswordAuth = async (event: FormEvent) => {
    event.preventDefault();
    const email = passwordEmail.trim();
    const name = fullName.trim();

    if (!isValidEmail(email)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password कम से कम 6 characters का होना चाहिए।");
      return;
    }
    if (passwordMode === "signup" && name.length < 2) {
      toast.error("कृपया अपना नाम दर्ज करें।");
      return;
    }

    setPasswordLoading(true);
    try {
      if (passwordMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              name,
              provider: "email",
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account बन गया है। अब इसी email/password से login करें।");
          setPasswordMode("login");
          return;
        }
        toast.success("✅ Account created. Login हो रहे हैं…");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("✅ Login हो रहे हैं…");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, passwordMode === "signup" ? "Account नहीं बना।" : "Login failed."));
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEmailOtp = () => {
    setAuthView("emailOtp");
    setOtpSent(false);
    setOtpCode("");
    setOtpEmail(passwordEmail.trim());
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const email = otpEmail.trim();
    if (!isValidEmail(email)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setOtpSent(true);
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
              {authView === "emailOtp" ? "Login with Google" : passwordMode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">
              {authView === "emailOtp"
                ? "Email डालें और 6-digit OTP app में ही verify करें।"
                : "Email और password से login करें, या OTP login चुनें।"}
            </p>
          </div>

          <div className="mt-6">
            {authView === "password" ? (
              <div className="space-y-5">
                <form onSubmit={handlePasswordAuth} className="space-y-4">
                  {passwordMode === "signup" && (
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
                    <Label htmlFor="password-email">Email</Label>
                    <Input
                      id="password-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={passwordEmail}
                      onChange={(event) => setPasswordEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={passwordMode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" disabled={passwordLoading} className="h-12 w-full">
                    {passwordLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : passwordMode === "signup" ? (
                      <UserPlus className="h-5 w-5" />
                    ) : (
                      <LockKeyhole className="h-5 w-5" />
                    )}
                    {passwordMode === "signup" ? "Create Account" : "Login"}
                  </Button>
                </form>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>OR</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button type="button" variant="outline" onClick={openEmailOtp} className="h-12 w-full">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground">
                    G
                  </span>
                  Login with Google
                </Button>

                <button
                  type="button"
                  className="block w-full text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => setPasswordMode(passwordMode === "signup" ? "login" : "signup")}
                >
                  {passwordMode === "signup" ? "Already have an account? Login" : "Create account"}
                </button>
              </div>
            ) : !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                <Button type="button" variant="ghost" onClick={() => setAuthView("password")} className="w-full">
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
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                  >
                    Change email
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setAuthView("password")}>
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