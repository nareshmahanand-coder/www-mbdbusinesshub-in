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
import { lovable } from "@/integrations/lovable";
import { SUPERUSER_FLAG, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const SUPERUSER_PIN = "02032026";
const SUPERUSER_EMAIL = "superuser@mbd.local";
const SUPERUSER_PASSWORD = "MBD_SuperUser_02032026!";
const SHOP_APP_ORIGIN = "https://shop.mbdbusinesshub.in";
const POST_LOGIN_MEMBERSHIP_PATH = "/dashboard";

const getStandaloneAuthOrigin = () => {
  const hostname = window.location.hostname;
  if (hostname.endsWith("mbdbusinesshub.in")) return SHOP_APP_ORIGIN;
  return window.location.origin;
};

const safeNextPath = (value: string | null) => (value?.startsWith("/") ? value : POST_LOGIN_MEMBERSHIP_PATH);

const LoginPage = ({ initialMode = "login" }: LoginPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem("mbd-auth-next"));
  }, [location.search]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem("mbd-auth-next");
      navigate(POST_LOGIN_MEMBERSHIP_PATH, { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    sessionStorage.setItem("mbd-auth-next", POST_LOGIN_MEMBERSHIP_PATH);
    sessionStorage.setItem("bharat-mitra-pending-greet", "true");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${getStandaloneAuthOrigin()}/login?next=${encodeURIComponent(POST_LOGIN_MEMBERSHIP_PATH)}`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast.error("Google login failed. Please try again.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate(POST_LOGIN_MEMBERSHIP_PATH, { replace: true });
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Login failed. Please try again.");
      setGoogleLoading(false);
    }
  };

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
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    sessionStorage.setItem("mbd-auth-next", POST_LOGIN_MEMBERSHIP_PATH);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${getStandaloneAuthOrigin()}/login?next=${encodeURIComponent(POST_LOGIN_MEMBERSHIP_PATH)}`,
          },
        });
        if (error) throw error;
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
            <p className="mt-1 text-sm font-hindi text-muted-foreground">Digital India access · Google और Email से सुरक्षित प्रवेश</p>
          </div>

          <Button onClick={handleGoogleLogin} disabled={googleLoading || loading} className="mt-6 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {googleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />
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

            <Button type="submit" disabled={loading || googleLoading} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : mode === "signup" ? <UserPlus className="mr-2 h-5 w-5" /> : <Mail className="mr-2 h-5 w-5" />}
              {mode === "signup" ? "Sign Up" : "Login"}
            </Button>
          </form>

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
            <button type="button" onClick={() => setPinDialogOpen(true)} className="text-[10px] text-muted-foreground/40 underline-offset-2 hover:text-muted-foreground hover:underline">
              Official Authorized System
            </button>
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