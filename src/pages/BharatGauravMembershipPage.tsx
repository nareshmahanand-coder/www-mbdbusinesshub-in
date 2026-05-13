import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { startBharatGauravPaymentLink } from "@/lib/razorpayPayments";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { Briefcase, GraduationCap, Shield, Wifi, Sparkles, Store, ShieldCheck, BadgeCheck, Loader2, CheckCircle2 } from "lucide-react";

const BENEFITS = [
  { icon: Store, title: "ज़ीरो कमीशन व्यापार", desc: "मेरा भारत दुकान पर बिना किसी कमीशन के खरीदें और बेचें।" },
  { icon: Briefcase, title: "सुनिश्चित रोज़गार (Jobs)", desc: "नौकरी और रोज़गार के अवसरों तक प्राथमिकता पहुँच।" },
  { icon: GraduationCap, title: "कौशल विकास", desc: "मुफ़्त कोर्स, क्विज़ और प्रमाणपत्र से अपना कौशल बढ़ाएँ।" },
  { icon: Shield, title: "सुरक्षा चक्र", desc: "परिवार के लिए SOS, सेफ वॉक और लोकेशन शेयरिंग।" },
  { icon: Wifi, title: "डिजिटल कनेक्टिविटी", desc: "हर सेवा एक ही ऐप पर — डिजिटल इंडिया से जुड़ें।" },
  { icon: Sparkles, title: "अन्य सुविधाएं", desc: "मैट्रिमोनी, क्लासिफाइड्स, भारत मित्र AI और बहुत कुछ।" },
];

const PlanCard = ({
  plan,
  price,
  period,
  highlight,
  loading,
  onPay,
}: {
  plan: "monthly" | "yearly";
  price: string;
  period: string;
  highlight?: string;
  loading: boolean;
  onPay: () => void;
}) => (
  <Card className="relative overflow-hidden border-2 border-orange-200 shadow-lg">
    {highlight && (
      <div className="absolute right-3 top-3">
        <Badge className="bg-orange-500 hover:bg-orange-500 text-white">{highlight}</Badge>
      </div>
    )}
    <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
      <p className="font-hindi text-base font-semibold text-blue-900">
        {plan === "monthly" ? "मासिक प्लान" : "वार्षिक प्लान"}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-blue-900">₹{price}</span>
        <span className="font-hindi text-sm text-muted-foreground">/ {period}</span>
      </div>
      <Button
        onClick={onPay}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
        size="lg"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${price} Now`}
      </Button>
    </CardContent>
  </Card>
);

const BharatGauravMembershipPage = () => {
  const navigate = useNavigate();
  const { isMember, loading: memberLoading, refresh } = useBharatGauravMembership();
  const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);

  const handlePay = async (plan: "monthly" | "yearly") => {
    setPayingPlan(plan);
    try {
      await startBharatGauravPaymentLink({
        plan,
        onSuccess: async () => {
          await refresh();
          toast({ title: "धन्यवाद!", description: "आपकी भारत गौरव मेंबरशिप सक्रिय हो गई है।" });
          navigate("/dashboard");
        },
        onFailure: () => {
          toast({ title: "Payment incomplete", description: "Please try again or use Manual Sync if money was deducted.", variant: "destructive" });
        },
      });
    } catch (e) {
      toast({ title: "Payment failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setPayingPlan(null);
    }
  };

  if (memberLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-blue-50 px-4 py-12">
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-hindi text-2xl font-extrabold leading-snug text-blue-900 sm:text-3xl">
            भारत गौरव मेंबरशिप
          </h1>
          <p className="mt-2 font-hindi text-base text-blue-900/80 sm:text-lg">
            भारत के हर नागरिक के लिए आवश्यक है
          </p>

          {/* Trust badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge className="gap-1 bg-orange-500 text-white hover:bg-orange-500">
              <BadgeCheck className="h-3.5 w-3.5" /> Digital India
            </Badge>
            <Badge className="gap-1 bg-orange-500 text-white hover:bg-orange-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Bank Verification
            </Badge>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-blue-100 bg-white/80 shadow-sm">
              <CardContent className="flex gap-3 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <Icon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-hindi text-base font-semibold text-blue-900">{title}</p>
                  <p className="font-hindi text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans */}
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            plan="monthly"
            price="10"
            period="माह"
            loading={payingPlan === "monthly"}
            onPay={() => handlePay("monthly")}
          />
          <PlanCard
            plan="yearly"
            price="100"
            period="वर्ष"
            highlight="Best Value"
            loading={payingPlan === "yearly"}
            onPay={() => handlePay("yearly")}
          />
        </div>

        <p className="text-center font-hindi text-xs text-muted-foreground">
          भुगतान सुरक्षित Razorpay के माध्यम से संसाधित होता है।
        </p>
      </div>
    </div>
  );
};

export default BharatGauravMembershipPage;