import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

let nativeGoogleClientIdPromise: Promise<string> | null = null;
let nativeGoogleInitialized = false;

const sanitizeNext = (value: string | null): string => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/auth")) return "/dashboard";
  return value;
};

const getOAuthRedirectTo = (next: string) => {
  const encodedNext = encodeURIComponent(next);
  if (Capacitor.isNativePlatform()) {
    return `com.merabharatdukaan.app://auth/callback?next=${encodedNext}`;
  }
  return `${window.location.origin}/auth/callback?next=${encodedNext}`;
};

const getNativeGoogleClientId = async () => {
  const envClientId = (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined)?.trim();
  if (envClientId) return envClientId;

  nativeGoogleClientIdPromise ??= supabase.functions
    .invoke<{ clientId?: string }>("google-client-id")
    .then(({ data, error }) => {
      if (error) throw error;
      const clientId = data?.clientId?.trim();
      if (!clientId) throw new Error("Google sign-in is not configured yet.");
      return clientId;
    });

  return nativeGoogleClientIdPromise;
};

const initializeNativeGoogle = async () => {
  if (!Capacitor.isNativePlatform() || nativeGoogleInitialized) return;
  const webClientId = await getNativeGoogleClientId();
  await SocialLogin.initialize({
    google: {
      webClientId,
      mode: "online",
    },
  });
  nativeGoogleInitialized = true;
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

  // Initialize native Google Sign-In once when running inside the Android/iOS app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    initializeNativeGoogle().catch(() => {});
  }, []);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Native Google Sign-In via Android Credential Manager / iOS SDK.
        // Returns a Google ID token that Supabase can verify directly — no
        // external browser, no WebView redirect, no "Browser plugin" error.
        await initializeNativeGoogle();
        const res: any = await SocialLogin.login({
          provider: "google",
          options: { scopes: ["email", "profile"] },
        });
        const idToken: string | undefined =
          res?.result?.idToken || res?.result?.responseAccessToken || undefined;
        if (!idToken) throw new Error("Google Sign-In returned no idToken");

        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) throw error;
        return; // AuthProvider onAuthStateChange will route the user.
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthRedirectTo(next),
          skipBrowserRedirect: false,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      void data;
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
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
