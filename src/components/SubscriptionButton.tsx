import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  plan_id: string;
  membership_type: string;
  plan_type: string;
  buttonText: string;
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export const SubscriptionButton = ({ plan_id, membership_type, plan_type, buttonText }: Props) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("user_profiles")
        .select("membership_status")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data?.membership_status === "active") setIsActive(true);
      setChecking(false);
    })();
  }, []);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Please login first");
        setLoading(false);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Could not load Razorpay. Check your internet.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_id },
      });
      if (error || !data?.subscriptionId) {
        toast.error(data?.error || error?.message || "Could not create subscription");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Mera Bharat Dukaan",
        description: `${membership_type} ${plan_type} subscription`,
        prefill: {
          email: auth.user.email || "",
          contact: auth.user.phone || "",
        },
        theme: { color: "#1a237e" },
        handler: async (resp: any) => {
          await supabase.from("user_profiles").upsert(
            {
              user_id: auth.user!.id,
              membership_status: "active",
              membership_type,
              plan_type,
              razorpay_subscription_id: resp.razorpay_subscription_id || data.subscriptionId,
              razorpay_payment_id: resp.razorpay_payment_id,
            },
            { onConflict: "user_id" },
          );
          toast.success("Subscription active!");
          window.location.href = "/dashboard";
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment was not completed");
          },
        },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (checking) return null;

  if (isActive) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-6 text-center">
        <p className="text-base font-bold text-green-700">Your subscription is active</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-2xl bg-orange-600 py-4 font-semibold text-white transition-all hover:bg-orange-700 disabled:opacity-60"
    >
      {loading ? "Processing..." : buttonText}
    </button>
  );
};

export default SubscriptionButton;
