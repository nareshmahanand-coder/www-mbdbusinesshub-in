import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  paymentUrl: string;
  plan: "monthly" | "yearly";
  buttonText: string;
  buttonClassName?: string;
}

export const MatrimonyPremiumLinkButton = ({ paymentUrl, plan, buttonText, buttonClassName }: Props) => {
  const [checking, setChecking] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [opened, setOpened] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("matrimony_profiles")
        .select("subscription_plan, subscription_end")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data?.subscription_plan && (!data.subscription_end || new Date(data.subscription_end) > new Date())) {
        setIsActive(true);
      }
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const t = window.setTimeout(() => {
      window.location.href = "/";
    }, 1200);
    return () => window.clearTimeout(t);
  }, [isActive]);

  const handleOpen = () => {
    window.open(paymentUrl, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please login first");
      setConfirming(false);
      return;
    }
    const now = new Date();
    const ends = new Date(now);
    if (plan === "yearly") ends.setFullYear(ends.getFullYear() + 1);
    else ends.setMonth(ends.getMonth() + 1);

    const { error } = await supabase
      .from("matrimony_profiles")
      .update({
        subscription_plan: plan,
        subscription_start: now.toISOString().slice(0, 10),
        subscription_end: ends.toISOString().slice(0, 10),
        is_published: true,
      })
      .eq("user_id", auth.user.id);

    if (error) {
      toast.error(error.message || "Could not activate subscription");
      setConfirming(false);
      return;
    }
    setIsActive(true);
    toast.success("Your subscription is active");
  };

  if (checking) return null;

  if (isActive) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-6 text-center">
        <p className="text-base font-bold text-green-700">Your subscription is active</p>
      </div>
    );
  }

  if (opened) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full rounded-2xl bg-green-600 py-4 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-60"
        >
          {confirming ? "Activating..." : "I've completed payment — Activate"}
        </button>
        <button
          onClick={handleOpen}
          className="w-full rounded-2xl border border-orange-300 bg-white py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
        >
          Reopen payment page
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      className={buttonClassName ?? "w-full rounded-2xl bg-orange-600 py-4 font-semibold text-white transition-all hover:bg-orange-700"}
    >
      {buttonText}
    </button>
  );
};

export default MatrimonyPremiumLinkButton;
