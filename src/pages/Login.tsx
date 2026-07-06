import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { getPostLoginDestinationForUser, sanitizeAuthNextPath } from "@/lib/authRedirect";

const getGoogleErrorMessage = (err: any) => {
  const rawMessage = String(err?.message || err || "");
  if (rawMessage.toLowerCase().includes("invalid_client") || rawMessage.toLowerCase().includes("client secret")) {
    return "Google OAuth client settings are invalid. Please re-check the Google Client ID/Secret saved in backend auth settings.";
  }
  if (
    rawMessage.includes("28444") ||
    rawMessage.includes("10:") ||
    rawMessage.includes("16:") ||
    rawMessage.toLowerCase().includes("developer console")
  ) {
    return "Google setup mismatch: Android package/SHA must be added in the same Google project as the Web Client ID used by this app.";
  }
  return rawMessage || "Google sign-in failed";
};

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

  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: getOAuthRedirectTo(next),
            queryParams: { prompt: "select_account" },
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error("Google login URL was not created");

        await Browser.open({ url: data.url, presentationStyle: "fullscreen" });
        return;
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: getOAuthRedirectTo(next, true),
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate(next, { replace: true });
    } catch (err: any) {
      toast.error(getGoogleErrorMessage(err));
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getOAuthRedirectTo(next),
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Please sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">मेरा भारत दुकान</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <button type="button" onClick={() => setMode("signup")} className="text-primary underline">
              Need an account? Create one
            </button>
          ) : (
            <button type="button" onClick={() => setMode("signin")} className="text-primary underline">
              Already have an account? Sign in
            </button>
          )}
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
