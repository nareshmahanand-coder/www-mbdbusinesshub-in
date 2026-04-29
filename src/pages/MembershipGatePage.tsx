import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Crown, Landmark, HandCoins, BriefcaseBusiness, GraduationCap, ShieldCheck, Network, BadgeInfo } from "lucide-react";
import logoCircle from "@/assets/logo-circle.jpeg";
import { startBharatGauravPaymentLink } from "@/lib/razorpayPayments";

const MembershipGatePage = ({ onActivated }: { onActivated: () => void }) => {
  const { user, signOut } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  const planDetails = {
    monthly: { label: "भारत गौरव मेंबरशिप ₹10 प्लान" },
    yearly: { label: "भारत गौरव मेंबरशिप ₹100 प्लान" },
  };

  const primeFeatures = [
    {
      icon: HandCoins,
      title: "जीरो कमीशन व्यापार",
      text: "अपने छोटे से व्यापार या दुकान का 'जीरो कमीशन' पर फ्री रजिस्ट्रेशन (Free Registration) करें और सीधे ग्राहकों से जुड़ें।",
      highlight: true,
    },
    {
      icon: BriefcaseBusiness,
      title: "सुनिश्चित रोजगार (Jobs)",
      text: "पोर्टल पर रजिस्ट्रेशन करने वाले हर सदस्य को उनकी योग्यता के अनुसार जॉब (Jobs) और रोजगार के अवसर प्रदान किए जाएंगे।",
      highlight: true,
    },
    {
      icon: GraduationCap,
      title: "कौशल विकास",
      text: "हर प्रकार की व्यावसायिक ट्रेनिंग और एनजीओ (NGO) द्वारा अधिकृत प्रमाण पत्र (Certificate) की सुविधा।",
    },
    {
      icon: ShieldCheck,
      title: "सुरक्षा चक्र",
      text: "बेटी सुरक्षा, बाल सुरक्षा और पारिवारिक सुरक्षा का भरोसा।",
    },
    {
      icon: Network,
      title: "डिजिटल कनेक्टिविटी",
      text: "नजदीकी दुकान नेटवर्क से सीधा जुड़ाव और डिजिटल पहचान।",
    },
    {
      icon: BadgeInfo,
      title: "अन्य सुविधाएं",
      text: "पुराने सामान की खरीद-बिक्री, मैरिज ब्यूरो (जीवनसाथी), सरकारी लोन और सरकारी जॉब्स की सटीक जानकारी।",
    },
  ];

  const handlePayment = async () => {
    if (!user) return;
    setSubmitting(true);
    setPaymentFailed(false);

    try {
      await startBharatGauravPaymentLink({
        plan,
        onSuccess: () => {
          toast.success("Payment successful — membership unlocked!");
          onActivated();
          window.location.href = "/dashboard";
        },
        onFailure: () => setPaymentFailed(true),
      });
    } catch (error) {
      setPaymentFailed(true);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-saffron/10 via-background to-green-india/10">
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-green-india" />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-md overflow-hidden border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-4 border-b-4 border-saffron/70 bg-primary/5">
            <img src={logoCircle} alt="Mera Bharat Dukaan" className="mx-auto h-20 w-20 rounded-full object-cover shadow-lg border-4 border-saffron/40" />
            <div className="space-y-1 font-hindi">
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
                भारत गौरव मेंबरशिप
              </CardTitle>
              <p className="text-base sm:text-lg font-extrabold text-foreground">भारत के हर नागरिक के लिए आवश्यक है</p>
            </div>
            <div className="mx-auto w-full rounded-lg border border-primary/20 bg-background p-3 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-11 w-24 items-center justify-center rounded-md border border-saffron/50 bg-saffron/10 text-center text-[11px] font-extrabold uppercase leading-tight text-primary">
                  Digital<br />India
                </div>
                <div className="flex items-center gap-2 font-hindi text-lg font-extrabold text-primary">
                  <Landmark className="h-5 w-5 text-accent" />
                  बैंक वेरिफिकेशन
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/10 border-2 border-primary/25 p-4 text-center shadow-sm">
              <h2 className="font-hindi text-lg font-extrabold text-primary">मानक नागरिक सदस्यता आवश्यक है</h2>
              <p className="font-hindi text-[13px] leading-relaxed text-foreground">
                पोर्टल की सेवाएं सुरक्षित रहती हैं। आप मेरा भारत दुकान के डिजिटल व्यापार से नौकरी, शिक्षा सेवा, स्थानीय दुकान नेटवर्क और भरोसेमंद उपयोग कर सकते हैं।
              </p>
            </div>

            <section className="space-y-3" aria-labelledby="prime-features-heading">
              <h3 id="prime-features-heading" className="font-hindi text-base font-extrabold text-primary">
                नई मुख्य सुविधाएं
              </h3>
              <div className="grid gap-2">
                {primeFeatures.map(({ icon: Icon, title, text, highlight }) => (
                  <div
                    key={title}
                    className={`flex gap-3 rounded-lg border p-3 shadow-sm ${highlight ? "border-accent/50 bg-accent/10" : "border-border bg-card"}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${highlight ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 font-hindi">
                      <p className="text-sm font-extrabold text-foreground leading-tight">{title}</p>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPlan("monthly")}
                className={`rounded-lg border-2 p-3 text-center transition-all ${plan === "monthly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <p className="text-xs font-extrabold text-accent font-hindi leading-snug">भारत गौरव मेंबरशिप ₹10 प्लान</p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">₹10</p>
                <p className="mt-1 text-sm font-extrabold text-primary font-hindi">मासिक प्लान</p>
                <p className="text-[10px] font-semibold text-muted-foreground">Monthly Plan</p>
                <p className="mt-2 rounded-md bg-muted px-2 py-1 text-[11px] font-bold text-foreground font-hindi">मासिक किराया</p>
              </button>
              <button onClick={() => setPlan("yearly")}
                className={`rounded-lg border-2 p-3 text-center transition-all ${plan === "yearly" ? "border-accent bg-accent/10 shadow-md" : "border-border bg-card hover:border-accent/50"}`}>
                <p className="text-xs font-extrabold text-green-india font-hindi leading-snug">भारत गौरव मेंबरशिप ₹100 प्लान</p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">₹100</p>
                <p className="mt-1 text-sm font-extrabold text-primary font-hindi">सालाना प्लान</p>
                <p className="text-[10px] font-semibold text-muted-foreground">Yearly Plan</p>
                <p className="mt-2 rounded-md bg-muted px-2 py-1 text-[11px] font-bold text-foreground font-hindi">सालाना किराया</p>
              </button>
            </div>

            <Button onClick={handlePayment} disabled={submitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-6 gap-2 shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crown className="h-5 w-5" />}
              {planDetails[plan].label}
            </Button>
            {paymentFailed && (
              <Button onClick={handlePayment} disabled={submitting} variant="outline" className="w-full font-bold">
                Retry Payment
              </Button>
            )}
            <button onClick={signOut} className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-2">
              ← दूसरे अकाउंट से लॉगिन करें
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipGatePage;
