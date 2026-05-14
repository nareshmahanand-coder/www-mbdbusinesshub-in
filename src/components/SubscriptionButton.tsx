import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MembershipType = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
export type PlanType = "monthly" | "yearly";

interface Props {
  plan_id: string;
  membership_type: MembershipType;
  plan_type: PlanType;
  buttonText: string;
  className?: string;
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const SubscriptionButton = ({
  plan_id,
  membership_type,
  plan_type,
  buttonText,
  className,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const activateMembership = async (subscriptionId: string, paymentId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    // Update profile membership_status (best-effort)
    await supabase
      .from("profiles")
      .update({
        // @ts-expect-error – column added at app layer; ignored if absent
        membership_status: "active",
        // @ts-expect-error
        membership_type,
        // @ts-expect-error
        razorpay_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    // Module-specific records
    if (membership_type === "bharat_gaurav") {
      const days = plan_type === "yearly" ? 365 : 30;
      await supabase.from("bharat_gaurav_memberships").insert({
        user_id: user.id,
        plan: plan_type,
        amount: plan_type === "yearly" ? 100 : 10,
        currency: "INR",
        status: "active",
        razorpay_order_id: subscriptionId,
        razorpay_payment_id: paymentId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + days * 86400000).toISOString(),
      });
    }
  };

  const handleClick = async () => {
    try {
      setLoading(true);

      const sdkReady = await loadRazorpay();
      if (!sdkReady) throw new Error("Razorpay SDK failed to load");

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Please login to continue");
      const user = userData.user;

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_id, membership_type, plan_type },
      });

      if (error) throw new Error(error.message || "Could not start subscription");
      if (!data?.subscription_id || !data?.key_id) {
        throw new Error(data?.error || "Invalid subscription response");
      }

      const Razorpay = (window as any).Razorpay;
      const rzp = new Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Mera Bharat Dukaan",
        description: `${membership_type.replace("_", " ")} – ${plan_type} (Auto-Debit)`,
        prefill: { email: user.email ?? "", contact: user.phone ?? "" },
        theme: { color: "#1a237e" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
        }) => {
          try {
            await activateMembership(
              response.razorpay_subscription_id,
              response.razorpay_payment_id,
            );
            toast.success("Subscription activated!");
            window.location.href = "/success";
          } catch (e) {
            toast.error("Payment received but activation failed. Please refresh.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.open();
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
