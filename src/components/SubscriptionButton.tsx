import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  link: string;
  membership_type: string;
  plan_type: string;
  buttonText: string;
}

export const SubscriptionButton = ({ link, membership_type, plan_type, buttonText }: Props) => {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('membership_status')
        .eq('user_id', user.user.id)
        .single();

      if (data?.membership_status === 'active') {
        setIsActive(true);
        window.location.href = "/dashboard";
      }
    };

    checkStatus();
  }, []);

  const handleClick = () => {
    setLoading(true);
    window.location.href = link;
  };

  if (isActive) {
    return <div className="text-center py-8 text-green-600">Your subscription is active. Redirecting...</div>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full py-4 rounded-2xl font-semibold text-white bg-orange-600 hover:bg-orange-700"
    >
      {loading ? "Processing..." : buttonText}
    </button>
  );
};

export const SubscriptionActiveCard = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
  return null;
};

export default SubscriptionButton;
