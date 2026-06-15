import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

const AUTH_NEXT_KEY = "mbd-auth-next";

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

    const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, ""));
    const authError = params.get("error_description") || params.get("error");
    if (authError) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      toast.error(authError);
      navigate("/login", { replace: true });
      return;
    }

    const hasAuthPayload = Boolean(params.get("code") || params.get("access_token"));
    if (window.location.pathname === "/auth/callback/native" && hasAuthPayload && !Capacitor.isNativePlatform()) {
      window.location.replace(`com.merabharatdukaan.app://auth/callback${window.location.search}${window.location.hash}`);
      return;
    }

    const completeNativeMagicLink = async () => {
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if ((!code && !(accessToken && refreshToken)) || exchangeStartedRef.current) return false;
      exchangeStartedRef.current = true;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
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

    void completeNativeMagicLink().catch((error: unknown) => {
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