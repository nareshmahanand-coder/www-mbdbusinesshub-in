import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Crown, Sparkles, Download } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { downloadReceipt } from "@/lib/generateReceipt";

const UPI_ID = "Nmahanand1@ybl";
const UPI_BASE = `upi://pay?pa=${UPI_ID}&pn=MeraBharatDukaan&cu=INR`;

const MembershipGatePage = ({ onActivated }: { onActivated: () => void }) => {
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const planDetails = {
    monthly: { price: 1, label: "₹1", duration: "1 महीना", days: 30 },
    yearly: { price: 12, label: "₹12", duration: "1 साल", days: 365 },
  };

  const getUpiLink = (amount: number) => `${UPI_BASE}&am=${amount}`;

  const handleSubmit = async () => {
    if (!transactionId.trim()) { toast.error("कृपया Transaction ID दर्ज करें"); return; }
    if (!user) return;
    setSubmitting(true);

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + planDetails[plan].days);

    const receiptNumber = `MBD-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("memberships").insert({
      user_id: user.id,
      plan,
      amount: planDetails[plan].price,
      transaction_id: transactionId.trim(),
      status: "approved",
      starts_at: now.toISOString().split("T")[0],
      ends_at: endsAt.toISOString().split("T")[0],
    });

    if (error) { toast.error("Submission failed. Please try again."); setSubmitting(false); return; }

    const rData = {
      userName: user.user_metadata?.display_name || user.email || "User",
      userEmail: user.email || "",
      plan,
      amount: planDetails[plan].price,
      transactionId: transactionId.trim(),
      startsAt: now.toISOString().split("T")[0],
      endsAt: endsAt.toISOString().split("T")[0],
      receiptNumber,
    };

    // Auto-download receipt
    try {
      downloadReceipt(rData);
      toast.success("Receipt downloaded successfully! 🧾");
    } catch {
      toast.error("Receipt generation failed, but payment is recorded.");
    }

    setReceiptData(rData);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-saffron/10 via-background to-green-india/10 px-4">
        <Card className="w-full max-w-md border-2 border-accent shadow-2xl text-center">
          <CardContent className="py-10 space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-india/20">
              <CheckCircle2 className="h-12 w-12 text-green-india" />
            </div>
            <h2 className="font-hindi text-2xl font-extrabold text-foreground">बधाई हो! 🎉</h2>
            <p className="font-hindi text-base text-foreground leading-relaxed">
              आपकी <span className="font-bold text-accent">'भारत गौरव मेंबरशिप'</span> एक्टिव हो गई है।
              <br />अब आप ऐप की सभी सुविधाओं का लाभ ले सकते हैं।
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-india/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-green-india" />
              <span className="text-sm font-semibold text-green-india">Membership Active ✓</span>
            </div>
            <Button onClick={onActivated} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5">
              <Crown className="mr-2 h-5 w-5" /> ऐप में प्रवेश करें
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
                <p className="text-2xl font-extrabold text-foreground">₹1</p>
                <p className="text-xs text-muted-foreground font-hindi">मासिक / Monthly</p>
              </button>
              <button onClick={() => setPlan("yearly")}
                className={`rounded-xl border-2 p-4 text-center transition-all relative ${plan === "yearly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <span className="absolute -top-2 right-2 rounded-full bg-green-india px-2 py-0.5 text-[9px] font-bold text-primary-foreground">BEST VALUE</span>
                <p className="text-2xl font-extrabold text-foreground">₹12</p>
                <p className="text-xs text-muted-foreground font-hindi">वार्षिक / Yearly</p>
              </button>
            </div>

            {/* UPI Direct Pay Buttons */}
            <div className="space-y-2">
              <a href={getUpiLink(planDetails[plan].price)} className="block">
                <Button className="w-full bg-[hsl(265,80%,45%)] hover:bg-[hsl(265,80%,40%)] text-primary-foreground font-bold text-lg py-6 gap-2 shadow-lg">
                  📱 Pay {planDetails[plan].label} via UPI
                </Button>
              </a>
              <div className="flex gap-2">
                <a href={getUpiLink(planDetails[plan].price)} className="flex-1">
                  <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold gap-1">
                    PhonePe
                  </Button>
                </a>
                <a href={getUpiLink(planDetails[plan].price)} className="flex-1">
                  <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold gap-1">
                    GPay
                  </Button>
                </a>
                <a href={getUpiLink(planDetails[plan].price)} className="flex-1">
                  <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold gap-1">
                    Paytm
                  </Button>
                </a>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">UPI ID: <span className="font-mono font-bold text-foreground">{UPI_ID}</span></p>
            </div>

            {/* Transaction ID Only */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground font-hindi">Transaction ID / UTR Number *</label>
              <Input placeholder="e.g. 412345678901" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !transactionId.trim()}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-6 gap-2 shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}
              Submit & Activate Membership
            </Button>
            <p className="text-center text-[10px] text-muted-foreground font-hindi">Transaction ID डालते ही मेंबरशिप तुरंत एक्टिव हो जाएगी ✓</p>

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
