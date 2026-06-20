import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, Lock, Mail, KeyRound } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";

const safeNextPath = (value: string | null) => (value?.startsWith("/") ? value : POST_LOGIN_PATH);
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<"password" | "otp">("password");

  // Password fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(
      fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY),
    );
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handlePasswordAuth = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password कम से कम 6 अक्षर का होना चाहिए।");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: name.trim() || null },
          },
        });
        if (error) throw error;
        toast.success("✅ Account बन गया! Login हो रहे हैं…");

        // Try immediate sign-in (works if email confirmation is disabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          toast.info("कृपया अपना email confirm करके login करें।");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;
        toast.success("✅ Login successful!");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Login नहीं हो सका। दोबारा कोशिश करें।"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = otpEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success("✅ 6-digit code आपके email पर भेज दिया है।");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Code नहीं भेज सके। दोबारा कोशिश करें।"));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("कृपया पूरा 6-digit code दर्ज करें।");
      return;
    }
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode,
        type: "email",
      });
      if (error) throw error;
      toast.success("✅ Verified! Login हो रहे हैं…");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "गलत code. दोबारा कोशिश करें।"));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background tiranga-bg">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-background to-green-india" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div className="text-center">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="mx-auto h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl"
            />
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">
              Password या 6-digit OTP से login करें।
            </p>
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as "password" | "otp")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <Lock className="mr-2 h-4 w-4" /> Password
              </TabsTrigger>
              <TabsTrigger value="otp">
                <KeyRound className="mr-2 h-4 w-4" /> Email OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="आपका नाम"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="कम से कम 6 अक्षर"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-5 w-5" />
                  )}
                  {mode === "signup" ? "Sign Up" : "Login"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "signup" ? "पहले से account है?" : "नया user हैं?"}{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline"
                    onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                  >
                    {mode === "signup" ? "Login करें" : "Sign Up करें"}
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="mt-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email</Label>
                    <Input
                      id="otp-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={otpLoading}
                    className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-5 w-5" />
                    )}
                    Send 6-digit Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-sm">
                    <p className="font-semibold text-foreground">{otpEmail}</p>
                    <p className="text-xs text-muted-foreground">पर 6-digit code भेजा गया है।</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-center block">6-digit Code</Label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>
                  <button
                    type="button"
                    className="block w-full text-center text-sm text-muted-foreground underline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                  >
                    दूसरा email इस्तेमाल करें
                  </button>
                </form>
              )}
            </TabsContent>
          </Tabs>

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