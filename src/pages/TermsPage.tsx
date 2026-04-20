import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Scale,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Handshake,
  MapPin,
  Siren,
  BatteryLow,
  Ban,
} from "lucide-react";

const Bilingual = ({
  en,
  hi,
}: {
  en: string;
  hi: string;
}) => (
  <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2">
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">
        English
      </p>
      <p className="text-sm text-foreground">{en}</p>
    </div>
    <div className="border-t pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-saffron">
        हिंदी
      </p>
      <p className="font-hindi text-sm text-foreground">{hi}</p>
    </div>
  </div>
);

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

        <Card className="border-2 border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Family Safety Circle (Kavach) — सुरक्षा कवच
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <Handshake className="h-4 w-4 text-primary" /> Consent & Privacy / सहमति और गोपनीयता
              </p>
              <Bilingual
                en="Use of this feature requires mutual consent. Bharat Mitra will only share the location of members who have explicitly 'Accepted' the invitation within Mera Bharat Dukaan."
                hi="इस फीचर का उपयोग करने के लिए आपसी सहमति अनिवार्य है। भारत मित्र केवल उन्हीं सदस्यों की लोकेशन दिखाएगा जिन्होंने मेरा भारत दुकान ऐप में 'मंजूरी' दी है।"
              />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Location Accuracy / लोकेशन की सटीकता
              </p>
              <Bilingual
                en="GPS accuracy depends on hardware and network. Mera Bharat Dukaan is not liable for technical delays or inaccurate location in low-signal areas."
                hi="लोकेशन की सटीकता आपके फोन के GPS और नेटवर्क पर निर्भर करती है। तकनीकी खराबी या खराब नेटवर्क के लिए मेरा भारत दुकान जिम्मेदार नहीं है।"
              />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <Siren className="h-4 w-4 text-destructive" /> Emergency SOS / आपातकालीन सहायता
              </p>
              <Bilingual
                en="The SOS alert is a communication tool. Mera Bharat Dukaan is not legally liable for any incidents or the speed of third-party responses."
                hi="SOS अलर्ट केवल सूचना पहुँचाने का एक माध्यम है। किसी भी दुर्घटना या बाहरी मदद की गति के लिए मेरा भारत दुकान कानूनी रूप से जिम्मेदार नहीं है।"
              />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <BatteryLow className="h-4 w-4 text-saffron" /> Battery & Last Location / बैटरी और अंतिम स्थान
              </p>
              <Bilingual
                en="The app will record the 'Last Known Location' before shutdown if background access is granted."
                hi="फोन स्विच ऑफ होने से पहले ऐप अंतिम स्थान रिकॉर्ड करने की कोशिश करेगी, यदि आपने लोकेशन की अनुमति दी है।"
              />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <Ban className="h-4 w-4 text-destructive" /> Prohibition of Misuse / गलत इस्तेमाल पर रोक
              </p>
              <Bilingual
                en="Stalking or unauthorized tracking is a crime and will lead to a permanent ban from Mera Bharat Dukaan."
                hi="जासूसी या गलत तरीके से ट्रैकिंग करना अपराध है। ऐसा करने पर आपका अकाउंट मेरा भारत दुकान से हमेशा के लिए ब्लॉक कर दिया जाएगा।"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>By using Mera Bharat Dukaan, you agree to these terms.</p>
            <p className="font-hindi mt-1">मेरा भारत दुकान का उपयोग करके, आप इन शर्तों से सहमत हैं।</p>
            <p className="mt-2 text-xs">Last updated: April 2026</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default TermsPage;
