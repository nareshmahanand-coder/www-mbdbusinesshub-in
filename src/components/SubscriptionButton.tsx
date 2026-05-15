import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  label: string;
  planId: string;
  membershipType: "bharat_gaurav" | "marriage_bureau" | "merchant_portal";
  planType: "monthly" | "yearly";
  className?: string;
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const SubscriptionButton = ({ label, planId, membershipType, planType, className }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) { toast.error("कृपया पहले लॉगिन करें"); return; }
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error("Razorpay लोड नहीं हुआ"); setLoading(false); return; }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_id: planId, membership_type: membershipType, plan_type: planType },
      });
      if (error || !data?.subscriptionId) {
        toast.error(data?.error || error?.message || "Subscription start failed");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Mera Bharat Dukaan",
        description: label,
        prefill: { email: user.email ?? "", contact: (user.phone ?? "").replace(/^\+/, "") },
        theme: { color: "#1a237e" },
        handler: async () => {
          // Mark active immediately for snappy UX; webhook will reconcile authoritatively.
          const periodEnd = new Date();
          periodEnd.setDate(periodEnd.getDate() + (planType === "yearly" ? 365 : 30));
          await supabase.from("user_profiles").upsert({
            user_id: user.id,
            membership_status: "active",
            membership_type: membershipType,
            plan_type: planType,
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          toast.success("Subscription active!");
          navigate("/dashboard");
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}
      className={`w-full bg-[#FF8C00] hover:bg-[#e57d00] text-white font-bold py-3 ${className ?? ""}`} size="lg">
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
      {label}
    </Button>
  );
};

export const SubscriptionActiveCard = () => (
  <div className="rounded-2xl border-2 border-green-500 bg-green-50 p-4 text-center">
    <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
    <p className="mt-2 text-base font-extrabold text-green-800">Your subscription is active</p>
    <p className="text-sm text-green-700 font-hindi">आपकी सदस्यता सक्रिय है</p>
  </div>
);

export default SubscriptionButton;