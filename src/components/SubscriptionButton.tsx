import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface Props {
  link: string;
  membership_type: string;
  plan_type: string;
  buttonText: string;
}

export const SubscriptionButton = ({ link, membership_type, plan_type, buttonText }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Open Razorpay payment link
      window.location.href = link;

      // After payment (user will return), update database
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          membership_type,
          plan_type,
          membership_status: 'active',
          current_period_end: new Date(Date.now() + (plan_type === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });
        toast.success("Payment Successful! Redirecting to Dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full py-4 rounded-2xl font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all"
    >
      {loading ? "Processing..." : buttonText}
    </button>
  );
};

export const SubscriptionActiveCard = () => {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="rounded-2xl border-2 border-green-500 bg-green-50 p-4 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
      <p className="mt-2 text-base font-extrabold text-green-800">Your subscription is active</p>
      <p className="text-sm text-green-700 font-hindi">आपकी सदस्यता सक्रिय है — Redirecting to Dashboard...</p>
    </div>
  );
};

export default SubscriptionButton;
