import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { useUserMembershipProfile } from "@/hooks/useUserMembershipProfile";
import {
  startBharatGauravPaymentLink,
  startMarriageBureauPaymentLink,
  startMerchantPortalPaymentLink,
} from "@/lib/razorpayPayments";

export type MembershipType = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
export type PlanType = "monthly" | "yearly";

interface Props {
  membership_type: MembershipType;
  plan_type: PlanType;
  buttonText: string;
  className?: string;
  redirectTo?: string;
  /** When false, the component renders only the button and skips the active-state card. */
  showActiveState?: boolean;
}

const STARTERS = {
  bharat_gaurav: startBharatGauravPaymentLink,
  marriage_bureau: startMarriageBureauPaymentLink,
  merchant_premium: startMerchantPortalPaymentLink,
} as const;

/**
 * Clean, strictly per-user SubscriptionButton.
 * - Reads `user_profiles` for the logged-in user only.
 * - If membership is active → renders an "Active" card and hides payment.
 * - If inactive → renders a single payment button that opens the Razorpay link
 *   and on success upserts `user_profiles.membership_status = 'active'`.
 */
export const SubscriptionButton = ({
  membership_type,
  plan_type,
  buttonText,
  className,
  redirectTo = "/",
  showActiveState = false,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const { isActive, loading: profileLoading, refresh } = useUserMembershipProfile();

  if (profileLoading) return null;

  if (isActive) {
    if (!showActiveState) return null;
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-center">
        <BadgeCheck className="mx-auto h-8 w-8 text-green-700" />
        <p className="mt-2 text-sm font-bold text-green-800">Your subscription is active</p>
      </div>
    );
  }

  const handleClick = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        toast.error("Please login first");
        setLoading(false);
        return;
      }

      await STARTERS[membership_type]({
        plan: plan_type,
        onSuccess: async () => {
          const days = plan_type === "yearly" ? 365 : 30;
          const periodEnd = new Date(Date.now() + days * 86400000).toISOString();
          await supabase.from("user_profiles").upsert(
            {
              user_id: user.id,
              membership_status: "active",
              membership_type,
              plan_type,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          await refresh();
          toast.success("Subscription activated!");
          window.location.href = redirectTo;
        },
        onFailure: () => {
          toast.error("Payment incomplete. Please try again.");
          setLoading(false);
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className={className ?? "w-full"}>
      {loading ? "Processing..." : buttonText}
    </Button>
  );
};

export default SubscriptionButton;