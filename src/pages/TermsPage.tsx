import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, IndianRupee, ShieldCheck, AlertTriangle } from "lucide-react";

const TermsPage = () => (
  <div className="ashoka-watermark tiranga-bg min-h-screen">
    <AppHeader />
    <div className="relative z-10 container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 text-center">
        <Scale className="mx-auto mb-2 h-10 w-10 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Terms & Conditions</h2>
        <p className="font-hindi text-muted-foreground">नियम एवं शर्तें</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-india" />
              0% Commission Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Mera Bharat Dukaan charges <strong className="text-foreground">absolutely zero commission</strong> on any transaction. We are a platform to connect local merchants with customers.</p>
            <p>All payments are made <strong className="text-foreground">directly to the merchant</strong> via cash, UPI, or any mode agreed between buyer and seller.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Direct Payments to Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Mera Bharat Dukaan does <strong className="text-foreground">not process, hold, or facilitate any payments</strong>. We only provide a discovery platform.</p>
            <p>All financial transactions occur directly between the customer and the merchant. We encourage using UPI for digital payments.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-saffron" />
              Liability & Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Mera Bharat Dukaan is a <strong className="text-foreground">listing and discovery platform only</strong>. We are not responsible for:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Quality of goods or services provided by merchants</li>
              <li>Any disputes between merchants and customers</li>
              <li>Pricing, availability, or delivery of products</li>
              <li>Any financial loss arising from transactions</li>
            </ul>
            <p>Merchants are solely responsible for their products, services, and compliance with local laws.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>By using Mera Bharat Dukaan, you agree to these terms.</p>
            <p className="font-hindi mt-1">मेरा भारत दुकान का उपयोग करके, आप इन शर्तों से सहमत हैं।</p>
            <p className="mt-2 text-xs">Last updated: March 2026</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default TermsPage;
