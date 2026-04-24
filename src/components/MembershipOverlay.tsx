import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";

const RAZORPAY_LINKS = {
  monthly: "https://rzp.io/rzp/HcZ53Lpl",
  yearly: "https://rzp.io/rzp/0WkIfbVd",
};

interface MembershipOverlayProps {
  onActivated: () => void;
}

// Razorpay Payment IDs always start with `pay_` followed by 14 alphanumerics.
// Users get this ID only after a SUCCESSFUL transaction (visible on the
// success screen + the email/SMS receipt sent by Razorpay).
const RAZORPAY_PAYMENT_ID_REGEX = /^pay_[A-Za-z0-9]{14}$/;

const MembershipOverlay = ({ onActivated }: MembershipOverlayProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<"monthly" | "yearly" | null>(null);
  const [openedPlan, setOpenedPlan] = useState<"monthly" | "yearly" | null>(null);
  const [paymentId, setPaymentId] = useState("");

  const handlePay = (plan: "monthly" | "yearly") => {
    window.open(RAZORPAY_LINKS[plan], "_blank", "noopener,noreferrer");
    setOpenedPlan(plan);
    setPaymentId("");
  };

  const submitForVerification = async (plan: "monthly" | "yearly") => {
    if (!user) {
      toast.error("कृपया पहले लॉगिन करें / Please login first");
      return;
    }

    const trimmed = paymentId.trim();
    if (!RAZORPAY_PAYMENT_ID_REGEX.test(trimmed)) {
      toast.error(
        "Please complete your payment to unlock this feature. Enter a valid Razorpay Payment ID (pay_XXXXXXXXXXXXXX).",
      );
      return;
    }

    setSubmitting(plan);

    // Block duplicate use of the same payment ID across users
    const { data: existing, error: lookupError } = await supabase
      .from("memberships")
      .select("id, user_id, status")
      .eq("transaction_id", trimmed)
      .limit(1);

    if (lookupError) {
      setSubmitting(null);
      toast.error("Verification failed. Please try again.");
      return;
    }

    if (existing && existing.length > 0) {
      setSubmitting(null);
      toast.error("This Payment ID has already been used.");
      return;
    }

    const days = plan === "monthly" ? 30 : 365;
    const amount = plan === "monthly" ? 1 : 12;
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + days);

    // IMPORTANT: status is `pending` — admin must verify the Payment ID
    // against the Razorpay dashboard before access is granted.
    const { error } = await supabase.from("memberships").insert({
      user_id: user.id,
      plan,
      amount,
      status: "pending",
      transaction_id: trimmed,
      starts_at: now.toISOString().split("T")[0],
      ends_at: endsAt.toISOString().split("T")[0],
    });

    setSubmitting(null);

    if (error) {
      toast.error("कुछ गड़बड़ हुई। दोबारा कोशिश करें।");
      return;
    }

    toast.success(
      "Payment ID received. Verification in progress — access will unlock once approved.",
      { duration: 6000 },
    );
    onActivated();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto py-6 px-4">
      {/* Heavy blur backdrop — non-dismissible */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

      <Card
        className="relative z-10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden border-0"
        style={{
          borderTop: "6px solid #FF9933",
          borderBottom: "6px solid #138808",
          borderLeft: "2px solid #FF9933",
          borderRight: "2px solid #138808",
        }}
      >
        <CardHeader className="text-center space-y-2 pb-3 bg-white">
          <img
            src={logoCircle}
            alt="Mera Bharat Dukaan"
            className="mx-auto h-16 w-16 rounded-full object-cover shadow-lg ring-4 ring-[#FF9933]/40"
          />
          <CardTitle className="text-xl font-extrabold text-[#1a237e] flex items-center justify-center gap-2 font-hindi">
            <Crown className="h-6 w-6 text-[#FF9933]" />
            भारत गौरव मेंबरशिप
          </CardTitle>
          <p className="text-[11px] text-muted-foreground font-semibold tracking-wide">
            🇮🇳 DIGITAL INDIA INITIATIVE 🇮🇳
          </p>
        </CardHeader>

        <CardContent className="space-y-4 bg-white pt-4">
          {/* Importance text */}
          <div className="rounded-xl bg-gradient-to-br from-[#FF9933]/10 via-white to-[#138808]/10 border-2 border-[#1a237e]/20 p-4">
            <p className="font-bold text-sm text-[#1a237e] mb-2 font-hindi">
              भारत गौरव मेंबरशिप क्यों जरूरी है?
            </p>
            <p className="font-hindi text-[13px] leading-relaxed text-foreground">
              यह <span className="font-bold text-[#FF9933]">डिजिटल इंडिया पहल</span> का एक हिस्सा है। यह मेंबरशिप आपको{" "}
              <span className="font-bold text-[#1a237e]">'मेरा भारत दुकान'</span> की सभी प्रीमियम सेवाओं, सुरक्षित व्यापारिक लेनदेन और भविष्य की{" "}
              <span className="font-bold text-[#138808]">सरकारी योजनाओं</span> का सीधा लाभ उठाने के लिए अधिकृत (Authorize) करती है। ऐप को अनलॉक करने के लिए कृपया अपनी सदस्यता चुनें।
            </p>
          </div>

          {/* Monthly Plan */}
          <div className="space-y-2">
            <Button
              onClick={() => handlePay("monthly")}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi"
              style={{ backgroundColor: "#FF9933" }}
            >
              मंथली प्लान - ₹1 / Month (ऑटो-डेबिट)
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className="space-y-2">
            <Button
              onClick={() => handlePay("yearly")}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi relative"
              style={{ backgroundColor: "#138808" }}
            >
              <span className="absolute -top-2 right-3 rounded-full bg-[#1a237e] px-2 py-0.5 text-[9px] font-bold text-white">
                BEST VALUE
              </span>
              सालाना प्लान - ₹12 / Year (ऑटो-डेबिट)
            </Button>
          </div>

          {/* Payment verification form — appears ONLY after user opens a payment link */}
          {openedPlan && (
            <div className="rounded-xl border-2 border-[#1a237e]/30 bg-[#1a237e]/5 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-[#1a237e]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-[12px] font-bold">
                  Step 2 — Verify Payment / पेमेंट सत्यापित करें
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                After successful payment, Razorpay shows a <b>Payment ID</b> like{" "}
                <code className="bg-white px-1 rounded text-[10px]">pay_NXXXXXXXXXXXXX</code>.
                Paste it below. Access unlocks only after verification.
              </p>
              <Input
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="pay_XXXXXXXXXXXXXX"
                className="h-10 text-sm font-mono tracking-tight"
                maxLength={32}
                autoComplete="off"
              />
              <Button
                onClick={() => submitForVerification(openedPlan)}
                disabled={submitting !== null || paymentId.trim().length === 0}
                className="w-full h-11 text-sm font-bold bg-[#1a237e] hover:bg-[#0f1a5e] text-white rounded-lg"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Submit Payment ID for Verification
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10.5px] text-muted-foreground leading-snug">
              All premium features stay locked until your payment is verified by our team.
              <span className="font-hindi"> भुगतान सत्यापित होने तक सभी प्रीमियम सुविधाएँ लॉक रहेंगी।</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipOverlay;
