import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Capacitor } from "@capacitor/core";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { getPostLoginDestinationForUser, sanitizeAuthNextPath } from "@/lib/authRedirect";

const getOAuthRedirectTo = (next: string, forceWebCallback = false) => {
  const params = new URLSearchParams({ next });
  if (!forceWebCallback && Capacitor.isNativePlatform()) params.set("native", "1");
  return `${window.location.origin}/auth/callback?${params.toString()}`;
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, isSuperUser } = useAuth();
  const next = sanitizeAuthNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated, leave the login page.
  useEffect(() => {
    if (!loading && user) {
      const destination = getPostLoginDestinationForUser(user, next, isSuperUser);
      if (Capacitor.isNativePlatform()) {
        window.location.replace(destination);
      } else {
        navigate(destination, { replace: true });
      }
    }
  }, [loading, user, next, navigate, isSuperUser]);

  // Android WebView can return to /login before React auth context receives the
  // OAuth SIGNED_IN event. If a valid session is already stored, leave login
  // immediately instead of showing a loop.
  useEffect(() => {
    if (loading || user) return;
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session) return;
      const destination = getPostLoginDestinationForUser(data.session.user, next, isSuperUser);
      if (Capacitor.isNativePlatform()) {
        window.location.replace(destination);
      } else {
        navigate(destination, { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loading, user, next, navigate, isSuperUser]);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email");
      setMode("signin");
    } catch (err: any) {
      toast.error(err?.message || "Could not send reset link");
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const fullName = name || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getOAuthRedirectTo(next),
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        // Auto-confirm is enabled, so sign the user in right away.
        let activeSession = data.session ?? null;
        if (!activeSession) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          activeSession = signInData.session ?? null;
        }

        if (!activeSession?.user) {
          toast.success("Account created. Please sign in.");
          setMode("signin");
          return;
        }

        // Make sure the profile row carries the details entered at signup.
        await supabase.from("profiles").upsert(
          {
            id: activeSession.user.id,
            email: activeSession.user.email ?? email,
            display_name: fullName,
            provider: "email",
          },
          { onConflict: "id" }
        );

        toast.success("Account created successfully");
        if (!Capacitor.isNativePlatform()) {
          const destination = getPostLoginDestinationForUser(activeSession.user, next, isSuperUser);
          window.location.replace(destination);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Website-only hard redirect after password login. Relying only on the
        // auth-state event can leave the web route guard seeing a stale empty
        // session and sending the user back to /login. Do not change the native
        // Android flow here.
        if (!Capacitor.isNativePlatform()) {
          const { data: verifiedAuth } = await supabase.auth.getSession();
          const activeUser = verifiedAuth.session?.user ?? data.session?.user ?? null;
          if (!activeUser) throw new Error("No active session after sign in");
          const destination = getPostLoginDestinationForUser(activeUser, next, isSuperUser);
          window.location.replace(destination);
          return;
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/20 via-background to-secondary/20 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] p-[3px] bg-[linear-gradient(160deg,hsl(var(--accent))_0%,hsl(var(--card))_45%,hsl(var(--primary))_100%)] shadow-2xl">
        <div className="rounded-[25px] bg-card px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={logoCircle}
              alt="मेरा भारत दुकान logo"
              className="h-20 w-20 rounded-full border-4 border-background object-cover shadow-lg"
            />
            <h1 className="text-2xl font-bold text-foreground">मेरा भारत दुकान</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Mera Bharat Dukaan
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-accent" />
              <span className="h-1.5 w-8 rounded-full bg-muted" />
              <span className="h-1.5 w-8 rounded-full bg-primary" />
            </div>
            <p className="pt-1 text-sm font-medium text-foreground">
              {mode === "signin" ? "Sign in to your account" : mode === "signup" ? "Create a new account" : "Reset your password"}
            </p>
          </div>

          <form onSubmit={mode === "forgot" ? handleForgot : handleEmail} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" className="h-12 pl-10" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="h-12 pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="h-12 pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</span>
              ) : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">
                  Forgot Password?
                </button>
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  Create a new account
                </button>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">
                Back to Sign In
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline">Terms of Service &amp; Privacy Policy</Link>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
