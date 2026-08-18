import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "1. कोऑर्डिनेटर की पात्रता और पंजीकरण (Eligibility & Registration)",
    points: [
      "कोऑर्डिनेटर बनने के लिए आवेदक की आयु कम से कम 18 वर्ष होनी चाहिए और उसे अपने क्षेत्र तथा टीम मैनेजमेंट की पूरी समझ होनी चाहिए।",
      "कोऑर्डिनेटर को पंजीकरण के समय अपनी सही और वैध जानकारी (जैसे नाम, मोबाइल नंबर, बैंक खाता विवरण/UPI) प्रदान करनी होगी।",
    ],
  },
  {
    title: "2. कोऑर्डिनेटर का सब्सक्रिप्शन और शुल्क (Subscription Fee)",
    points: [
      "कोऑर्डिनेटर रोल और एक्सक्लूसिव डैशबोर्ड को एक्टिव रखने के लिए ₹100 प्रति माह का मासिक सब्सक्रिप्शन शुल्क लागू होता है, जिसका भुगतान रेज़रपे (Razorpay) के माध्यम से करना अनिवार्य है।",
      "यह सब्सक्रिप्शन मासिक आधार पर स्वतः नवीनीकरण (Auto-renewal/Recurring) पर रह सकता है, जिसे कोऑर्डिनेटर जब चाहें प्रबंधित कर सकते हैं।",
    ],
  },
  {
    title: "3. कोऑर्डिनेटर का मुख्य कार्य और 2% कमीशन नीति (Core Responsibilities & 2% Commission Policy)",
    points: [
      "कोऑर्डिनेटर का मुख्य काम अपने क्षेत्र में एजेंट्स (Agents) की टीम तैयार करना, उनका मार्गदर्शन करना और उनके कार्यों की देखरेख करना है।",
      "2% कमीशन स्ट्रक्चर: कोऑर्डिनेटर के अंतर्गत काम करने वाले सभी जुड़े हुए एजेंट्स द्वारा किए गए वैध कार्यों और जनरेट होने वाले रेवेन्यू/काम पर कोऑर्डिनेटर को 2% का कमीशन दिया जाएगा।",
      "7 दिन की होल्ड अवधि: कमीशन और अर्निंग्स की सुरक्षा और पारदर्शिता के लिए राशि 7 (सात) दिनों तक पेंडिंग/होल्ड पर रहेगी। इसके बाद वह राशि कोऑर्डिनेटर के विथड्रॉवल वॉलेट में ट्रांसफर कर दी जाएगी।",
      "सब्सक्रिप्शन की अनिवार्यता: कोऑर्डिनेटर का मासिक सब्सक्रिप्शन एक्टिव रहने पर ही उन्हें एजेंट्स के काम का 2% कमीशन प्राप्त होगा। सब्सक्रिप्शन निष्क्रिय (Inactive) होने पर कमीशन का लाभ रोक दिया जाएगा।",
    ],
  },
  {
    title: "4. आचार संहिता और धोखाधड़ी निषेध (Code of Conduct & Fraud Prevention)",
    points: [
      "किसी भी प्रकार की धोखाधड़ी, फर्जी ट्रांजैक्शन, गलत जानकारी देना या कंपनी के नाम और अधिकारों का दुरुपयोग करना सख्त मना है।",
      "यदि कोई कोऑर्डिनेटर किसी भी अनैतिक गतिविधि या नियमों के उल्लंघन में लिप्त पाया जाता है, तो उसका कोऑर्डिनेटर अकाउंट तुरंत सस्पेंड कर दिया जाएगा और वॉलेट में मौजूद राशि जब्त की जा सकती है।",
    ],
  },
  {
    title: "5. नियम में बदलाव (Modification of Terms)",
    points: [
      "'मेरा भारत दुकान' प्रबंधन के पास बिना किसी पूर्व सूचना के इन नियमों, शर्तों और कमीशन स्ट्रक्चर में बदलाव करने का पूरा अधिकार सुरक्षित है।",
    ],
  },
  {
    title: "6. कानूनी क्षेत्राधिकार (Jurisdiction)",
    points: [
      "किसी भी तरह के विवाद की स्थिति में उसका समाधान छत्तीसगढ़ के दुर्ग/भिलाई न्यायालय के क्षेत्राधिकार के अंतर्गत ही किया जाएगा।",
    ],
  },
];

const CoordinatorTerms = ({ compact = false }: { compact?: boolean }) => (
  <Card className="border-2 border-primary/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
        <ScrollText className="h-5 w-5 text-primary" /> कोऑर्डिनेटर नियम और शर्तें (Coordinator Terms &amp; Conditions)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={compact ? "max-h-64 overflow-y-auto pr-2" : ""}>
        <p className="font-hindi text-sm text-muted-foreground">
          'मेरा भारत दुकान' ("प्लेटफॉर्म", "ऐप", "हम") के आधिकारिक कोऑर्डिनेटर या पार्टनर के रूप में जुड़ने पर आप निम्नलिखित नियमों और शर्तों से बंधे होने की सहमति देते हैं। कृपया इन्हें ध्यान से पढ़ें:
        </p>
        <div className="mt-4 space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="font-hindi text-sm font-semibold">{s.title}</h3>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
                {s.points.map((p) => (
                  <li key={p} className="font-hindi text-sm leading-relaxed text-muted-foreground">{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default CoordinatorTerms;
