import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, Lock } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";

interface MembershipOverlayProps {
  onActivated: () => void;
}

const MembershipOverlay = ({ onActivated }: MembershipOverlayProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<"monthly" | "yearly" | null>(null);
  const [paymentFailed, setPaymentFailed] = useState<"monthly" | "yearly" | null>(null);

  const handlePay = async (plan: "monthly" | "yearly") => {
    if (!user) {
      toast.error("कृपया पहले लॉगिन करें / Please login first");
      return;
    }

    setSubmitting(plan);
    setPaymentFailed(null);

    try {
      await startInstantRazorpayPayment({
        module: "bharat_gaurav",
        plan,
        onSuccess: () => {
          toast.success("Payment successful — access unlocked!");
          onActivated();
          window.location.reload();
        },
        onFailure: () => setPaymentFailed(plan),
      });
    } catch (error) {
      setPaymentFailed(plan);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please retry.");
    } finally {
      setSubmitting(null);
    }
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
              onClick={() => handlePay("monthly")} disabled={submitting !== null}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi"
              style={{ backgroundColor: "#FF9933" }}
            >
              {submitting === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "मंथली प्लान - ₹1 / Month (ऑटो-डेबिट)"}
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className="space-y-2">
            <Button
              onClick={() => handlePay("yearly")} disabled={submitting !== null}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi relative"
              style={{ backgroundColor: "#138808" }}
            >
              <span className="absolute -top-2 right-3 rounded-full bg-[#1a237e] px-2 py-0.5 text-[9px] font-bold text-white">
                BEST VALUE
              </span>
              {submitting === "yearly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "सालाना प्लान - ₹12 / Year (ऑटो-डेबिट)"}
            </Button>
          </div>

          {paymentFailed && (
            <Button
              onClick={() => handlePay(paymentFailed)}
              disabled={submitting !== null}
              variant="outline"
              className="w-full h-11 text-sm font-bold border-[#1a237e] text-[#1a237e] rounded-lg"
            >
              Retry Payment
            </Button>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10.5px] text-muted-foreground leading-snug">
              Payment unlock is automatic after Razorpay confirms success.
              <span className="font-hindi"> सफल पेमेंट के बाद एक्सेस तुरंत खुल जाएगा।</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipOverlay;
