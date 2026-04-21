import { ArrowLeft, MessageCircle, Phone, ShieldCheck, Sparkles, Crown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import garlicImg from "@/assets/nanda-garlic.png";
import attaImg from "@/assets/nanda-rishi-bhok-atta.png";
import chipsImg from "@/assets/nanda-chicken-chips.png";
import acquaImg from "@/assets/nanda-acqua.jpg";

const NANDA_WHATSAPP = "918305161361";

const HERO_MAP: Record<string, string> = {
  "nanda-garlic": garlicImg,
  "nanda-rishi-bhok-atta": attaImg,
  "nanda-chicken-chips": chipsImg,
  "nanda-acqua": acquaImg,
};

export interface NandaPortalShop {
  id: string;
  name: string;
  nameHindi: string;
  tagline?: string;
  priceLabel?: string;
  description: string;
  city: string;
  address: string;
}

const NandaPortalView = ({ shop }: { shop: NandaPortalShop }) => {
  const navigate = useNavigate();
  const hero = HERO_MAP[shop.id];

  const order = () => {
    const msg = `नमस्ते Nanda Agro Farm! मुझे "${shop.nameHindi}" चाहिए। कृपया दाम और डिलीवरी की जानकारी दें। 🙏`;
    window.open(`https://wa.me/${NANDA_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const call = () => window.open(`tel:+${NANDA_WHATSAPP}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(140,30%,12%)] via-[hsl(140,25%,16%)] to-[hsl(45,40%,16%)]">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> वापस
        </Button>

        {/* Flagship banner */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-[hsl(45,90%,55%)]/50 bg-[hsl(45,90%,50%)]/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-[hsl(45,90%,65%)]" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[hsl(45,90%,70%)]">
              Nanda Agro Farm • Flagship Premium
            </span>
          </div>
          <Badge className="bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,90%,50%)] text-[hsl(140,40%,12%)] text-[10px] font-bold">
            <ShieldCheck className="mr-1 h-3 w-3" /> Verified
          </Badge>
        </div>

        <Card className="overflow-hidden border-2 border-[hsl(45,80%,50%)]/40 bg-[hsl(140,20%,10%)]/90 backdrop-blur shadow-2xl">
          {hero && (
            <div className="relative aspect-square w-full overflow-hidden bg-[hsl(140,15%,8%)]">
              <img src={hero} alt={shop.name} className="h-full w-full object-contain" loading="eager" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(140,20%,10%)] to-transparent p-4">
                <Badge className="bg-[hsl(45,90%,50%)] text-[hsl(140,40%,12%)] font-bold">
                  <Sparkles className="mr-1 h-3 w-3" /> Premium Partner
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="space-y-4 p-6">
            <div>
              <h1 className="font-hindi text-3xl font-extrabold text-primary-foreground">{shop.nameHindi}</h1>
              <p className="text-sm font-semibold text-[hsl(45,90%,65%)]">{shop.name}</p>
              {shop.tagline && (
                <p className="mt-2 font-hindi text-sm text-primary-foreground/80">{shop.tagline}</p>
              )}
            </div>

            {shop.priceLabel && (
              <div className="rounded-xl border border-[hsl(45,80%,50%)]/30 bg-[hsl(45,80%,50%)]/10 p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60">मूल्य • Price</p>
                <p className="font-hindi text-2xl font-extrabold text-[hsl(45,90%,70%)]">{shop.priceLabel}</p>
              </div>
            )}

            <p className="font-hindi text-sm leading-relaxed text-primary-foreground/80">
              {shop.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-primary-foreground/60">
              <MapPin className="h-3.5 w-3.5 text-[hsl(45,90%,65%)]" />
              <span>{shop.address}, {shop.city}</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={order}
                className="flex-1 bg-gradient-to-r from-[hsl(140,60%,35%)] to-[hsl(140,60%,28%)] text-primary-foreground hover:opacity-90 font-bold shadow-lg"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp पर ऑर्डर करें
              </Button>
              <Button
                onClick={call}
                variant="outline"
                className="flex-1 border-[hsl(45,80%,55%)] text-[hsl(45,90%,70%)] hover:bg-[hsl(45,80%,50%)]/10"
              >
                <Phone className="mr-2 h-4 w-4" />
                Direct Call
              </Button>
            </div>

            <p className="pt-2 text-center text-[11px] text-primary-foreground/50">
              🌾 Zero Waste • 100% Organic • Farm Fresh — Bhilai, Chhattisgarh
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NandaPortalView;