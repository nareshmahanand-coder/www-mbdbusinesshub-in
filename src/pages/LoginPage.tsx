import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import AdminPinAccess from "@/components/AdminPinAccess";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  initialMode?: AuthMode;
}

const SHOP_APP_ORIGIN = "https://shop.mbdbusinesshub.in";
const POST_LOGIN_MEMBERSHIP_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";

const getStandaloneAuthOrigin = () => {
  const hostname = window.location.hostname;
  if (hostname.endsWith("mbdbusinesshub.in")) return SHOP_APP_ORIGIN;
  return window.location.origin;
};

const safeNextPath = (value: string | null) => (value?.startsWith("/") ? value : POST_LOGIN_MEMBERSHIP_PATH);

const rememberNextPath = (path: string) => {
  const safePath = safeNextPath(path);
  sessionStorage.setItem(AUTH_NEXT_KEY, safePath);
  localStorage.setItem(AUTH_NEXT_KEY, safePath);
};

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

const LoginPage = (_props: LoginPageProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const nextPath = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get("next");
    return safeNextPath(fromUrl || sessionStorage.getItem(AUTH_NEXT_KEY) || localStorage.getItem(AUTH_NEXT_KEY));
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && user) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      localStorage.removeItem(AUTH_NEXT_KEY);
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, navigate, nextPath, user]);

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("कृपया सही email दर्ज करें / Please enter a valid email.");
      return;
    }

    setLoading(true);
    rememberNextPath(POST_LOGIN_MEMBERSHIP_PATH);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${getStandaloneAuthOrigin()}/auth/callback?next=${encodeURIComponent(POST_LOGIN_MEMBERSHIP_PATH)}`,
        },
      });
      if (error) throw error;
      sessionStorage.setItem("bharat-mitra-pending-greet", "true");
      setLinkSent(true);
      toast.success("✅ Login link भेज दिया गया है।");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Login नहीं हो सका। दोबारा कोशिश करें।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background tiranga-bg">
      <div className="h-1.5 w-full bg-gradient-to-r from-saffron via-background to-green-india" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <div className="text-center">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="mx-auto h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl" />
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">Continue with Email</h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">अपना email डालें — हम बाकी सब खुद कर देंगे।</p>
          </div>

          {linkSent ? (
            <div className="mt-6 space-y-4 rounded-xl border border-border bg-muted/40 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="text-base font-semibold text-foreground">{email} पर login link भेज दिया है।</p>
              <p className="font-hindi text-sm text-muted-foreground">कृपया अपना inbox खोलें और link पर tap करें — आप अपने आप Dashboard पर पहुँच जाएँगे।</p>
              <Button type="button" variant="outline" className="h-10 w-full" onClick={() => { setLinkSent(false); setEmail(""); }}>
                दूसरा email इस्तेमाल करें
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
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
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                OK
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
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