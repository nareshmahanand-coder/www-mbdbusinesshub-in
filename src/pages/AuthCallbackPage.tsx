import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AUTH_NEXT_KEY = "mbd-auth-next";

const getSafeNextPath = () => {
  const stored = sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY) || "/dashboard";
  return stored.startsWith("/") && !stored.startsWith("//") ? stored : "/dashboard";
};

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, ""));
    const authError = params.get("error_description") || params.get("error");
    if (authError) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      toast.error(authError);
      navigate("/login", { replace: true });
      return;
    }

    if (loading) return;

    if (user) {
      const nextPath = getSafeNextPath();
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      navigate(nextPath, { replace: true });
      return;
    }

    toast.error("Google sign-in session complete नहीं हुआ। कृपया दोबारा कोशिश करें।");
    navigate("/login", { replace: true });
  }, [loading, navigate, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </main>
  );
};

export default AuthCallbackPage;