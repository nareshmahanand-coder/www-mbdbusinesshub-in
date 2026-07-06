import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";
import type { Session } from "@supabase/supabase-js";

const NATIVE_CALLBACK_SCHEME = "com.merabharatdukaan.app://auth/callback";

const sanitizeNext = (value: string | null): string => {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/auth")) return "/dashboard";
  return value;
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const next = sanitizeNext(searchParams.get("next"));

    (async () => {
      try {
        const isNativeWebView = Capacitor.isNativePlatform();
        const isNativeBrowserCallback = searchParams.get("native") === "1" && !isNativeWebView;

        if (isNativeWebView) {
          void Browser.close().catch(() => {});
        }

        const url = new URL(window.location.href);
        if (isNativeBrowserCallback) {
          const nativeSearch = new URLSearchParams(url.search);
          nativeSearch.delete("native");
          window.location.replace(`${NATIVE_CALLBACK_SCHEME}?${nativeSearch.toString()}${url.hash}`);
          return;
        }

        const callbackError = url.searchParams.get("error_description") || url.searchParams.get("error");
        if (callbackError) throw new Error(callbackError);

        const code = url.searchParams.get("code");
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token") || url.searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || url.searchParams.get("refresh_token");
        let activeSession: Session | null = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!data.session) throw new Error("No active session after Google callback");
          activeSession = data.session;
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (!data.session) throw new Error("No active session after callback");
          activeSession = data.session;
        } else {
          throw new Error("Missing authentication code");
        }

        if (activeSession) {
          await persistNativeAuthSession(activeSession);
          sessionStorage.setItem("mbd-auth-callback-ok", String(Date.now()));
        }

        // Hard replace after OAuth so the app boots with the freshly saved session.
        // This prevents the protected route guard from seeing a stale empty auth state
        // and sending the user back to /login in the Android WebView.
        window.location.replace(next);
      } catch (err: any) {
        setError(err?.message || "Authentication failed");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {error ? `${error} — redirecting…` : "Signing you in…"}
        </p>
      </div>
    </div>
  );
}
