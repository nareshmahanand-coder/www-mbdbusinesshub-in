import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const POST_LOGIN_ROUTE = "/auth/continue";
const AUTH_NEXT_KEY = "mbd-auth-next";

const resetAuthRedirectState = () => {
  sessionStorage.setItem(AUTH_NEXT_KEY, POST_LOGIN_PATH);
  localStorage.setItem(AUTH_NEXT_KEY, POST_LOGIN_PATH);
};
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      resetAuthRedirectState();

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${POST_LOGIN_ROUTE}`,
        extraParams: { prompt: "select_account" },
      });

      if (result.redirected) return;
      if (result.error) throw result.error;

      toast.success("✅ Logged in with Google.");
      navigate(POST_LOGIN_ROUTE, { replace: true });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Google login failed. Try again."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!isValidEmail(cleanEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (authMode === "signup" && cleanName.length < 2) {
      toast.error("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      resetAuthRedirectState();

      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanName, name: cleanName },
          },
        });
        if (error) throw error;
        toast.success("✅ Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        toast.success("✅ Logged in.");
      }
      navigate(POST_LOGIN_ROUTE, { replace: true });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Authentication failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background tiranga-bg">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-background to-green-india" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
          <div className="text-center">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="mx-auto h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl"
            />
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">
              {authMode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {authMode === "signup"
                ? "Sign up with your name, email and password."
                : "Log in with Google or your email and password."}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="h-12 w-full"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground">
                  G
                </span>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="full-name">Name</Label>
                  <Input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : authMode === "signup" ? (
                  <UserPlus className="h-5 w-5" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {authMode === "signup" ? "Create Account" : "Log In"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
              className="w-full text-center text-sm text-muted-foreground underline"
            >
              {authMode === "signup"
                ? "Already have an account? Log in"
                : "New here? Create an account"}
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>

          <div className="mt-3 text-center">
            <AdminPinAccess />
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;