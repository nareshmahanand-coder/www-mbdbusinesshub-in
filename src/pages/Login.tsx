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
import { Browser } from "@capacitor/browser";
import { getPostLoginDestinationForUser, sanitizeAuthNextPath } from "@/lib/authRedirect";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";

const APP_ORIGIN = "https://shop.mbdbusinesshub.in";
// Public Google Web Client ID used by the current managed Google sign-in flow.
// Android native Google Sign-In must request an ID token for the same audience,
// then the backend can create the app session without any redirect URI round-trip.
const GOOGLE_WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined)?.trim() ||
  "36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com";
const WEBSITE_AUTH_NEXT_KEY = "mbd-auth-next";

const isEmbeddedWebsitePreview = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const rememberWebsiteAuthNext = (nextPath: string) => {
  try {
    sessionStorage.setItem(WEBSITE_AUTH_NEXT_KEY, nextPath);
    localStorage.setItem(WEBSITE_AUTH_NEXT_KEY, nextPath);
  } catch {
    // Storage can be unavailable in some browsers; login still continues.
  }
};

const isNativeGoogleConfigError = (err: any) => {
  const raw = [err?.message, err?.code, err?.errorMessage, err]
    .filter(Boolean)
    .map(String)
    .join(" ")
    .toLowerCase();
  return (
    raw.includes("developer_error") ||
    raw.includes("api_exception") ||
    raw.includes("10:") ||
    raw.includes("16:") ||
    raw.includes("package name") ||
    raw.includes("sha") ||
    raw.includes("cannot find provider") ||
    raw.includes("not initialized")
  );
};

/** True when the native SocialLogin plugin is missing from this Android build. */
const isPluginUnavailableError = (err: any) => {
  const raw = [err?.message, err?.code, err?.errorMessage, err]
    .filter(Boolean)
    .map(String)
    .join(" ")
    .toLowerCase();
  return (
    raw.includes("not implemented") ||
    raw.includes("not available") ||
    raw.includes("unimplemented") ||
    raw.includes("plugin is not")
  );
};

const getGoogleErrorMessage = (err: any) => {
  const rawMessage = [err?.message, err?.code, err?.errorMessage, err]
    .filter(Boolean)
    .map(String)
    .join(" ");
  const lowerMessage = rawMessage.toLowerCase();
  if (lowerMessage.includes("invalid_client") || lowerMessage.includes("client secret")) {
    return "Google OAuth client settings are invalid. Please re-check the Google Client ID/Secret saved in backend auth settings.";
  }
  if (
    lowerMessage.includes("developer_error") ||
    /(^|\D)10($|\D)/.test(rawMessage) ||
    lowerMessage.includes("api_exception") ||
    lowerMessage.includes("package name") ||
    lowerMessage.includes("sha")
  ) {
    return "Android Google Sign-In setup is incomplete for the Play Store release: add package com.merabharatdukaan.app2 with the Play App Signing SHA-1/SHA-256 in Google/Firebase, then rebuild the AAB.";
  }
  if (
    lowerMessage.includes("redirect_uri_mismatch") ||
    rawMessage.includes("28444") ||
    /(^|\D)16($|\D)/.test(rawMessage) ||
    lowerMessage.includes("developer console")
  ) {
    return "Google redirect mismatch: add this exact callback in Google OAuth Web Client: https://shop.mbdbusinesshub.in/~oauth/callback";
  }
  return rawMessage || "Google sign-in failed";
};

const getOAuthRedirectTo = (next: string, forceWebCallback = false) => {
  const params = new URLSearchParams({ next });
  if (!forceWebCallback && Capacitor.isNativePlatform()) params.set("native", "1");
  const origin = Capacitor.isNativePlatform() ? APP_ORIGIN : window.location.origin;
  return `${origin}/auth/callback?${params.toString()}`;
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
    const isNative = Capacitor.isNativePlatform();

    // Web-friendly fallback that works on any Android build, even when the
    // native Google plugin is not compiled into the APK. Opens the standard
    // Supabase Google OAuth page in the system browser and returns to the app
    // through the existing /auth/callback -> deep-link bridge.
    const runNativeBrowserGoogleLogin = async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthRedirectTo(next),
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Google sign-in URL was not returned");
      await Browser.open({ url: data.url, presentationStyle: "popover" });
    };

    try {
      if (isNative) {
        // Preferred: native Google Sign-In -> ID token -> app session.
        // If the SocialLogin plugin is missing from the build (the
        // "SocialLogin plugin is not implemented on android" error), fall back
        // to the browser OAuth flow so login still works.
        if (!Capacitor.isPluginAvailable("SocialLogin")) {
          await runNativeBrowserGoogleLogin();
          return;
        }

        // Keep the native token audience deterministic. Reading it from remote
        // config/localStorage can pair a release APK with a stale OAuth project.
        let googleLogin: any;
        try {
          await SocialLogin.initialize({
            google: {
              webClientId: GOOGLE_WEB_CLIENT_ID,
              mode: "online",
            },
          });
          googleLogin = await SocialLogin.login({
            provider: "google",
            options: { scopes: ["email", "profile"] },
          });
        } catch (nativeErr: any) {
          if (isPluginUnavailableError(nativeErr)) {
            console.warn("[google-auth] SocialLogin unavailable, using browser OAuth", nativeErr);
            await runNativeBrowserGoogleLogin();
            return;
          }
          throw nativeErr;
        }
        const idToken = googleLogin.result.responseType === "online"
          ? googleLogin.result.idToken
          : null;
        if (!idToken) {
          throw new Error("Google did not return an Android ID token");
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) throw error;
        if (!data.session?.user) throw new Error("No active session after Google sign-in");

        await persistNativeAuthSession(data.session);
        const destination = getPostLoginDestinationForUser(data.session.user, next, isSuperUser);
        window.location.replace(destination);
        return;
      }

      const isEmbeddedWeb = isEmbeddedWebsitePreview();
      if (!isEmbeddedWeb) rememberWebsiteAuthNext(next);

      const result = await lovable.auth.signInWithOAuth("google", {
        // Website root cause: in a normal top-level website tab the managed OAuth
        // library performs a full-page redirect and returns before it can call
        // supabase.auth.setSession(). Sending that flow back to `/` leaves the
        // app without an explicit callback, so protected routes send the user
        // back to /login. Embedded Lovable preview still uses origin for the
        // web_message popup flow; published/custom-domain website uses the
        // app callback route to persist the returned tokens.
        redirect_uri: isEmbeddedWeb ? window.location.origin : `${window.location.origin}/auth/callback`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // Wrapper already set the session; hard-replace so the app boots with it
      // and ProtectedRoute doesn't briefly see an empty auth state.
      const { data } = await supabase.auth.getSession();
      const destination = getPostLoginDestinationForUser(data.session?.user ?? null, next, isSuperUser);
      window.location.replace(destination);
    } catch (err: any) {
      const message = getGoogleErrorMessage(err);
      if (isNative && isNativeGoogleConfigError(err)) {
        sessionStorage.setItem("mbd-native-google-config-error", String(Date.now()));
        console.error("[google-auth] Native Android Google Sign-In configuration failed", err);
      }
      toast.error(message);
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
