import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Lock, Loader2 } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const param = (k: string) => url.searchParams.get(k) ?? hash.get(k);

        const errDesc = param("error_description") ?? param("error");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const tokenHash = param("token_hash") ?? param("token");
        const code = param("code");

        // 1) Implicit flow: tokens delivered in the URL hash
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState({}, "", "/reset-password");
          setReady(true);
          return;
        }

        // 2) PKCE flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", "/reset-password");
          setReady(true);
          return;
        }

        // 3) OTP token hash flow
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) throw error;
          window.history.replaceState({}, "", "/reset-password");
          setReady(true);
          return;
        }

        // 4) Already-authenticated recovery session
        const { data } = await supabase.auth.getSession();
        if (data.session) { setReady(true); return; }

        if (errDesc) {
          setLinkError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
          return;
        }
        setLinkError("Open this page from the password reset link sent to your email.");
      } catch (e: any) {
        console.error("[reset-password] token exchange failed", e);
        setLinkError(e?.message || "Reset link is invalid or expired. Request a new one.");
      } finally {
        setChecking(false);
      }
    })();
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/20 via-background to-secondary/20 px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] p-[3px] bg-[linear-gradient(160deg,hsl(var(--accent))_0%,hsl(var(--card))_45%,hsl(var(--primary))_100%)] shadow-2xl">
        <div className="rounded-[25px] bg-card px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <img src={logoCircle} alt="मेरा भारत दुकान logo" className="h-20 w-20 rounded-full border-4 border-background object-cover shadow-lg" />
            <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
          </div>

          {checking && !ready ? (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
            </p>
          ) : !ready ? (
            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-destructive">{linkError}</p>
              <Link to="/login" className="inline-block text-sm font-semibold text-primary hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="new-password" type="password" className="h-12 pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm-password" type="password" className="h-12 pl-10" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={busy}>
                {busy ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</span> : "Update Password"}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}