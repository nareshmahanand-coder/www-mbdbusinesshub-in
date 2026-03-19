import { Fish, Egg, Leaf, ArrowRight, Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const subCategories = [
  {
    icon: "🐟",
    lucideIcon: Fish,
    title: "ताज़ा मछली",
    titleEn: "Live Fish",
    desc: "तालाब से सीधा आपकी थाली तक — रोहू, कतला, मांगुर, तिलापिया",
    color: "from-[hsl(200,70%,45%)] to-[hsl(200,70%,35%)]",
  },
  {
    icon: "🐔",
    lucideIcon: Egg,
    title: "पोल्ट्री & मीट",
    titleEn: "Poultry & Meat",
    desc: "देसी मुर्गा, अंडे, बटेर — फार्म फ्रेश, एंटीबायोटिक फ्री",
    color: "from-[hsl(15,80%,50%)] to-[hsl(15,80%,40%)]",
  },
  {
    icon: "🌿",
    lucideIcon: Leaf,
    title: "ऑर्गेनिक पाउडर",
    titleEn: "Veggie Powders",
    desc: "मोरिंगा, करेला, पालक पाउडर — 100% ऑर्गेनिक, फार्म से सीधा",
    color: "from-[hsl(140,60%,35%)] to-[hsl(140,60%,25%)]",
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
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
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
                    onClick={() => {
                      const msg = `नमस्ते! मुझे नंदा एग्रो फार्म से "${cat.title}" चाहिए। कृपया डिलीवरी की जानकारी दें। 🙏`;
                      window.open(`https://wa.me/919876543230?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    📱 WhatsApp ऑर्डर करें
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                  {i < zeroWasteSteps.length - 1 && (
                    <ArrowRight className="hidden h-5 w-5 text-[hsl(45,80%,50%)]/50 sm:block absolute right-[-16px] top-1/2" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center font-hindi text-xs text-[hsl(45,80%,60%)]">
              🌍 यह Integrated Farming Model भारत सरकार द्वारा प्रोत्साहित है। — Atmanirbhar Bharat 🇮🇳
            </p>
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
