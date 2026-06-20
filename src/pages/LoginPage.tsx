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
import { KeyRound, Loader2 } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";

const safeNextPath = (value: string | null) => (value?.startsWith("/") && !value.startsWith("//") ? value : POST_LOGIN_PATH);
const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY));
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = otpEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
      setOtpCode("");
      toast.success("✅ 6-digit code आपके email पर भेज दिया है।");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Code नहीं भेज सके। दोबारा कोशिश करें।"));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = otpEmail.trim();
    if (otpCode.length !== 6) {
      toast.error("कृपया पूरा 6-digit code दर्ज करें।");
      return;
    }

    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
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
              {initialMode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">
              Android और Website दोनों में सिर्फ 6-digit email OTP से login करें।
            </p>
          </div>

          <div className="mt-6">
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
                    onChange={(event) => setOtpEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={otpLoading}
                  className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {otpLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
                  Send 6-digit Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-sm">
                  <p className="font-semibold text-foreground">{otpEmail}</p>
                  <p className="text-xs text-muted-foreground">पर plain 6-digit code भेजा गया है।</p>
                </div>
                <div className="space-y-2">
                  <Label className="block text-center">6-digit Code</Label>
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
                  {otpLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Login"}
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