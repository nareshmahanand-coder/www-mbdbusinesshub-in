import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, CheckCircle2 } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";

const RAZORPAY_LINKS = {
  monthly: "https://rzp.io/rzp/HcZ53Lpl",
  yearly: "https://rzp.io/rzp/0WkIfbVd",
};

interface MembershipOverlayProps {
  onActivated: () => void;
}

const MembershipOverlay = ({ onActivated }: MembershipOverlayProps) => {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState<"monthly" | "yearly" | null>(null);
  const [paymentOpened, setPaymentOpened] = useState(false);

  const handlePay = (plan: "monthly" | "yearly") => {
    window.open(RAZORPAY_LINKS[plan], "_blank", "noopener,noreferrer");
    setPaymentOpened(true);
  };

  const activateMembership = async (plan: "monthly" | "yearly") => {
    if (!user) return;
    setVerifying(plan);

    const days = plan === "monthly" ? 30 : 365;
    const amount = plan === "monthly" ? 1 : 12;
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + days);

    const { error } = await supabase.from("memberships").insert({
      user_id: user.id,
      plan,
      amount,
      status: "approved",
      starts_at: now.toISOString().split("T")[0],
      ends_at: endsAt.toISOString().split("T")[0],
    });

    setVerifying(null);

    if (error) {
      toast.error("कुछ गड़बड़ हुई। दोबारा कोशिश करें।");
      return;
    }

    toast.success("🎉 भारत गौरव मेंबरशिप एक्टिव!");
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

          {/* Monthly Plan Button */}
          <div className="space-y-2">
            <Button
              onClick={() => handlePay("monthly")}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi"
              style={{ backgroundColor: "#FF9933" }}
            >
              मंथली प्लान - ₹1 (ऑटो-डेबिट)
            </Button>
            {paymentOpened && (
              <Button
                onClick={() => activateMembership("monthly")}
                disabled={verifying !== null}
                variant="outline"
                className="w-full h-10 text-xs font-bold border-2 border-[#FF9933] text-[#FF9933] font-hindi"
              >
                {verifying === "monthly" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    मैंने ₹1 का पेमेंट कर दिया - अनलॉक करें
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Yearly Plan Button */}
          <div className="space-y-2">
            <Button
              onClick={() => handlePay("yearly")}
              className="w-full h-14 text-base font-extrabold text-white shadow-lg rounded-xl font-hindi relative"
              style={{ backgroundColor: "#138808" }}
            >
              <span className="absolute -top-2 right-3 rounded-full bg-[#1a237e] px-2 py-0.5 text-[9px] font-bold text-white">
                BEST VALUE
              </span>
              सालाना प्लान - ₹12 (ऑटो-डेबिट)
            </Button>
            {paymentOpened && (
              <Button
                onClick={() => activateMembership("yearly")}
                disabled={verifying !== null}
                variant="outline"
                className="w-full h-10 text-xs font-bold border-2 border-[#138808] text-[#138808] font-hindi"
              >
                {verifying === "yearly" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    मैंने ₹12 का पेमेंट कर दिया - अनलॉक करें
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground font-hindi pt-1">
            पेमेंट के बाद नीचे दिए "अनलॉक करें" बटन पर टैप करें ✓
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipOverlay;
