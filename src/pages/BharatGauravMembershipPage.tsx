import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Landmark,
  HandHeart,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Wifi,
  Info,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { startBharatGauravPaymentLink } from "@/lib/razorpayPayments";
import { toast } from "sonner";
import mbdLogo from "@/assets/mbd-logo.png";

const benefits = [
  {
    icon: HandHeart,
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
  },
  {
    icon: ShieldCheck,
    title: "सुरक्षा चक्र",
    desc: "बेटी सुरक्षा, बाल सुरक्षा और पारिवारिक सुरक्षा का भरोसा।",
  },
  {
    icon: Wifi,
    title: "डिजिटल कनेक्टिविटी",
    desc: "नज़दीकी दुकान नेटवर्क से सीधा जुड़ाव और डिजिटल पहचान।",
  },
  {
    icon: Info,
    title: "अन्य सुविधाएं",
    desc: "पुराने सामान की खरीद-बिक्री, मैरिज ब्यूरो (जीवनसाथी), सरकारी लोन और सरकारी जॉब्स की सटीक जानकारी।",
  },
];

const BharatGauravMembershipPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isActive, loading, refresh } = useBharatGauravMembership();
  const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);

  useEffect(() => {
    if (!loading && isActive) navigate("/dashboard", { replace: true });
  }, [loading, isActive, navigate]);

  const handlePay = async (plan: "monthly" | "yearly") => {
    if (!user) { toast.error("Please login first"); return; }
    setPayingPlan(plan);
    try {
      await startBharatGauravPaymentLink({
        plan,
        onSuccess: async () => {
          toast.success("Payment Successful — Bharat Gaurav Membership Active!");
          await refresh();
          navigate("/dashboard", { replace: true });
        },
        onFailure: () => toast.error("Payment failed. Please retry."),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed. Please retry.");
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/40 to-emerald-50/40 px-4 py-6">
      <div className="mx-auto max-w-md">
        <Card className="border-2 border-gray-200 bg-white p-5 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-[#FF8C00] bg-white">
              <img src={mbdLogo} alt="मेरा भारत दुकान" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1a237e]">भारत गौरव मेंबरशिप</h1>
            <p className="mt-1 text-sm font-semibold text-gray-700">भारत के हर नागरिक के लिए आवश्यक है</p>

            <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="rounded-lg bg-[#FF8C00]/10 px-3 py-1 text-[11px] font-bold text-[#FF8C00]">DIGITAL INDIA</span>
              <Landmark className="h-4 w-4 text-[#1a237e]" />
              <span className="text-xs font-bold text-[#1a237e]">बैंक वेरिफिकेशन</span>
            </div>
          </div>

          {/* Notice box */}
          <div className="mt-4 rounded-xl border border-[#1a237e]/15 bg-[#1a237e]/5 p-3 text-center">
            <p className="text-sm font-bold text-[#1a237e]">मानक नागरिक सदस्यता आवश्यक है</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-700">
              पोर्टल की सेवाएं सुरक्षित रहती हैं। आप मेरा भारत दुकान के डिजिटल व्यापार से नौकरी, शिक्षा सेवा, स्थानीय दुकान नेटवर्क और भरोसेमंद उपयोग कर सकते हैं।
            </p>
          </div>

          {/* Benefits */}
          <h2 className="mt-5 mb-2 text-base font-extrabold text-[#1a237e]">नई मुख्य सुविधाएं</h2>
          <div className="space-y-2">
            {benefits.map(({ icon: Icon, title, desc, highlight }) => (
              <div
                key={title}
                className={`flex gap-3 rounded-xl border p-3 ${
                  highlight
                    ? "border-[#FF8C00]/40 bg-[#FF8C00]/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    highlight ? "bg-[#FF8C00]" : "bg-[#1a237e]/10"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${highlight ? "text-white" : "text-[#1a237e]"}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a237e]">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-700">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan cards */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Monthly — highlighted */}
            <div className="rounded-xl border-2 border-[#FF8C00] bg-[#FF8C00]/10 p-3 text-center">
              <p className="text-[11px] font-bold leading-tight text-[#1a237e]">
                भारत गौरव मेंबरशिप ₹10 प्लान
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#1a237e]">₹10</p>
              <p className="mt-1 text-xs font-semibold text-gray-700">मासिक प्लान</p>
              <p className="text-[10px] font-bold tracking-wider text-gray-500">MONTHLY PLAN</p>
              <button
                type="button"
                onClick={() => handlePay("monthly")}
                disabled={payingPlan !== null}
                className="mt-3 w-full rounded-md bg-[#FF8C00] px-2 py-2 text-[11px] font-bold text-white"
              >
                {payingPlan === "monthly" ? "Processing..." : "अभी भुगतान करें"}
              </button>
            </div>
            {/* Yearly */}
            <div className="rounded-xl border-2 border-gray-200 bg-white p-3 text-center">
              <p className="text-[11px] font-bold leading-tight text-[#1a237e]">
                भारत गौरव मेंबरशिप ₹100 प्लान
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#1a237e]">₹100</p>
              <p className="mt-1 text-xs font-semibold text-gray-700">सालाना प्लान</p>
              <p className="text-[10px] font-bold tracking-wider text-gray-500">YEARLY PLAN</p>
              <button
                type="button"
                onClick={() => handlePay("yearly")}
                disabled={payingPlan !== null}
                className="mt-3 w-full rounded-md bg-gray-100 px-2 py-2 text-[11px] font-bold text-[#1a237e]"
              >
                {payingPlan === "yearly" ? "Processing..." : "अभी भुगतान करें"}
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => handlePay("monthly")}
            disabled={payingPlan !== null}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF8C00] px-4 py-3 text-sm font-extrabold text-white shadow-md"
          >
            <CreditCard className="h-4 w-4" />
            भारत गौरव मेंबरशिप ₹10 प्लान
          </button>

          <button
            type="button"
            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
            className="mt-4 w-full text-center text-xs text-gray-500 underline"
          >
            ← दूसरे अकाउंट से लॉगिन करें
          </button>

          {loading && (
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" /> सदस्यता जांच रहे हैं...
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BharatGauravMembershipPage;