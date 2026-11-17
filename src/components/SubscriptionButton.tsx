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

const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
  if ((window as any).Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = RAZORPAY_SCRIPT;
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export const SubscriptionButton = ({ plan_id, membership_type, plan_type, buttonText }: Props) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setIsActive(false);
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { if (!cancelled) setChecking(false); return; }
      const { data } = await supabase.from("bharat_gaurav_memberships")
        .select("expires_at")
        .eq("user_id", auth.user.id).eq("status", "active")
        .gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle();
      if (!cancelled) {
        setIsActive(Boolean(data?.expires_at));
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [membership_type]);

  useEffect(() => {
    if (!isActive) return;
    const timer = window.setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
    return () => window.clearTimeout(timer);
  }, [isActive]);

  const handleClick = async () => {
    setLoading(true);
    let paymentOrderId = "";
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please login first");
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load Razorpay. Check your internet.");
      const { data, error } = await supabase.functions.invoke("create-subscription", { body: { plan_id } });
      if (error || !data?.subscriptionId || !data?.paymentOrderId) throw new Error(data?.error || error?.message || "Could not create subscription");
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) throw new Error("Razorpay checkout is unavailable");
      let completed = false;
      paymentOrderId = data.paymentOrderId;
      const onVerifiedPayment = async (response: any) => {
        if (completed) return;
        completed = true;
        const result = await supabase.functions.invoke("verify-razorpay-payment", { body: {
          payment_order_id: paymentOrderId,
          subscription_id: data.subscriptionId,
          razorpay_payment_id: response?.razorpay_payment_id,
          razorpay_signature: response?.razorpay_signature,
        } });
        if (result.error || !result.data?.ok) {
          completed = false;
          setLoading(false);
          toast.error(result.data?.error || result.error?.message || "Payment is being verified. Please refresh shortly.");
          return;
        }
        setIsActive(true);
        setLoading(false);
        toast.success("Your payment is confirmed and membership is active");
      };
      const checkout = new RazorpayConstructor({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Mera Bharat Dukaan",
        description: `${membership_type} ${plan_type} subscription`,
        prefill: { email: auth.user.email || "", contact: auth.user.phone || "" },
        theme: { color: "#1a237e" },
        retry: { enabled: false },
        handler: onVerifiedPayment,
        modal: { ondismiss: () => { if (!completed) setLoading(false); } },
      });
      checkout.on("payment.failed", (response: any) => {
        if (completed) return;
        completed = true;
        void supabase.functions.invoke("record-payment-failure", { body: {
          payment_order_id: paymentOrderId,
          razorpay_payment_id: response?.error?.metadata?.payment_id,
          reason: response?.error?.description,
        } });
        setLoading(false);
        toast.error("Payment failed; membership remains inactive");
      });
      checkout.open();
    } catch (error) {
      if (paymentOrderId) void supabase.functions.invoke("record-payment-failure", { body: { payment_order_id: paymentOrderId, reason: "Subscription checkout could not be opened" } });
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (checking) return null;
  if (isActive) return <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-6 text-center"><p className="text-base font-bold text-green-700">Your subscription is active</p></div>;
  return <button onClick={handleClick} disabled={loading} className="w-full rounded-2xl bg-orange-600 py-4 font-semibold text-white transition-all hover:bg-orange-700 disabled:opacity-60">{loading ? "Processing..." : buttonText}</button>;
};

export default SubscriptionButton;