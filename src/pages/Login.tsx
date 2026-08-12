import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Capacitor } from "@capacitor/core";
import { Mail, Lock, User, Loader2, Phone } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { getPostLoginDestinationForUser, sanitizeAuthNextPath } from "@/lib/authRedirect";
import { linkUserToAgentCode } from "@/lib/agentReferral";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getOAuthRedirectTo = (next: string, forceWebCallback = false) => {
  const params = new URLSearchParams({ next });
  if (!forceWebCallback && Capacitor.isNativePlatform()) params.set("native", "1");
  return `${window.location.origin}/auth/callback?${params.toString()}`;
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, isSuperUser } = useAuth();
  const next = sanitizeAuthNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [regType, setRegType] = useState<"self" | "agent" | null>(null);
  const [agentId, setAgentId] = useState("");
  const [blockDialog, setBlockDialog] = useState<string | null>(null);
  const [lockedAgentCode, setLockedAgentCode] = useState<string | null>(null);

  /** Look up whether this email is permanently bound to an agent. */
  const fetchAgentBinding = async (targetEmail: string) => {
    const { data } = await supabase.rpc("agent_binding_for_email", { p_email: targetEmail });
    const row = Array.isArray(data) ? data[0] : data;
    return { bound: !!row?.bound, agentCode: (row?.agent_code as string | null) ?? null };
  };

  const linkAgentIfNeeded = async (userId: string) => {
    if (regType !== "agent") return;
    const code = agentId.trim().toUpperCase();
    if (!code) return;
    const res = await linkUserToAgentCode(userId, code);
    if (res.ok) toast.success(`Agent ${code} से जुड़ गए`);
    else toast.error("Agent ID अमान्य है — रजिस्ट्रेशन self के रूप में हुआ");
  };

  // When the email is already agent-bound, force the Agent option and lock the code.
  useEffect(() => {
    if (mode === "forgot") return;
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setLockedAgentCode(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { bound, agentCode } = await fetchAgentBinding(value);
      if (cancelled) return;
      if (bound && agentCode) {
        setLockedAgentCode(agentCode);
        setRegType("agent");
        setAgentId(agentCode);
      } else {
        setLockedAgentCode(null);
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email, mode]);

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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter your email");
      return;
    }
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      console.log("[forgot-password] requesting reset", { email: cleanEmail, redirectTo });
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (error) {
        console.error("[forgot-password] failed", error);
        if ((error as any).status === 429 || /rate limit|only request this after/i.test(error.message)) {
          toast.error("बहुत ज़्यादा प्रयास / Too many requests. Please wait a minute and try again.");
        } else {
          toast.error(`Reset failed: ${error.message}`);
        }
        return;
      }
      toast.success("Reset link sent. Check inbox and Spam/Promotions folder.");
      setMode("signin");
    } catch (err: any) {
      console.error("[forgot-password] unexpected error", err);
      toast.error(err?.message || "Could not send reset link");
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanEmail || !password) {
      toast.error("Email and password required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      toast.error("कृपया सही ईमेल दर्ज करें / Please enter a valid email");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("कृपया पूरा नाम दर्ज करें / Full name is required");
        return;
      }
      if (cleanMobile.length !== 10) {
        toast.error("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें / Enter a valid 10-digit mobile number");
        return;
      }
      if (password.length < 6) {
        toast.error("पासवर्ड कम से कम 6 अक्षर का होना चाहिए / Password must be at least 6 characters");
        return;
      }
    }
    if (!regType) {
      toast.error("कृपया पहले Self या Agent चुनें / Please select Self or Agent");
      return;
    }
    if (regType === "agent" && !agentId.trim()) {
      toast.error("कृपया Agent ID दर्ज करें");
      return;
    }
    setBusy(true);
    try {
      // Enforce permanent agent binding — no bypass, even after re-install.
      const { bound, agentCode } = await fetchAgentBinding(cleanEmail);
      if (bound && agentCode) {
        setLockedAgentCode(agentCode);
        setRegType("agent");
        setAgentId(agentCode);
        if (regType === "self") {
          setBlockDialog(
            "This email is already registered via an Agent. You must use the agent-linked access."
          );
          return;
        }
        if (agentId.trim().toUpperCase() !== agentCode.toUpperCase()) {
          setBlockDialog("Already registered with an agent. Agent cannot be changed.");
          return;
        }
      }
      if (mode === "signup") {
        const fullName = name.trim() || cleanEmail.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: getOAuthRedirectTo(next),
            data: { full_name: fullName, phone: cleanMobile },
          },
        });
        if (error) throw error;

        // Auto-confirm is enabled, so sign the user in right away.
        let activeSession = data.session ?? null;
        if (!activeSession) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (signInError) throw signInError;
          activeSession = signInData.session ?? null;
        }

        if (!activeSession?.user) {
          toast.success("Account created. Please sign in.");
          setMode("signin");
          return;
        }

        // Make sure the profile row carries the details entered at signup.
        await supabase.from("profiles").upsert(
          {
            id: activeSession.user.id,
            email: activeSession.user.email ?? cleanEmail,
            display_name: fullName,
            phone: cleanMobile,
            provider: "email",
          },
          { onConflict: "id" }
        );

        toast.success("Account created successfully");
        await linkAgentIfNeeded(activeSession.user.id);
        if (!Capacitor.isNativePlatform()) {
          const destination = getPostLoginDestinationForUser(activeSession.user, next, isSuperUser);
          window.location.replace(destination);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;

        // Website-only hard redirect after password login. Relying only on the
        // auth-state event can leave the web route guard seeing a stale empty
        // session and sending the user back to /login. Do not change the native
        // Android flow here.
        if (!Capacitor.isNativePlatform()) {
          const { data: verifiedAuth } = await supabase.auth.getSession();
          const activeUser = verifiedAuth.session?.user ?? data.session?.user ?? null;
          if (!activeUser) throw new Error("No active session after sign in");
          await linkAgentIfNeeded(activeUser.id);
          const destination = getPostLoginDestinationForUser(activeUser, next, isSuperUser);
          window.location.replace(destination);
          return;
        }
        if (data.session?.user) await linkAgentIfNeeded(data.session.user.id);
      }
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/20 via-background to-secondary/20 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] p-[3px] bg-[linear-gradient(160deg,hsl(var(--accent))_0%,hsl(var(--card))_45%,hsl(var(--primary))_100%)] shadow-2xl">
        <div className="rounded-[25px] bg-card px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={logoCircle}
              alt="मेरा भारत दुकान logo"
              className="h-20 w-20 rounded-full border-4 border-background object-cover shadow-lg"
            />
            <h1 className="text-2xl font-bold text-foreground">मेरा भारत दुकान</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Mera Bharat Dukaan
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-accent" />
              <span className="h-1.5 w-8 rounded-full bg-muted" />
              <span className="h-1.5 w-8 rounded-full bg-primary" />
            </div>
            <p className="pt-1 text-sm font-medium text-foreground">
              {mode === "signin" ? "Sign in to your account" : mode === "signup" ? "Create a new account" : "Reset your password"}
            </p>
          </div>

          <form onSubmit={mode === "forgot" ? handleForgot : handleEmail} className="mt-6 space-y-4">
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label>रजिस्ट्रेशन प्रकार / Registration type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (lockedAgentCode) {
                        setBlockDialog(
                          "This email is already registered via an Agent. You must use the agent-linked access."
                        );
                        return;
                      }
                      setRegType("self");
                    }}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                      regType === "self" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    Self
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegType("agent")}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                      regType === "agent" ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    Agent
                  </button>
                </div>
                {!regType && (
                  <p className="font-hindi text-[11px] text-destructive">
                    आगे बढ़ने के लिए Self या Agent चुनना अनिवार्य है।
                  </p>
                )}
                {regType === "agent" && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="agentId">Agent ID</Label>
                    <Input
                      id="agentId"
                      className="h-12 font-mono uppercase"
                      placeholder="AG123ABC"
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value.toUpperCase())}
                      readOnly={!!lockedAgentCode}
                      required
                    />
                    <p className="font-hindi text-[11px] text-muted-foreground">
                      {lockedAgentCode
                        ? "यह खाता पहले से इसी Agent से जुड़ा है — इसे बदला नहीं जा सकता।"
                        : "एजेंट के माध्यम से रजिस्ट्रेशन के लिए उनका Agent ID दर्ज करें।"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" className="h-12 pl-10" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-12 pl-10"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="h-12 pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="h-12 pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</span>
              ) : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">
                  Forgot Password?
                </button>
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  Create a new account
                </button>
              </>
            )}
            {mode !== "signin" && (
              <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">
                Back to Sign In
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline">Terms of Service &amp; Privacy Policy</Link>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
          </div>
        </div>
      </div>

      <AlertDialog open={!!blockDialog} onOpenChange={(open) => !open && setBlockDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agent-linked account</AlertDialogTitle>
            <AlertDialogDescription>{blockDialog}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBlockDialog(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
