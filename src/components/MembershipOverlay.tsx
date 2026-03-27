import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, Sparkles } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import upiQr from "@/assets/upi-qr.jpeg";

const UPI_ID = "Nmahanand1@ybl";
const UPI_BASE = `upi://pay?pa=${UPI_ID}&pn=MeraBharatDukaan&cu=INR`;

interface MembershipOverlayProps {
  onActivated: () => void;
}

const MembershipOverlay = ({ onActivated }: MembershipOverlayProps) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const planDetails = {
    monthly: { price: 1, label: "₹1", duration: "1 महीना", days: 30 },
    yearly: { price: 12, label: "₹12", duration: "1 साल", days: 365 },
  };

  const getUpiLink = (amount: number) => `${UPI_BASE}&am=${amount}`;

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("कृपया Transaction ID दर्ज करें");
      return;
    }
    if (!user) return;
    setSubmitting(true);

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + planDetails[plan].days);

    const { error } = await supabase.from("memberships").insert({
      user_id: user.id,
      plan,
      amount: planDetails[plan].price,
      transaction_id: transactionId.trim(),
      status: "approved",
      starts_at: now.toISOString().split("T")[0],
      ends_at: endsAt.toISOString().split("T")[0],
    });

    if (error) {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
      return;
    }

    toast.success("🎉 मेंबरशिप एक्टिव हो गई!");
    setSubmitting(false);
    onActivated();
  };

  const handleDirectPay = () => {
    // Auto-activate after clicking pay button
    setTimeout(() => {
      if (!transactionId.trim()) {
        toast.info("UPI ऐप खुल रहा है... पेमेंट के बाद Transaction ID डालें");
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      <Card className="relative z-10 mx-4 w-full max-w-md border-2 border-saffron/30 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center space-y-2 pb-2">
          <img
            src={logoCircle}
            alt="Mera Bharat Dukaan"
            className="mx-auto h-16 w-16 rounded-full object-cover shadow-lg border-4 border-saffron/40"
          />
          <CardTitle className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-accent" /> भारत गौरव मेंबरशिप
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bharat Gaurav Membership — Unlock all features
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-accent/10 border border-accent/20 p-3 text-center">
            <p className="font-hindi text-sm leading-relaxed text-foreground">
              ऐप की सभी सुविधाओं का लाभ लेने के लिए{" "}
              <span className="font-bold text-accent">भारत गौरव मेंबरशिप</span> लें।
              <br />
              पेमेंट करें और{" "}
              <span className="font-bold text-green-india">तुरंत एक्सेस पाएं!</span>
            </p>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlan("monthly")}
              className={`rounded-xl border-2 p-3 text-center transition-all ${
                plan === "monthly"
                  ? "border-accent bg-accent/10 shadow-md"
                  : "border-border bg-card hover:border-accent/50"
              }`}
            >
              <p className="text-2xl font-extrabold text-foreground">₹1</p>
              <p className="text-xs text-muted-foreground font-hindi">मासिक / Monthly</p>
            </button>
            <button
              onClick={() => setPlan("yearly")}
              className={`rounded-xl border-2 p-3 text-center transition-all relative ${
                plan === "yearly"
                  ? "border-accent bg-accent/10 shadow-md"
                  : "border-border bg-card hover:border-accent/50"
              }`}
            >
              <span className="absolute -top-2 right-2 rounded-full bg-green-india px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                BEST VALUE
              </span>
              <p className="text-2xl font-extrabold text-foreground">₹12</p>
              <p className="text-xs text-muted-foreground font-hindi">वार्षिक / Yearly</p>
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <img
              src={upiQr}
              alt="Scan QR to Pay"
              className="h-40 w-40 rounded-xl border-2 border-accent/30 shadow-md"
            />
          </div>

          {/* UPI Direct Pay Buttons */}
          <div className="space-y-2">
            <a
              href={getUpiLink(planDetails[plan].price)}
              onClick={handleDirectPay}
              className="block"
            >
              <Button className="w-full bg-[hsl(265,80%,45%)] hover:bg-[hsl(265,80%,40%)] text-primary-foreground font-bold text-base py-5 gap-2 shadow-lg">
                📱 Pay {planDetails[plan].label} via UPI
              </Button>
            </a>
            <div className="flex gap-2">
              <a href={getUpiLink(planDetails[plan].price)} onClick={handleDirectPay} className="flex-1">
                <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">
                  PhonePe
                </Button>
              </a>
              <a href={getUpiLink(planDetails[plan].price)} onClick={handleDirectPay} className="flex-1">
                <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">
                  GPay
                </Button>
              </a>
              <a href={getUpiLink(planDetails[plan].price)} onClick={handleDirectPay} className="flex-1">
                <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">
                  Paytm
                </Button>
              </a>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              UPI ID: <span className="font-mono font-bold text-foreground">{UPI_ID}</span>
            </p>
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground font-hindi">
              Transaction ID / UTR Number *
            </label>
            <Input
              placeholder="e.g. 412345678901"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !transactionId.trim()}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-5 gap-2 shadow-lg"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            Submit & Activate Membership
          </Button>
          <p className="text-center text-[10px] text-muted-foreground font-hindi">
            Transaction ID डालते ही मेंबरशिप तुरंत एक्टिव हो जाएगी ✓
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipOverlay;
