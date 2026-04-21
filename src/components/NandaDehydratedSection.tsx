import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, MessageCircle, Sparkles } from "lucide-react";

import tomato from "@/assets/nanda-dry-tomato.jpg";
import moringa from "@/assets/nanda-dry-moringa.jpg";
import longbean from "@/assets/nanda-dry-longbean.jpg";
import okra from "@/assets/nanda-dry-okra.jpg";
import karela from "@/assets/nanda-dry-karela.jpg";
import coriander from "@/assets/nanda-dry-coriander.jpg";
import chilli from "@/assets/nanda-dry-chilli.jpg";
import garlic from "@/assets/nanda-dry-garlic.jpg";
import ginger from "@/assets/nanda-dry-ginger.jpg";
import mixveg from "@/assets/nanda-dry-mixveg.jpg";

const NANDA_WHATSAPP = "918305161361";

interface DryProduct {
  id: string;
  hindi: string;
  english: string;
  image: string;
  tag: string;
}

const products: DryProduct[] = [
  { id: "dry-tomato",    hindi: "सूखा टमाटर",       english: "Tomato",            image: tomato,    tag: "Sun-Dried" },
  { id: "dry-moringa",   hindi: "सूखा मुनगा / मोरिंगा", english: "Drumstick / Moringa", image: moringa,   tag: "Superfood" },
  { id: "dry-longbean",  hindi: "सूखी बरबटी",        english: "Long Bean",         image: longbean,  tag: "Fiber Rich" },
  { id: "dry-okra",      hindi: "सूखी भिंडी",        english: "Okra / Lady's Finger", image: okra,    tag: "Vitamin C" },
  { id: "dry-karela",    hindi: "सूखा करेला",        english: "Bitter Gourd",      image: karela,    tag: "Diabetic Friendly" },
  { id: "dry-coriander", hindi: "सूखा धनिया",        english: "Coriander Leaf",    image: coriander, tag: "Aromatic" },
  { id: "dry-chilli",    hindi: "सूखी मिर्च",        english: "Red Chilli Powder", image: chilli,    tag: "Hand-Ground" },
  { id: "dry-garlic",    hindi: "सूखा लहसुन",        english: "Garlic Cloves",     image: garlic,    tag: "Immunity" },
  { id: "dry-ginger",    hindi: "सूखा अदरक",         english: "Ginger Powder",     image: ginger,    tag: "Digestive" },
  { id: "dry-mixveg",    hindi: "मिक्स सूखी सब्जी",   english: "Mix Veg Powder",    image: mixveg,    tag: "All-in-One" },
];

const order = (p: DryProduct) => {
  const msg = `नमस्ते Nanda Agro Farm! मुझे "${p.hindi}" (${p.english}) चाहिए। कृपया दाम और डिलीवरी की जानकारी दें। 🙏`;
  window.open(`https://wa.me/${NANDA_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
};

const NandaDehydratedSection = () => {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl border-2 border-[hsl(45,80%,50%)]/40 bg-gradient-to-br from-[hsl(140,30%,15%)] via-[hsl(140,25%,18%)] to-[hsl(45,40%,16%)] shadow-2xl">
      <div className="p-6 sm:p-8">
        {/* Section header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(45,80%,55%)]/40 bg-[hsl(45,80%,50%)]/10 px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 text-[hsl(45,80%,65%)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(45,80%,65%)]">
              New Premium Range • नई प्रीमियम रेंज
            </span>
          </div>
          <h3 className="font-hindi text-3xl font-extrabold text-primary-foreground">
            🌿 सूखी सब्जियां
          </h3>
          <p className="mt-1 text-sm font-semibold text-[hsl(45,80%,65%)]">
            Nanda Dehydrated Vegetables — Long shelf life, full nutrition
          </p>
          <p className="mt-2 max-w-xl mx-auto font-hindi text-xs text-primary-foreground/70 leading-relaxed">
            धूप में सुखाई गई शुद्ध सब्ज़ियाँ — कोई preservative नहीं, कोई chemical नहीं।
            <br />
            सालभर रखें, मिनटों में पकाएँ।
          </p>
        </div>

        {/* Product grid */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <Card
              key={p.id}
              className="group overflow-hidden border-[hsl(45,80%,50%)]/30 bg-[hsl(140,20%,10%)]/90 backdrop-blur transition-all hover:border-[hsl(45,80%,55%)]/70 hover:shadow-lg hover:shadow-[hsl(45,80%,50%)]/20"
            >
              <div className="relative aspect-square overflow-hidden bg-[hsl(140,15%,8%)]">
                <img
                  src={p.image}
                  alt={`${p.english} pouch — Nanda Agro Farm`}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <Badge className="absolute top-2 left-2 bg-[hsl(45,90%,50%)] text-[hsl(140,40%,12%)] text-[9px] font-bold px-1.5 py-0">
                  <Sparkles className="mr-0.5 h-2.5 w-2.5" /> Premium
                </Badge>
              </div>
              <CardContent className="p-3 space-y-2">
                <div>
                  <h4 className="font-hindi text-sm font-extrabold leading-tight text-primary-foreground line-clamp-2">
                    {p.hindi}
                  </h4>
                  <p className="text-[11px] font-semibold text-[hsl(45,80%,65%)] line-clamp-1">
                    {p.english}
                  </p>
                </div>
                <Badge variant="outline" className="border-[hsl(45,80%,50%)]/40 text-[9px] text-[hsl(45,80%,70%)] bg-transparent">
                  {p.tag}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => order(p)}
                  className="w-full h-8 bg-[hsl(140,60%,32%)] hover:bg-[hsl(140,60%,40%)] text-primary-foreground text-[11px] font-bold"
                >
                  <MessageCircle className="mr-1 h-3 w-3" />
                  WhatsApp Order
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-5 text-center text-[11px] text-primary-foreground/50">
          🌾 Sun-Dried • Zero Preservative • Direct from Bhilai Farm
        </p>
      </div>
    </div>
  );
};

export default NandaDehydratedSection;
