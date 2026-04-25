import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";

const MembershipGatePage = ({ onActivated }: { onActivated: () => void }) => {
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  const planDetails = {
    monthly: { price: 99, label: "₹99", duration: "1 महीना", days: 30 },
    yearly: { price: 999, label: "₹999", duration: "1 साल", days: 365 },
  };

  const handlePayment = async () => {
    if (!user) return;
    setSubmitting(true);
    setPaymentFailed(false);

    try {
      await startInstantRazorpayPayment({
        module: "bharat_gaurav",
        plan,
        onSuccess: () => {
          toast.success("Payment successful — membership unlocked!");
          onActivated();
          window.location.reload();
        },
        onFailure: () => setPaymentFailed(true),
      });
    } catch (error) {
      setPaymentFailed(true);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-saffron/10 via-background to-green-india/10 px-4">
        <Card className="w-full max-w-md border-2 border-accent shadow-2xl text-center">
          <CardContent className="py-10 space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-india/20">
              <CheckCircle2 className="h-12 w-12 text-green-india" />
            </div>
            <h2 className="font-hindi text-2xl font-extrabold text-foreground">धन्यवाद! 🙏</h2>
            <p className="font-hindi text-base text-foreground leading-relaxed">
              आपका Transaction ID प्राप्त हो गया है।<br />
              <span className="font-bold text-accent">सत्यापन के बाद</span> आपकी मेंबरशिप एक्टिव कर दी जाएगी।
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2">
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-semibold text-amber-700">Verification Pending</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Premium features unlock automatically once payment is verified by our team.
              You'll keep seeing this screen until then.
            </p>
            {receiptData && (
              <Button variant="outline" onClick={() => downloadReceipt(receiptData)} className="w-full border-accent text-accent font-semibold gap-2">
                <Download className="h-4 w-4" /> Receipt फिर से डाउनलोड करें
              </Button>
            )}
            <Button onClick={onActivated} variant="outline" className="mt-2 w-full font-semibold text-base py-5">
              Refresh Status / स्टेटस रिफ्रेश करें
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-saffron/10 via-background to-green-india/10">
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-green-india" />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-md border-2 border-saffron/30 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-2">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="mx-auto h-20 w-20 rounded-full object-cover shadow-lg border-4 border-saffron/40" />
            <CardTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-accent" /> भारत गौरव मेंबरशिप
            </CardTitle>
            <p className="text-xs text-muted-foreground">Bharat Gaurav Membership — Unlock all features</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 text-center">
              <p className="font-hindi text-sm leading-relaxed text-foreground">
                ऐप की सभी सुविधाओं का लाभ लेने के लिए <span className="font-bold text-accent">भारत गौरव मेंबरशिप</span> लें।
                पेमेंट करें और <span className="font-bold text-green-india">तुरंत एक्सेस पाएं!</span>
              </p>
            </div>

            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPlan("monthly")}
                className={`rounded-xl border-2 p-4 text-center transition-all ${plan === "monthly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <p className="text-2xl font-extrabold text-foreground">₹99</p>
                <p className="text-xs text-muted-foreground font-hindi">मासिक / Monthly</p>
              </button>
              <button onClick={() => setPlan("yearly")}
                className={`rounded-xl border-2 p-4 text-center transition-all relative ${plan === "yearly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <span className="absolute -top-2 right-2 rounded-full bg-green-india px-2 py-0.5 text-[9px] font-bold text-primary-foreground">BEST VALUE</span>
                <p className="text-2xl font-extrabold text-foreground">₹999</p>
                <p className="text-xs text-muted-foreground font-hindi">वार्षिक / Yearly</p>
              </button>
            </div>

            <Button onClick={handlePayment} disabled={submitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-6 gap-2 shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}
              Pay {planDetails[plan].label} & Unlock Instantly
            </Button>
            {paymentFailed && (
              <Button onClick={handlePayment} disabled={submitting} variant="outline" className="w-full font-bold">
                Retry Payment
              </Button>
            )}
            <p className="text-center text-[10px] text-muted-foreground font-hindi">सफल Razorpay पेमेंट के बाद एक्सेस अपने-आप खुल जाएगा ✓</p>

            <button onClick={signOut} className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-2">
              ← दूसरे अकाउंट से लॉगिन करें
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipGatePage;
