import { Fish, Egg, Leaf, ArrowRight, Recycle, Sparkles, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const NANDA_WHATSAPP = "918305161361";

const orderOnWhatsApp = (productHi: string) => {
  const msg = `नमस्ते! मुझे नंदा एग्रो फार्म से "${productHi}" चाहिए। कृपया डिलीवरी की जानकारी दें। 🙏`;
  window.open(`https://wa.me/${NANDA_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
};

const subCategories = [
  {
    portalId: "nanda-acqua",
    icon: "💧",
    title: "नंदा एक्वा",
    titleEn: "Nanda Acqua Water",
    desc: "100% शुद्ध मिनरल वाटर — ₹20/1 LTR। Home delivery + bulk events।",
    color: "from-[hsl(200,80%,50%)] to-[hsl(210,80%,40%)]",
  },
  {
    portalId: "nanda-rishi-bhok-atta",
    icon: "🌾",
    title: "ऋषि भोग आटा",
    titleEn: "Rishi Bhok Atta",
    desc: "5-तत्व आयुर्वेदिक पाचक आटा — ₹60/किलो। FSSAI Approved।",
    color: "from-[hsl(35,80%,50%)] to-[hsl(25,80%,40%)]",
  },
  {
    portalId: "nanda-garlic",
    icon: "🧄",
    title: "छिला हुआ लहसुन",
    titleEn: "Peeled Garlic",
    desc: "हाथ से छिला ताज़ा लहसुन — ₹220 / 500g।",
    color: "from-[hsl(50,40%,50%)] to-[hsl(50,40%,40%)]",
  },
  {
    portalId: "nanda-chicken-chips",
    icon: "🍗",
    title: "देसी चिकन चिप्स",
    titleEn: "Desi Chicken Chips",
    desc: "High-protein crunchy snack — ₹10 / 15g, ₹100 / 80g।",
    color: "from-[hsl(25,85%,50%)] to-[hsl(15,85%,40%)]",
  },
  {
    portalId: "nanda-meat",
    icon: "🐔",
    title: "नंदा मीट & पोल्ट्री",
    titleEn: "Meat & Poultry",
    desc: "देसी मुर्गा, बकरा, अंडे — Antibiotic free, हलाल कट।",
    color: "from-[hsl(0,65%,45%)] to-[hsl(0,65%,35%)]",
  },
  {
    portalId: "nanda-dry-fruits",
    icon: "🥜",
    title: "नंदा ड्राई फ्रूट्स",
    titleEn: "Dry Fruits",
    desc: "बादाम, काजू, किशमिश, अखरोट — premium quality।",
    color: "from-[hsl(30,70%,40%)] to-[hsl(30,70%,30%)]",
  },
  {
    icon: "🐟",
    title: "ताज़ा मछली",
    titleEn: "Live Fish",
    desc: "तालाब से सीधा आपकी थाली तक — रोहू, कतला, मांगुर, तिलापिया",
    color: "from-[hsl(200,70%,45%)] to-[hsl(200,70%,35%)]",
  },
  {
    icon: "🐔",
    title: "पोल्ट्री & मीट",
    titleEn: "Poultry & Meat",
    desc: "देसी मुर्गा, अंडे, बटेर — फार्म फ्रेश, एंटीबायोटिक फ्री",
    color: "from-[hsl(15,80%,50%)] to-[hsl(15,80%,40%)]",
  },
  {
    icon: "🌿",
    title: "ऑर्गेनिक पाउडर",
    titleEn: "Veggie Powders",
    desc: "मोरिंगा, करेला, पालक पाउडर — 100% ऑर्गेनिक, फार्म से सीधा",
    color: "from-[hsl(140,60%,35%)] to-[hsl(140,60%,25%)]",
  },
  {
    icon: "🐐",
    title: "बकरी का मीट",
    titleEn: "Goat Meat",
    desc: "ताज़ा देसी बकरा — हलाल कट, साफ-सुथरा, होम डिलीवरी उपलब्ध",
    color: "from-[hsl(0,65%,45%)] to-[hsl(0,65%,35%)]",
  },
  {
    icon: "🥜",
    title: "ड्राई फ्रूट्स",
    titleEn: "Dry Fruits",
    desc: "बादाम, काजू, किशमिश, अखरोट — प्रीमियम क्वालिटी, सीधा फार्म पैकिंग",
    color: "from-[hsl(30,70%,40%)] to-[hsl(30,70%,30%)]",
  },
  {
    icon: "🍗",
    title: "चिकन चिप्स",
    titleEn: "Chicken Chips",
    desc: "क्रंची, प्रोटीन-रिच स्नैक — बच्चों और बड़ों दोनों के लिए",
    color: "from-[hsl(25,85%,50%)] to-[hsl(25,85%,40%)]",
  },
  {
    icon: "🧄",
    title: "छिला हुआ लहसुन",
    titleEn: "Peeled Garlic",
    desc: "ताज़ा छिला लहसुन — रसोई का काम आसान, समय की बचत",
    color: "from-[hsl(50,40%,50%)] to-[hsl(50,40%,40%)]",
  },
];

const zeroWasteSteps = [
  { emoji: "🌾", text: "खेत की फसल कटती है" },
  { emoji: "🐟", text: "फसल का कचरा मछलियों का भोजन बनता है" },
  { emoji: "💧", text: "मछली तालाब का पानी खेत की सिंचाई में जाता है" },
  { emoji: "♻️", text: "कुछ भी बर्बाद नहीं — Zero Waste!" },
];

const NandaFarmSection = () => {
  return (
    <section className="relative z-10 overflow-hidden border-y-2 border-[hsl(45,80%,50%)]/40">
      {/* Earthy green-gold gradient background */}
      <div className="bg-gradient-to-br from-[hsl(140,35%,15%)] via-[hsl(140,30%,20%)] to-[hsl(45,50%,18%)]">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(45,80%,50%)]/30 bg-[hsl(45,80%,50%)]/10 px-4 py-1.5">
              <span className="text-sm">🌿</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[hsl(45,80%,60%)]">
                Featured Farm • विशेष फार्म
              </span>
            </div>
            <h2 className="font-hindi text-3xl font-extrabold text-primary-foreground md:text-4xl">
              🐟 नंदा एग्रो फार्म
            </h2>
            <p className="mt-1 text-base font-semibold text-[hsl(45,80%,60%)]">
              Nanda Agro Farm — Bhilai, Chhattisgarh
            </p>
            <p className="mt-2 text-sm text-primary-foreground/70 max-w-xl mx-auto">
              एक ऐसा फार्म जहाँ खेती, मछली पालन और पोल्ट्री — सब एक साथ चलता है।
              <br />
              <span className="font-semibold text-[hsl(45,80%,60%)]">Zero Waste. 100% Organic. Farm Fresh.</span>
            </p>
            <Badge className="mt-3 bg-gradient-to-r from-[hsl(45,80%,45%)] to-[hsl(35,90%,50%)] text-[hsl(140,35%,12%)] text-xs font-bold px-4 py-1 shadow-lg">
              ⭐ Premium Partner Farm
            </Badge>
          </div>

          {/* Sub-categories */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {subCategories.map((cat) => (
              <Card
                key={cat.titleEn}
                className="group border-[hsl(45,80%,50%)]/20 bg-[hsl(140,20%,12%)]/80 backdrop-blur-sm hover:border-[hsl(45,80%,50%)]/50 transition-all hover:shadow-lg hover:shadow-[hsl(45,80%,50%)]/10"
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-2xl shadow-md`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="font-hindi text-lg font-bold text-primary-foreground">{cat.title}</h4>
                      <p className="text-xs text-[hsl(45,80%,60%)]">{cat.titleEn}</p>
                    </div>
                  </div>
                  <p className="font-hindi text-sm text-primary-foreground/70 leading-relaxed">{cat.desc}</p>
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-[hsl(45,80%,45%)] text-[hsl(140,35%,12%)] hover:bg-[hsl(45,80%,55%)] font-bold"
                    onClick={() => orderOnWhatsApp(cat.title)}
                  >
                    📱 WhatsApp ऑर्डर करें
                  </Button>
                  {(cat as any).portalId && (
                    <Link to={`/shop/${(cat as any).portalId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full border-[hsl(45,80%,55%)] text-[hsl(45,80%,70%)] hover:bg-[hsl(45,80%,50%)]/10"
                      >
                        ⭐ Premium Portal खोलें
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Health & Wellness — Rishi Bhok Ata Hero Card */}
          <div className="mb-8 overflow-hidden rounded-2xl border-2 border-[hsl(45,80%,50%)]/40 bg-gradient-to-br from-[hsl(35,55%,20%)] via-[hsl(140,30%,18%)] to-[hsl(45,50%,18%)] shadow-xl">
            <div className="p-6 sm:p-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(45,80%,60%)]/40 bg-[hsl(45,80%,50%)]/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(45,80%,65%)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(45,80%,65%)]">
                  Health & Wellness • स्वास्थ्य उत्पाद
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(35,80%,50%)] to-[hsl(25,80%,40%)] text-5xl shadow-lg">
                  🌾
                </div>
                <div>
                  <h3 className="font-hindi text-2xl font-extrabold text-primary-foreground">
                    ऋषि भोग आटा
                  </h3>
                  <p className="text-sm font-semibold text-[hsl(45,80%,65%)]">Rishi Bhok Ata — Ayurvedic Wellness Flour</p>
                  <p className="mt-2 font-hindi text-sm text-primary-foreground/80 leading-relaxed">
                    <span className="font-bold text-[hsl(45,80%,70%)]">5-तत्व आयुर्वेदिक पाचन मिश्रण</span> — गेहूं, जौ, चना, मेथी और सोंठ का संतुलित मेल।
                    रोज़ाना सेवन से पाचन शक्ति बढ़ाएँ, ऊर्जा पाएँ।
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-[hsl(140,50%,25%)] text-[hsl(140,60%,75%)] border border-[hsl(140,50%,40%)]/40">100% प्राकृतिक</Badge>
                    <Badge className="bg-[hsl(45,40%,25%)] text-[hsl(45,80%,75%)] border border-[hsl(45,60%,40%)]/40">आयुर्वेदिक</Badge>
                    <Badge className="bg-[hsl(15,40%,25%)] text-[hsl(15,80%,75%)] border border-[hsl(15,60%,40%)]/40">पाचन सहायक</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">मूल्य</p>
                    <p className="font-hindi text-3xl font-extrabold text-[hsl(45,80%,65%)]">
                      ₹60<span className="text-sm font-semibold text-primary-foreground/60">/किलो</span>
                    </p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-[hsl(45,80%,45%)] to-[hsl(35,85%,45%)] text-[hsl(140,35%,12%)] hover:opacity-90 font-bold shadow-lg"
                    onClick={() => orderOnWhatsApp("ऋषि भोग आटा (₹60/किलो)")}
                  >
                    📱 अभी ऑर्डर करें
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Zero Waste Banner */}
          <div className="rounded-2xl border-2 border-[hsl(45,80%,50%)]/30 bg-gradient-to-r from-[hsl(140,25%,18%)] via-[hsl(140,20%,14%)] to-[hsl(45,30%,16%)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Recycle className="h-6 w-6 text-[hsl(140,60%,50%)]" />
              <h3 className="font-hindi text-xl font-extrabold text-primary-foreground">
                Zero Waste प्रक्रिया — <span className="text-[hsl(140,60%,50%)]">कुछ भी बर्बाद नहीं!</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {zeroWasteSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-xl bg-primary-foreground/5 p-4 text-center">
                  <span className="text-3xl">{step.emoji}</span>
                  <p className="font-hindi text-xs font-medium text-primary-foreground/80 leading-snug">{step.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center font-hindi text-xs text-[hsl(45,80%,60%)]">
              🌍 यह Integrated Farming Model भारत सरकार द्वारा प्रोत्साहित है। — Atmanirbhar Bharat 🇮🇳
            </p>
          </div>

          {/* Farmer Procurement Card */}
          <div className="mt-8 rounded-2xl border-2 border-[hsl(140,60%,40%)]/40 bg-gradient-to-r from-[hsl(140,40%,18%)] via-[hsl(140,35%,15%)] to-[hsl(45,40%,16%)] p-6 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(140,60%,35%)] to-[hsl(140,60%,25%)] shadow-lg">
                <Handshake className="h-7 w-7 text-[hsl(45,80%,70%)]" />
              </div>
              <div>
                <h3 className="font-hindi text-lg font-extrabold text-primary-foreground">
                  🤝 किसान भाइयों के लिए विशेष अवसर
                </h3>
                <p className="font-hindi text-sm text-primary-foreground/80 mt-1 leading-relaxed">
                  <span className="font-semibold text-[hsl(45,80%,65%)]">"किसान भाई अपना सामान नंदा एग्रो फार्म को बेचें — संपर्क करें।"</span>
                  <br />
                  उचित दाम, तुरंत भुगतान, और कोई बिचौलिया नहीं।
                </p>
              </div>
              <Button
                className="bg-[hsl(140,60%,35%)] hover:bg-[hsl(140,60%,45%)] text-primary-foreground font-bold shadow-lg"
                onClick={() => {
                  const msg = `नमस्ते नंदा एग्रो फार्म! मैं एक किसान हूँ और अपना सामान आपको बेचना चाहता हूँ। कृपया संपर्क करें। 🙏`;
                  window.open(`https://wa.me/${NANDA_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
              >
                📱 संपर्क करें
              </Button>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="mb-3 font-hindi text-sm text-primary-foreground/60">
              क्या आप भी किसान हैं? अपने फार्म को भारत दुकान पर रजिस्टर करें — बिल्कुल FREE!
            </p>
            <Link to="/kisan">
              <Button className="bg-[hsl(45,80%,45%)] text-[hsl(140,35%,12%)] hover:bg-[hsl(45,80%,55%)] font-bold text-base px-8 py-3 h-auto shadow-lg">
                🌾 किसान रजिस्ट्रेशन करें — FREE
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NandaFarmSection;
