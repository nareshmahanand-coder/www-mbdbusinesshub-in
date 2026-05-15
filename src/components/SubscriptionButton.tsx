import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startBharatGauravPaymentLink, startMarriageBureauPaymentLink, startMerchantPortalPaymentLink } from "@/lib/razorpayPayments";

export type MembershipType = "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
export type PlanType = "monthly" | "yearly";

interface Props {
  plan_id?: string;
  membership_type: MembershipType;
  plan_type: PlanType;
  buttonText: string;
  className?: string;
  /** When true, opens the hosted Razorpay payment link flow instead of subscription checkout. */
  usePaymentLink?: boolean;
  /** Where to redirect after successful activation. Defaults to /success. */
  redirectTo?: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature?: string;
}

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PLAN_AMOUNTS: Record<MembershipType, Record<PlanType, number>> = {
  bharat_gaurav: { monthly: 10, yearly: 100 },
  merchant_premium: { monthly: 99, yearly: 999 },
  marriage_bureau: { monthly: 99, yearly: 999 },
};

export const SubscriptionButton = ({
  plan_id,
  membership_type,
  plan_type,
  buttonText,
  className,
  usePaymentLink,
  redirectTo = "/success",
}: Props) => {
  const [loading, setLoading] = useState(false);

  const activateMembership = async (
    userId: string,
    subscriptionId: string,
    paymentId: string,
  ) => {
    // STRICT per-user upsert into unified user_profiles table.
    const days = plan_type === "yearly" ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        membership_status: "active",
        membership_type,
        plan_type,
        current_period_end: periodEnd,
        razorpay_subscription_id: subscriptionId || null,
        razorpay_payment_id: paymentId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // Bharat Gaurav specific record
    if (membership_type === "bharat_gaurav") {
      const days = plan_type === "yearly" ? 365 : 30;
      await supabase.from("bharat_gaurav_memberships").insert({
        user_id: userId,
        plan: plan_type,
        amount: PLAN_AMOUNTS.bharat_gaurav[plan_type],
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

      if (usePaymentLink) {
        const starter =
          membership_type === "bharat_gaurav"
            ? startBharatGauravPaymentLink
            : membership_type === "marriage_bureau"
              ? startMarriageBureauPaymentLink
              : startMerchantPortalPaymentLink;

        await starter({
          plan: plan_type,
          onSuccess: async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              await activateMembership(userData.user.id, "", "");
            }
            toast.success("मेंबरशिप सक्रिय हो गई!");
            window.location.href = redirectTo;
          },
          onFailure: () => {
            toast.error("भुगतान अधूरा है। कृपया दोबारा प्रयास करें।");
            setLoading(false);
          },
        });
        return;
      }

      if (!plan_id) throw new Error("plan_id required for subscription mode");
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

      const RazorpayCtor = (window as unknown as {
        Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
      }).Razorpay;

      const rzp = new RazorpayCtor({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Mera Bharat Dukaan",
        description: `${membership_type.replace("_", " ")} – ${plan_type} (Auto-Debit)`,
        prefill: { email: user.email ?? "", contact: user.phone ?? "" },
        theme: { color: "#1a237e" },
        handler: async (response: RazorpayResponse) => {
          try {
            await activateMembership(
              user.id,
              response.razorpay_subscription_id,
              response.razorpay_payment_id,
            );
            toast.success("Subscription activated! Auto-Debit enabled.");
            window.location.href = redirectTo;
          } catch {
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
