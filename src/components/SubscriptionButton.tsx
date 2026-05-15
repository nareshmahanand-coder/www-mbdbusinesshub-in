import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";

interface Props {
  plan_id?: string;
  link?: string;
  membership_type: string;
  plan_type: string;
  buttonText: string;
}

export const SubscriptionButton = ({ membership_type, plan_type, buttonText }: Props) => {
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

      await startInstantRazorpayPayment({
        module: membership_type as any,
        plan: plan_type as any,
        onSuccess: async () => {
          await supabase.from("user_profiles").upsert(
            {
              user_id: auth.user!.id,
              membership_status: "active",
              membership_type,
              plan_type,
            },
            { onConflict: "user_id" },
          );
          toast.success("Subscription active!");
          window.location.href = "/dashboard";
        },
        onFailure: () => {
          toast.error("Payment was not completed");
          setLoading(false);
        },
      });
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