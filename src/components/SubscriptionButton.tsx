import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  plan_id?: string;
  link?: string;
  membership_type: string;
  plan_type: string;
  buttonText: string;
}

const RAZORPAY_KEY_ID = "rzp_live_RKpFEtBTCi8FxK";

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const SubscriptionButton = ({ plan_id, link, membership_type, plan_type, buttonText }: Props) => {
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
        .single();
      if (data?.membership_status === "active") setIsActive(true);
      setChecking(false);
    })();
  }, []);

  const handleClick = async () => {
    setLoading(true);
    if (link) {
      window.location.href = link;
      return;
    }
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Please login first");
        setLoading(false);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error("Failed to load Razorpay");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { plan_id, membership_type, plan_type },
      });
      if (error || !data?.subscription_id) {
        toast.error(error?.message || "Could not start subscription");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name: "Mera Bharat Dukaan",
        description: `${membership_type} • ${plan_type}`,
        prefill: { email: auth.user.email || "", contact: auth.user.phone || "" },
        theme: { color: "#1a237e" },
        handler: async (response: any) => {
          await supabase
            .from("user_profiles")
            .upsert(
              {
                user_id: auth.user!.id,
                membership_status: "active",
                membership_type,
                plan_type,
                razorpay_subscription_id: response.razorpay_subscription_id || data.subscription_id,
                razorpay_payment_id: response.razorpay_payment_id || null,
              },
              { onConflict: "user_id" },
            );
          toast.success("Subscription active!");
          window.location.href = "/dashboard";
        },
        modal: {
          ondismiss: () => setLoading(false),
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
      setTimeout(() => { window.location.href = "/dashboard"; }, 0);
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