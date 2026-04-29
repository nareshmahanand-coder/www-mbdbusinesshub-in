import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, Lock } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { startBharatGauravPaymentLink } from "@/lib/razorpayPayments";

const MembershipGatePage = ({ onActivated }: { onActivated: () => void }) => {
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  const planDetails = {
    monthly: { label: "Bharat Gaurav Membership ₹1 Plan" },
    yearly: { label: "Bharat Gaurav Membership ₹12 Plan" },
  };

  const handlePayment = async () => {
    if (!user) return;
    setSubmitting(true);
    setPaymentFailed(false);

    try {
      await startBharatGauravPaymentLink({
        plan,
        onSuccess: () => {
          toast.success("Payment successful — membership unlocked!");
          onActivated();
          window.location.href = "/dashboard";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-saffron/10 via-background to-green-india/10">
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-green-india" />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-md border-2 border-saffron/30 shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-3 border-b border-primary/15 bg-primary/5">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="mx-auto h-20 w-20 rounded-full object-cover shadow-lg border-4 border-saffron/40" />
            <CardTitle className="text-lg sm:text-xl font-extrabold text-primary flex items-center justify-center gap-2 font-hindi leading-snug">
              <Crown className="h-5 w-5 text-accent shrink-0" /> भारत गौरव मेंबरशिप: भारत के हर नागरिक के लिए आवश्यक
            </CardTitle>
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wide text-primary">🇮🇳 DIGITAL INDIA INITIATIVE 🇮🇳</p>
              <div className="mx-auto inline-flex items-center justify-center rounded-md border border-primary/25 bg-background px-3 py-1.5 text-xs font-extrabold text-primary shadow-sm font-hindi">
                बैंक वेरिफिकेशन / खाता का वेरिफिकेशन
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/10 border-2 border-primary/25 p-4 shadow-sm">
              <h2 className="font-hindi text-sm font-extrabold text-primary mb-2">मानक नागरिक सदस्यता आवश्यकता</h2>
              <p className="font-hindi text-[13px] leading-relaxed text-foreground">
                यह <span className="font-bold text-accent">Digital India Initiative</span> का एक सुरक्षित सदस्यता चरण है। पोर्टल की सेवाएं सुरक्षित रहती हैं। आप मेरा भारत दुकान के डिजिटल व्यापार से नौकरी, शिक्षा सेवा, स्थानीय दुकान नेटवर्क और भरोसेमंद उपयोग कर सकते हैं।
              </p>
            </div>

            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPlan("monthly")}
                className={`rounded-lg border-2 p-4 text-center transition-all ${plan === "monthly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <p className="text-2xl font-extrabold text-foreground">₹1</p>
                <p className="text-xs font-bold text-accent font-hindi">भारत गौरव मेंबरशिप ₹1 प्लान</p>
              </button>
              <button onClick={() => setPlan("yearly")}
                className={`rounded-lg border-2 p-4 text-center transition-all relative ${plan === "yearly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <span className="absolute -top-2 right-2 rounded-full bg-green-india px-2 py-0.5 text-[9px] font-bold text-primary-foreground">BEST VALUE</span>
                <p className="text-2xl font-extrabold text-foreground">₹12</p>
                <p className="text-xs font-bold text-green-india font-hindi">भारत गौरव मेंबरशिप ₹12 प्लान</p>
              </button>
            </div>

            <Button onClick={handlePayment} disabled={submitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-6 gap-2 shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}
              {planDetails[plan].label}
            </Button>
            {paymentFailed && (
              <Button onClick={handlePayment} disabled={submitting} variant="outline" className="w-full font-bold">
                Retry Payment
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-[10.5px] leading-snug text-muted-foreground">
                Payment unlock is automatic after Razorpay confirms success.
                <span className="font-hindi"> सफल पेमेंट के बाद एक्सेस तुरंत खुल जाएगा।</span>
              </p>
            </div>

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
