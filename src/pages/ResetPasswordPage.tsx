import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { KeyRound, Loader2 } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    const next = new URLSearchParams(location.search).get("next") || sessionStorage.getItem("mbd-auth-next") || "/dashboard";
    return next.startsWith("/") ? next : "/dashboard";
  }, [location.search]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("type") === "recovery") {
      toast.info("Set a new password to continue.");
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully.");
      navigate(nextPath, { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "Could not update password.");
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
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">Reset Password</h1>
            <p className="mt-1 text-sm font-hindi text-muted-foreground">अपना नया सुरक्षित पासवर्ड बनाएँ</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={loading || authLoading} className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
              Update Password
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-primary hover:underline">Back to Login</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;