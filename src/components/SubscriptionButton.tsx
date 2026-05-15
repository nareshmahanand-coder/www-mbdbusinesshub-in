import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMembershipProfile } from "@/hooks/useUserMembershipProfile";

interface Props {
  label: string;
  paymentLink: string;
  membershipType: string; // e.g. "bharat_gaurav" | "marriage_bureau" | "merchant_portal"
  planType: "monthly" | "yearly";
  className?: string;
}

export const SubscriptionButton = ({ label, paymentLink, membershipType, planType, className }: Props) => {
  const { user } = useAuth();
  const { refresh } = useUserMembershipProfile();
  const [opened, setOpened] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleOpen = () => {
    if (!user) { toast.error("कृपया पहले लॉगिन करें"); return; }
    window.open(paymentLink, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  const handleActivate = async () => {
    if (!user) { toast.error("कृपया पहले लॉगिन करें"); return; }
    setActivating(true);
    const periodEnd = new Date();
    if (planType === "yearly") periodEnd.setDate(periodEnd.getDate() + 365);
    else periodEnd.setDate(periodEnd.getDate() + 30);
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      membership_status: "active",
      membership_type: membershipType,
      plan_type: planType,
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setActivating(false);
    if (error) { toast.error("Activation failed: " + error.message); return; }
    toast.success("Subscription activated!");
    await refresh();
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Button onClick={handleOpen} className="w-full bg-[#FF8C00] hover:bg-[#e57d00] text-white font-bold py-3" size="lg">
        <ExternalLink className="h-4 w-4 mr-2" /> {label}
      </Button>
      {opened && (
        <Button onClick={handleActivate} disabled={activating} variant="outline" className="w-full border-green-600 text-green-700" size="sm">
          {activating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          भुगतान पूरा हुआ — Activate
        </Button>
      )}
    </div>
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