import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { supabaseOAuth } from "@/lib/supabaseOAuthClient";
import { Capacitor } from "@capacitor/core";

const AUTH_NEXT_KEY = "mbd-auth-next";

const getAuthParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  return params;
};

const buildNativeIntentUrl = (params: URLSearchParams) => {
  const nativeParams = new URLSearchParams(params);
  nativeParams.delete("native");
  const callbackQuery = nativeParams.toString();
  const fallback = `${window.location.origin}/login`;
  return `intent://auth/callback${callbackQuery ? `?${callbackQuery}` : ""}#Intent;scheme=com.merabharatdukaan.app;package=com.merabharatdukaan.app;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
};

const getSafeNextPath = () => {
  const stored = sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY) || "/dashboard";
  return stored.startsWith("/") && !stored.startsWith("//") ? stored : "/dashboard";
};

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const exchangeStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const finishLogin = () => {
      const nextPath = getSafeNextPath();
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      navigate(nextPath, { replace: true });
    };

    const params = getAuthParams();
    const authError = params.get("error_description") || params.get("error");
    if (authError) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      toast.error(authError);
      navigate("/login", { replace: true });
      return;
    }

    const hasAuthPayload = Boolean(params.get("code") || params.get("access_token"));
    if (params.get("native") === "1" && hasAuthPayload && !Capacitor.isNativePlatform()) {
      window.location.replace(buildNativeIntentUrl(params));
      return;
    }

    const completeOAuthCallback = async () => {
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if ((!code && !(accessToken && refreshToken)) || exchangeStartedRef.current) return false;
      exchangeStartedRef.current = true;

      if (code) {
        const { data: oauthData, error: exchangeError } = await supabaseOAuth.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) throw exchangeError;
        if (!oauthData.session) throw new Error("Google sign-in session नहीं मिला। कृपया दोबारा कोशिश करें।");
        const { error } = await supabase.auth.setSession({
          access_token: oauthData.session.access_token,
          refresh_token: oauthData.session.refresh_token,
        });
        if (error) throw error;
        finishLogin();
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (cancelled) return;
        if (error) throw error;
        finishLogin();
      }
      return true;
    };

    void completeOAuthCallback().catch((error: unknown) => {
      if (cancelled) return;
      exchangeStartedRef.current = false;
      toast.error(error instanceof Error ? error.message : "Login link complete नहीं हुआ। कृपया दोबारा कोशिश करें।");
      navigate("/login", { replace: true });
    });

    if (loading) return;

    if (user) {
      finishLogin();
      return;
    }

    if (!params.get("code") && !params.get("access_token")) {
      toast.error("Google sign-in session complete नहीं हुआ। कृपया दोबारा कोशिश करें।");
      navigate("/login", { replace: true });
    }

    return () => {
      cancelled = true;
    };
  }, [loading, navigate, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </main>
  );
};

export default AuthCallbackPage;