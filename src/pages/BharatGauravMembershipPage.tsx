import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { syncLatestRazorpayPayment } from "@/lib/razorpayPayments";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Hand, Briefcase, GraduationCap, ShieldCheck, Wifi, Info, Landmark, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import SubscriptionButton from "@/components/SubscriptionButton";

const BENEFITS = [
  {
    icon: Hand,
    title: "ज़ीरो कमीशन व्यापार",
    desc: "अपने छोटे से व्यापार या दुकान का 'ज़ीरो कमीशन' पर फ्री रजिस्ट्रेशन (Free Registration) करें और सीधे ग्राहकों से जुड़ें।",
    highlight: true,
  },
  {
    icon: Briefcase,
    title: "सुनिश्चित रोज़गार (Jobs)",
    desc: "पोर्टल पर रजिस्ट्रेशन करने वाले हर सदस्य को उसकी योग्यता के अनुसार जॉब (Jobs) और रोज़गार के अवसर प्रदान किए जाएंगे।",
    highlight: true,
  },
  {
    icon: GraduationCap,
    title: "कौशल विकास",
    desc: "हर प्रकार की व्यावसायिक ट्रेनिंग और एनजीओ (NGO) द्वारा अधिकृत प्रमाण पत्र (Certificate) की सुविधा।",
    highlight: false,
  },
  {
    icon: ShieldCheck,
    title: "सुरक्षा चक्र",
    desc: "बेटी सुरक्षा, बाल सुरक्षा और पारिवारिक सुरक्षा का भरोसा।",
    highlight: false,
  },
  {
    icon: Wifi,
    title: "डिजिटल कनेक्टिविटी",
    desc: "नज़दीकी दुकान नेटवर्क से सीधा जुड़ाव और डिजिटल पहचान।",
    highlight: false,
  },
  {
    icon: Info,
    title: "अन्य सुविधाएं",
    desc: "पुराने सामान की खरीद-बिक्री, मैरिज ब्यूरो (जीवनसाथी), सरकारी लोन और सरकारी जॉब्स की सटीक जानकारी।",
    highlight: false,
  },
];

const BharatGauravMembershipPage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isMember, loading: memberLoading, refresh } = useBharatGauravMembership();
  const [payingPlan] = useState<"monthly" | "yearly" | null>(null);

  // Directly mark Bharat Gaurav membership active for the logged-in user
  // and hard-redirect to the dashboard. Used as the guaranteed unlock path
  // after a successful Razorpay subscription/auto-pay payment.
  const activateMembershipAndGo = async (
    plan: "monthly" | "yearly",
    refs?: { subscriptionId?: string; paymentId?: string; orderId?: string }
  ) => {
    if (!user) return;
    const now = new Date();
    const expires = new Date(now);
    if (plan === "yearly") expires.setDate(expires.getDate() + 365);
    else expires.setDate(expires.getDate() + 30);

    const { error } = await supabase.from("bharat_gaurav_memberships").insert({
      user_id: user.id,
      plan,
      amount: plan === "yearly" ? 100 : 10,
      currency: "INR",
      status: "active",
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      razorpay_order_id: refs?.orderId ?? refs?.subscriptionId ?? null,
      razorpay_payment_id: refs?.paymentId ?? null,
    });

    if (error) {
      console.error("Bharat Gaurav activation failed:", error);
      toast({
        title: "Activation failed",
        description: "Payment received but activation failed. Please refresh.",
        variant: "destructive",
      });
      return;
    }

    await refresh();
    toast({ title: "धन्यवाद!", description: "Auto-Debit सक्रिय। मेंबरशिप चालू हो गई है।" });
    window.location.href = "/dashboard";
  };

  useEffect(() => {
    if (!user || memberLoading || isMember || payingPlan) return;

    let cancelled = false;
    const syncPendingAutopay = async () => {
      const { data: order } = await supabase
        .from("payment_orders")
        .select("id, plan")
        .eq("user_id", user.id)
        .eq("module", "bharat_gaurav")
        .in("status", ["created", "pending", "failed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!order || cancelled) return;

      const synced = await syncLatestRazorpayPayment({
        module: "bharat_gaurav",
        plan: order.plan as "monthly" | "yearly",
        paymentOrderId: order.id,
      });

      if (cancelled || !synced.ok) return;
      await activateMembershipAndGo(order.plan as "monthly" | "yearly", { orderId: order.id });
    };

    syncPendingAutopay();
    return () => { cancelled = true; };
  }, [isMember, memberLoading, navigate, payingPlan, refresh, user]);

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/login");
  };

  if (memberLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isMember) {
    return (
      <div className="min-h-screen bg-white px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 font-hindi text-2xl font-bold text-blue-900">मेंबरशिप सक्रिय है</h1>
          <p className="mt-2 font-hindi text-muted-foreground">आपकी भारत गौरव मेंबरशिप पहले से ही सक्रिय है।</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-blue-900 hover:bg-blue-800">
            Open Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-3 py-4 font-hindi">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logoCircle} alt="मेरा भारत दुकान" className="h-20 w-20 rounded-full border-2 border-orange-300 object-cover shadow-sm" />
        </div>

        {/* Title */}
        <h1 className="mt-3 text-center text-2xl font-extrabold text-blue-900 sm:text-3xl">
          भारत गौरव मेंबरशिप
        </h1>
        <p className="mt-1 text-center text-sm text-slate-700">
          भारत के हर नागरिक के लिए आवश्यक है
        </p>

        {/* Badges */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="rounded-full bg-orange-400 px-3 py-1 text-[11px] font-bold tracking-wide text-white">
            DIGITAL INDIA
          </span>
          <Landmark className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">बैंक वेरिफिकेशन</span>
        </div>

        {/* Info box */}
        <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-center">
          <p className="text-sm font-bold text-blue-900">मानक नागरिक सदस्यता आवश्यक है</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
            पोर्टल की सेवाएं सुरक्षित रहती हैं। आप मेरा भारत दुकान के डिजिटल व्यापार से नौकरी, शिक्षा सेवा, स्थानीय दुकान नेटवर्क और भरोसेमंद उपयोग कर सकते हैं।
          </p>
        </div>

        {/* Section header */}
        <h2 className="mt-5 text-lg font-extrabold text-slate-900">नई मुख्य सुविधाएं</h2>

        {/* Benefits */}
        <div className="mt-2 space-y-2.5">
          {BENEFITS.map(({ icon: Icon, title, desc, highlight }) => (
            <div
              key={title}
              className={`flex gap-3 rounded-2xl border p-3 ${
                highlight ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  highlight ? "bg-orange-500 text-white" : "bg-indigo-100 text-indigo-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-700">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plans – sirf 2 buttons (direct Razorpay payment link) */}
        <div className="mt-5 space-y-3">
          <SubscriptionButton
            membership_type="bharat_gaurav"
            plan_type="monthly"
            usePaymentLink
            redirectTo="/dashboard"
            buttonText="भारत गौरव मेंबरशिप ₹10 प्लान"
            className="w-full rounded-full border-2 border-orange-600 bg-orange-500 px-4 py-3 text-base font-bold text-white shadow-md transition-colors hover:bg-orange-600 hover:border-orange-700 focus-visible:ring-2 focus-visible:ring-orange-300"
          />
          <SubscriptionButton
            membership_type="bharat_gaurav"
            plan_type="yearly"
            usePaymentLink
            redirectTo="/dashboard"
            buttonText="भारत गौरव मेंबरशिप ₹100 प्लान सालाना"
            className="w-full rounded-full border-2 border-blue-900 bg-blue-900 px-4 py-3 text-base font-bold text-white shadow-md transition-colors hover:bg-blue-800 hover:border-blue-950 focus-visible:ring-2 focus-visible:ring-blue-300"
          />
        </div>

        {/* Switch account */}
        <button
          onClick={handleSwitchAccount}
          className="mx-auto mt-3 flex items-center gap-1 text-sm text-slate-600 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          दूसरे अकाउंट से लॉगिन करें
        </button>
      </div>
    </div>
  );
};

export default BharatGauravMembershipPage;
