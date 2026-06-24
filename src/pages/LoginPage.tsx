import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";
const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
  "822103899326-1p22puug67ueab5u9p3mpi3edkvpr8od.apps.googleusercontent.com";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

const safeNextPath = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : POST_LOGIN_PATH;
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google login script failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google login script failed to load."));
    document.head.appendChild(script);
  });

const LoginPage = ({ initialMode = "login" }: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(
      fromUrl ||
        sessionStorage.getItem(AUTH_NEXT_KEY) ||
        localStorage.getItem(AUTH_NEXT_KEY)
    );
  }, [location.search]);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  useEffect(() => {
    let cancelled = false;

    const renderGoogleButton = async () => {
      if (!googleButtonRef.current) return;

      try {
        await loadGoogleIdentityScript();
        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response.credential) {
              toast.error("Google login failed. Please try again.");
              return;
            }

            setGoogleLoading(true);
            try {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
              });
              if (error) throw error;
              toast.success("✅ Logged in with Google.");
            } catch (error: unknown) {
              toast.error(getErrorMessage(error, "Google login failed. Try again."));
            } finally {
              setGoogleLoading(false);
            }
          },
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: authMode === "signup" ? "signup_with" : "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: "100%",
        });
        setGoogleReady(true);
      } catch (error: unknown) {
        if (!cancelled) {
          setGoogleReady(false);
          toast.error(getErrorMessage(error, "Google login is not available right now."));
        }
      }
    };

    void renderGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [authMode]);

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
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${nextPath}`,
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
            <div className="relative min-h-12">
              <div
                ref={googleButtonRef}
                aria-label="Continue with Google"
                className={googleLoading ? "pointer-events-none opacity-60" : undefined}
              />
              {(!googleReady || googleLoading) && (
                <div className="absolute inset-0 flex h-12 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {googleLoading ? "Signing in with Google..." : "Loading Google login..."}
                </div>
              )}
            </div>

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