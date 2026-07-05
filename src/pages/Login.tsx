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
import { SocialLogin } from "@capgo/capacitor-social-login";

const getGoogleErrorMessage = (err: any) => {
  const rawMessage = String(err?.message || err || "");
  if (rawMessage.toLowerCase().includes("invalid_client") || rawMessage.toLowerCase().includes("client secret")) {
    return "Google backend settings still have an invalid client secret. Android login now uses native Google token sign-in instead of that broken browser code path.";
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

let nativeGoogleInitPromise: Promise<void> | null = null;

const initializeNativeGoogleLogin = async () => {
  if (nativeGoogleInitPromise) return nativeGoogleInitPromise;

  nativeGoogleInitPromise = (async () => {
    const { data, error } = await supabase.functions.invoke<{ clientId?: string }>("google-client-id");
    if (error) throw error;

    const webClientId = data?.clientId?.trim();
    if (!webClientId) {
      throw new Error("Google Web Client ID is missing in backend settings");
    }

    await SocialLogin.initialize({
      google: {
        webClientId,
        mode: "online",
      },
    });
  })().catch((error) => {
    nativeGoogleInitPromise = null;
    throw error;
  });

  return nativeGoogleInitPromise;
};

const sanitizeNext = (value: string | null): string => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/auth")) return "/dashboard";
  return value;
};

const getOAuthRedirectTo = (next: string, forceWebCallback = false) => {
  const params = new URLSearchParams({ next });
  if (!forceWebCallback && Capacitor.isNativePlatform()) params.set("native", "1");
  return `${window.location.origin}/auth/callback?${params.toString()}`;
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const next = sanitizeNext(searchParams.get("next"));

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated, leave the login page.
  useEffect(() => {
    if (!loading && user) {
      navigate(next, { replace: true });
    }
  }, [loading, user, next, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        await initializeNativeGoogleLogin();
        const googleLogin = await SocialLogin.login({
          provider: "google",
          options: {
            scopes: ["email", "profile"],
            prompt: "select_account",
            filterByAuthorizedAccounts: false,
            autoSelectEnabled: false,
          },
        });

        const googleResult = googleLogin.result;
        if (googleResult.responseType !== "online" || !googleResult.idToken) {
          throw new Error("Google did not return an ID token");
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: googleResult.idToken,
          access_token: googleResult.accessToken?.token,
        });
        if (error) throw error;
        if (!data.session) throw new Error("No active session after Google sign-in");

        const { data: verifiedSession, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!verifiedSession.session) throw new Error("No active session after Google sign-in");

        window.location.replace(next);
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
