import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Wifi,
  Info,
  Hand,
  Building2,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { startInstantRazorpayPayment } from "@/lib/razorpayPayments";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";

const benefits = [
  {
    icon: Hand,
    title: "ज़ीरो कमीशन व्यापार",
    desc: "अपने छोटे से व्यापार या दुकान का 'ज़ीरो कमीशन' पर फ्री रजिस्ट्रेशन (Free Registration) करें और सीधे ग्राहकों से जुड़ें।",
  },
  {
    icon: Briefcase,
    title: "सुनिश्चित रोज़गार (Jobs)",
    desc: "पोर्टल पर रजिस्ट्रेशन करने वाले हर सदस्य को उसकी योग्यता के अनुसार जॉब (Jobs) और रोज़गार के अवसर प्रदान किए जाएंगे।",
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

const PlanCard = ({ price, label, sub, onPay, busy, highlighted }: { price: string; label: string; sub: string; onPay: () => void; busy: boolean; highlighted?: boolean }) => (
  <button
    onClick={onPay}
    disabled={busy}
    className={`flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center transition-all ${
      highlighted
        ? "border-[#FF8C00] bg-[#FF8C00]/10"
        : "border-gray-200 bg-white"
    } ${busy ? "opacity-60" : "hover:scale-[1.02] active:scale-95"}`}
  >
    <p className="text-xs font-bold text-gray-700">भारत गौरव मेंबरशिप {price} प्लान</p>
    <p className="text-3xl font-extrabold text-[#1a237e]">{price}</p>
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    <p className="text-[11px] uppercase tracking-wider text-gray-500">{sub}</p>
    <span className={`mt-2 w-full rounded-md py-1 text-xs font-bold ${highlighted ? "bg-[#FF8C00] text-white" : "bg-[#1a237e]/10 text-[#1a237e]"}`}>
      {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "अभी भुगतान करें"}
    </span>
  </button>
);

const BharatGauravMembershipPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isActive, loading, refresh } = useBharatGauravMembership();
  const [busy, setBusy] = useState<"monthly" | "yearly" | null>(null);

  if (!loading && isActive) {
    navigate("/dashboard", { replace: true });
  }

  const startPayment = async (plan: "monthly" | "yearly") => {
    if (!user) { navigate("/login?next=/membership"); return; }
    setBusy(plan);
    try {
      await startInstantRazorpayPayment({
        module: "bharat_gaurav" as any,
        plan,
        onSuccess: async () => {
          toast.success("भुगतान सफल — डैशबोर्ड पर ले जा रहे हैं");
          await refresh();
          navigate("/dashboard", { replace: true });
        },
        onFailure: () => {
          toast.error("भुगतान पूरा नहीं हुआ। कृपया फिर से प्रयास करें।");
        },
      });
    } catch (e: any) {
      toast.error(e?.message || "Payment could not start");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/40 to-emerald-50/40 px-4 py-6">
      <div className="mx-auto max-w-md">
        <Card className="border-2 border-gray-200 bg-white p-5 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-[#FF8C00] bg-white">
              <span className="text-xl font-extrabold text-[#1a237e]">मे.भा.दु</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1a237e]">भारत गौरव मेंबरशिप</h1>
            <p className="mt-1 text-sm font-semibold text-gray-700">भारत के हर नागरिक के लिए आवश्यक है</p>

            <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="rounded-lg bg-[#FF8C00]/10 px-3 py-1 text-[11px] font-bold text-[#FF8C00]">DIGITAL INDIA</span>
              <Landmark className="h-4 w-4 text-[#1a237e]" />
              <span className="text-xs font-bold text-[#1a237e]">बैंक वेरिफिकेशन</span>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-4 rounded-xl border border-[#1a237e]/20 bg-[#1a237e]/5 p-3 text-center">
            <p className="text-sm font-bold text-[#1a237e]">मानक नागरिक सदस्यता आवश्यक है</p>
            <p className="mt-1 text-xs text-gray-700">
              पोर्टल की सेवाएं सुरक्षित रहती हैं। आप मेरा भारत दुकान के डिजिटल व्यापार से नौकरी, शिक्षा सेवा, स्थानीय दुकान नेटवर्क और भरोसेमंद उपयोग कर सकते हैं।
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-extrabold text-gray-800">नई मुख्य सुविधाएं</p>
            <div className="space-y-2">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                const accent = i < 2;
                return (
                  <div
                    key={i}
                    className={`flex gap-3 rounded-xl border p-3 ${accent ? "border-[#FF8C00]/40 bg-[#FF8C00]/10" : "border-gray-200 bg-white"}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent ? "bg-[#FF8C00] text-white" : "bg-[#1a237e]/10 text-[#1a237e]"}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#1a237e]">{b.title}</p>
                      <p className="text-[12px] leading-snug text-gray-700">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plans */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PlanCard
              price="₹10"
              label="मासिक प्लान"
              sub="Monthly Plan"
              busy={busy === "monthly"}
              highlighted
              onPay={() => startPayment("monthly")}
            />
            <PlanCard
              price="₹100"
              label="सालाना प्लान"
              sub="Yearly Plan"
              busy={busy === "yearly"}
              onPay={() => startPayment("yearly")}
            />
          </div>

          {/* Primary CTA - default monthly for clarity */}
          <Button
            onClick={() => startPayment("monthly")}
            disabled={busy !== null}
            className="mt-4 w-full bg-[#FF8C00] py-6 text-base font-extrabold text-white hover:bg-[#FF8C00]/90"
          >
            {busy === "monthly" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Building2 className="mr-2 h-5 w-5" />}
            भारत गौरव मेंबरशिप ₹10 प्लान
          </Button>

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