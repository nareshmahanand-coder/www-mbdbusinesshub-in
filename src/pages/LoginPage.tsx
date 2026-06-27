import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, LogIn, Mail } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

const POST_LOGIN_PATH = "/dashboard";
const POST_LOGIN_ROUTE = "/auth/continue";
const AUTH_NEXT_KEY = "mbd-auth-next";

const resetAuthRedirectState = () => {
  sessionStorage.setItem(AUTH_NEXT_KEY, POST_LOGIN_PATH);
  localStorage.setItem(AUTH_NEXT_KEY, POST_LOGIN_PATH);
};
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

interface LoginPageProps {
  initialMode?: "login" | "signup";
}

const LoginPage = (_props: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      resetAuthRedirectState();
      const redirectTo = `${window.location.origin}${POST_LOGIN_ROUTE}`;
      const hasCustomBackend = Boolean(
        import.meta.env.VITE_CUSTOM_SUPABASE_URL && import.meta.env.VITE_CUSTOM_SUPABASE_ANON_KEY
      );

      if (hasCustomBackend) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
        if (data.url) {
          window.location.assign(data.url);
          return;
        }
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo,
        extraParams: { prompt: "select_account" },
      });
      if (result.redirected) return;
      if (result.error) throw result.error;

      toast.success("✅ Logged in with Google.");
      navigate(POST_LOGIN_ROUTE, { replace: true });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Google login failed. Try again."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSending(true);
    try {
      resetAuthRedirectState();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setEmail(cleanEmail);
      setOtpSent(true);
      setOtp("");
      setResendIn(45);
      toast.success("📩 6-digit OTP sent to your email.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not send OTP. Try again."));
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: "email",
      });
      if (error) throw error;
      if (!data.session) throw new Error("Could not start session. Try again.");
      toast.success("✅ Logged in.");
      navigate(POST_LOGIN_ROUTE, { replace: true });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Invalid or expired OTP."));
    } finally {
      setVerifying(false);
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
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">Welcome</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log in with Google or get a 6-digit OTP on your email.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="h-12 w-full"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground">
                  G
                </span>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                  Send 6-digit OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2 text-center">
                  <Label>Enter 6-digit OTP</Label>
                  <p className="text-xs text-muted-foreground">Sent to {email}</p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(v) => setOtp(v.replace(/\D/g, ""))}
                      inputMode="numeric"
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={verifying || otp.length !== 6}
                  className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                  Verify & Log In
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-muted-foreground underline"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (resendIn > 0) return;
                      handleSendOtp(e as unknown as FormEvent);
                    }}
                    disabled={resendIn > 0 || sending}
                    className="text-primary underline disabled:opacity-50"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
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