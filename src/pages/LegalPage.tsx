import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";

type LegalSection = "contact" | "privacy" | "refund";

const pageCopy = {
  contact: {
    icon: Mail,
    title: "Contact Us",
    hindi: "संपर्क करें",
  },
  privacy: {
    icon: ShieldCheck,
    title: "Privacy Policy",
    hindi: "गोपनीयता नीति",
  },
  refund: {
    icon: RotateCcw,
    title: "Refund Policy",
    hindi: "रिफंड नीति",
  },
} as const;

const LegalPage = ({ section }: { section: LegalSection }) => {
  const copy = pageCopy[section];
  const Icon = copy.icon;

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />
      <main className="relative z-10 container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center">
          <Icon className="mx-auto mb-2 h-10 w-10 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{copy.title}</h2>
          <p className="font-hindi text-muted-foreground">{copy.hindi}</p>
        </div>

        {section === "contact" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business & Support Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Business name:</strong> Mera Bharat Dukaan</p>
                <p><strong className="text-foreground">Support hours:</strong> Monday to Saturday, 10:00 AM – 6:00 PM IST</p>
                <a href="mailto:helpline.bharatdukaan@gmail.com" className="flex items-center gap-2 font-semibold text-primary underline break-all">
                  <Mail className="h-4 w-4 shrink-0" /> helpline.bharatdukaan@gmail.com
                </a>
                <a href="https://wa.me/919203645007?text=Namaste%20Mera%20Bharat%20Dukaan%20Support" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-green-india underline">
                  <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp: +91 9203645007
                </a>
                <p className="font-hindi">कृपया सहायता के लिए ईमेल या WhatsApp संदेश भेजें।</p>
              </CardContent>
            </Card>
          </div>
        )}

        {section === "privacy" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>We collect account details, phone/email login information, KYC documents, selfie images, merchant details, payment status, and app activity needed to provide Mera Bharat Dukaan services.</p>
                <p>Camera and file access are used only when you choose to upload documents, take a selfie, or complete verification.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Use & Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Your data is used for login, KYC verification, premium access, merchant onboarding, safety services, and customer support.</p>
                <p>We do not sell personal information. Sensitive documents are protected and used only for verification, compliance, fraud prevention, and account safety.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Payments are processed through Razorpay. We store payment confirmation details required to unlock services, provide support, and maintain transaction records.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {section === "refund" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Digital Membership & Service Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Mera Bharat Dukaan provides instant access to digital services such as Marriage Bureau and merchant premium access after successful payment.</p>
                <p>Because access is activated immediately, paid digital membership fees are generally non-refundable once unlocked.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Eligible Refund Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Refunds may be reviewed if a duplicate payment is charged, payment succeeds but access is not activated, or a technical error prevents service delivery.</p>
                <p>Approved refunds will be processed to the original payment method within 5–7 working days, subject to bank and payment gateway timelines.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Refund Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>For refund review, contact us with your registered mobile/email, payment date, amount, and Razorpay payment reference.</p>
                <a href="mailto:helpline.bharatdukaan@gmail.com" className="font-semibold text-primary underline break-all">helpline.bharatdukaan@gmail.com</a>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">Last updated: April 2026</p>
      </main>
    </div>
  );
};

export default LegalPage;