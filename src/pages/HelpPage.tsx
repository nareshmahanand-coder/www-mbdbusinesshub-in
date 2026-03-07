import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";

const HelpPage = () => (
  <div className="ashoka-watermark tiranga-bg min-h-screen">
    <AppHeader />
    <div className="relative z-10 container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 text-center">
        <HelpCircle className="mx-auto mb-2 h-10 w-10 text-saffron" />
        <h2 className="text-2xl font-bold text-foreground">Help & Support</h2>
        <p className="font-hindi text-muted-foreground">सहायता एवं समर्थन</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              For all queries, complaints, and support requests, please email us:
            </p>
            <a
              href="mailto:helpline.bharatdukaan@gmail.com"
              className="mt-2 block text-lg font-semibold text-primary underline"
            >
              helpline.bharatdukaan@gmail.com
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              We typically respond within 24-48 hours.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-india" />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">How do I register my shop?</p>
              <p className="text-muted-foreground">Go to the Merchant page and fill the registration form. Your shop will be live after admin verification.</p>
            </div>
            <div>
              <p className="font-semibold">Is there any commission?</p>
              <p className="text-muted-foreground">No! Mera Bharat Dukaan charges 0% commission. All payments go directly to merchants.</p>
            </div>
            <div>
              <p className="font-semibold">How do I report a shop?</p>
              <p className="text-muted-foreground">Click the "Report Shop" button on any shop card. We will review and take action within 48 hours.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Safety & Trust
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>All shops are verified by our admin team before listing. We take user safety seriously. Report any suspicious activity to our support email.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default HelpPage;
