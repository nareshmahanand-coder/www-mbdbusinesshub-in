import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, RefreshCw, Loader2, CreditCard, AlertCircle, Clock, Landmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKycStatus } from "@/hooks/useKycStatus";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const EkycPage = () => {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { status, rejectionReason, loading, refresh } = useKycStatus();

  const [aadhaar, setAadhaar] = useState("");

  // Surepass Aadhaar OTP state
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [surepassClientId, setSurepassClientId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  const sendAadhaarOtp = async () => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length !== 12) return toast.error("कृपया 12 अंकों का सही आधार नंबर दर्ज करें");
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("surepass-aadhaar-otp", {
        body: { aadhaar_number: digits },
      });
      if (error) throw error;
      if (!data?.ok || !data?.client_id) throw new Error(data?.error || "OTP भेजने में त्रुटि");
      setSurepassClientId(data.client_id);
      setOtpSent(true);
      setResendCooldown(30);
      toast.success("OTP sent — Sandbox mode: enter any 6 digits");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OTP भेजने में त्रुटि";
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyAadhaarOtp = async () => {
    if (otp.length !== 6) return toast.error("कृपया 6 अंकों का OTP दर्ज करें");
    if (aadhaar.replace(/\D/g, "").length !== 12) return toast.error("कृपया पहले 12 अंकों का आधार नंबर दर्ज करें");
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("surepass-aadhaar-verify", {
        body: { client_id: surepassClientId || "sandbox", otp },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "OTP सत्यापन विफल");
      setAadhaarVerified(true);
      toast.success("✓ Aadhaar Verified — Redirecting to Membership");
      await refresh();
      setTimeout(() => navigate("/membership", { replace: true }), 700);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OTP सत्यापन विफल";
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main className="flex min-h-screen items-start justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-primary/20 bg-card shadow-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">KYC Processing</h1>
            <p className="font-hindi text-sm text-muted-foreground">आपका e-KYC जमा हो गया है। अब भारत गौरव मेंबरशिप पूरा करें।</p>
            <Button className="h-12 w-full font-bold" onClick={() => navigate("/membership", { replace: true })}>
              Bharat Gaurav Membership पर जाएं
            </Button>
            <Button variant="outline" className="w-full" onClick={() => refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Check Status
            </Button>
          </CardContent>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-primary/20 bg-card shadow-2xl">
        <header className="bg-primary px-5 py-6 text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <Landmark className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">Aadhaar e-KYC</h1>
              <p className="mt-1 font-hindi text-sm text-primary-foreground/90">सुरक्षित पहचान सत्यापन • Secure Identity Verification</p>
            </div>
          </div>
        </header>

        <CardContent className="space-y-5 p-5">
          {status === "rejected" && (
            <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="text-xs">
                <p className="font-semibold text-destructive">आपका KYC अस्वीकार हो गया • KYC Rejected</p>
                {rejectionReason && <p className="mt-1 text-muted-foreground">कारण: {rejectionReason}</p>}
                <p className="mt-1 text-muted-foreground">कृपया दोबारा सत्यापन पूरा करें।</p>
              </div>
            </div>
          )}

          <section className="rounded-lg border border-border bg-background p-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-foreground">
              <CreditCard className="h-5 w-5 text-primary" /> Aadhaar Verification
            </h2>

            <div className="space-y-5">
              {/* Aadhaar Number + Send OTP */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Aadhaar Number <span className="font-hindi text-muted-foreground">(आधार नंबर)</span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    inputMode="numeric"
                    placeholder="1234 5678 9012"
                    value={formatAadhaar(aadhaar)}
                    onChange={(e) => {
                      if (aadhaarVerified) return;
                      setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12));
                    }}
                    maxLength={14}
                    disabled={aadhaarVerified}
                    className="h-12 flex-1 text-center text-lg font-bold tracking-widest sm:text-left"
                  />
                  <Button
                    type="button"
                    onClick={sendAadhaarOtp}
                    disabled={sendingOtp || aadhaarVerified || aadhaar.replace(/\D/g, "").length !== 12 || resendCooldown > 0}
                    className="h-12 font-bold sm:w-44"
                  >
                    {sendingOtp ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : otpSent ? (
                      "Resend OTP"
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              </div>

              {/* OTP Box — always visible */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">
                  Enter 6-Digit OTP <span className="font-hindi text-muted-foreground">(6 अंकों का OTP)</span>
                </label>
                <div className="flex justify-center rounded-lg border border-border bg-muted/30 py-4">
                  <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, ""))} disabled={aadhaarVerified}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg font-bold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Sandbox: any 6 digits will be accepted as success
                </p>
              </div>

              {/* Verify & Proceed */}
              <Button
                type="button"
                onClick={verifyAadhaarOtp}
                disabled={verifyingOtp || aadhaarVerified || otp.length !== 6 || aadhaar.replace(/\D/g, "").length !== 12}
                className="h-14 w-full text-base font-extrabold shadow-lg"
              >
                {verifyingOtp ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                ) : aadhaarVerified ? (
                  <><ShieldCheck className="mr-2 h-5 w-5" /> Verified — Redirecting...</>
                ) : (
                  <><ShieldCheck className="mr-2 h-5 w-5" /> Verify & Proceed</>
                )}
              </Button>

              {aadhaarVerified && (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-center text-xs font-bold text-green-700">
                  ✓ Aadhaar Verified — Taking you to Bharat Gaurav Membership
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </div>
    </main>
  );
};

export default EkycPage;
