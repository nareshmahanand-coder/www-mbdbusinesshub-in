import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface Props {
  plan_id: string;
  membership_type: "bharat_gaurav" | "merchant_premium" | "marriage_bureau";
  plan_type: "monthly" | "yearly";
  buttonText: string;
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const SubscriptionButton = ({ plan_id, membership_type, plan_type, buttonText }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Razorpay SDK failed to load");

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Please login first");

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_id, membership_type, plan_type },
      });
      if (error || !data?.subscription_id) throw new Error(error?.message || "Could not create subscription");

      const rzp = new window.Razorpay!({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Bharat Gaurav Membership",
        description: `${membership_type} - ${plan_type} (Auto-Debit)`,
        prefill: { email: user.email, contact: user.phone },
        theme: { color: "#1a237e" },
        handler: () => {
          window.location.href = "/success";
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full">
      {loading ? "Processing..." : buttonText}
    </Button>
  );
};

export default SubscriptionButton;