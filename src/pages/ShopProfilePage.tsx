import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleShops } from "@/data/sampleShops";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageCircle, ShieldCheck, ArrowLeft, Store, Navigation } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import NandaPortalView from "@/components/NandaPortalView";

interface ShopData {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  description: string;
  isPremium: boolean;
  isVerified: boolean;
  lat?: number;
  lng?: number;
  photos: string[];
}

const ShopProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      // Check sample shops first
      const sample = sampleShops.find((s) => s.id === id);
      if (sample) {
        setShop({
          id: sample.id,
          name: sample.name,
          nameHindi: sample.nameHindi,
          category: sample.category,
          address: sample.address,
          city: sample.city,
          phone: sample.phone,
          whatsapp: sample.whatsapp,
          description: sample.description,
          isPremium: !!sample.premium,
          isVerified: sample.verified,
          lat: sample.lat,
          lng: sample.lng,
          photos: sample.photos,
        });
        setLoading(false);
        return;
      }

      // Check DB
      const { data } = await supabase
        .from("merchant_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setShop({
          id: data.id,
          name: data.shop_name,
          nameHindi: data.shop_name_hindi || "",
          category: data.category || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || data.phone || "",
          description: data.description || "",
          isPremium: !!data.is_premium,
          isVerified: !!data.is_verified,
          lat: data.latitude ?? undefined,
          lng: data.longitude ?? undefined,
          photos: data.photos || [],
        });
      }
      setLoading(false);
    };
    fetchShop();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">दुकान नहीं मिली</h2>
          <p className="mt-2 text-muted-foreground">Shop not found</p>
          <Button onClick={() => navigate("/")} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> वापस जाएं
          </Button>
        </div>
      </div>
    );
  }

  // Nanda Agro Farm flagship units get a fully branded premium portal
  if (shop && shop.id.startsWith("nanda-")) {
    const sample = sampleShops.find((s) => s.id === shop.id);
    return (
      <NandaPortalView
        shop={{
          id: shop.id,
          name: shop.name,
          nameHindi: shop.nameHindi,
          tagline: sample?.tagline,
          priceLabel: sample?.priceLabel,
          description: shop.description,
          city: shop.city,
          address: shop.address,
        }}
      />
    );
  }

  const handleWhatsApp = () => {
    const message = `नमस्ते! मैं मेरा भारत दुकान से आया/आई हूँ। मुझे "${shop.name}" से कुछ सामान चाहिए। कृपया बताइए क्या उपलब्ध है।`;
    window.open(`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCall = () => window.open(`tel:+${shop.phone}`);

  const handleDirections = () => {
    if (shop.lat && shop.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> वापस जाएं
        </Button>

        <Card className={`overflow-hidden ${shop.isPremium ? "ring-2 ring-saffron" : ""}`}>
          {shop.photos.length > 0 && (
            <div className="h-48 overflow-hidden bg-muted">
              <img src={shop.photos[0]} alt={shop.name} className="h-full w-full object-cover" />
            </div>
          )}
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{shop.name}</h1>
                  {shop.isVerified && <ShieldCheck className="h-6 w-6 text-green-india" />}
                </div>
                {shop.nameHindi && (
                  <p className="font-hindi text-lg text-muted-foreground">{shop.nameHindi}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {shop.isPremium && (
                  <Badge className="bg-gradient-to-r from-saffron to-[hsl(35,90%,50%)] text-primary-foreground font-bold">
                    ⭐ Premium
                  </Badge>
                )}
                <Badge variant="secondary">{shop.category}</Badge>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 shrink-0 text-saffron" />
              <span>{shop.address}{shop.city ? `, ${shop.city}` : ""}</span>
            </div>

            {shop.description && (
              <p className="mb-6 text-sm text-muted-foreground">{shop.description}</p>
            )}

            {/* Prominent WhatsApp Button */}
            <Button
              onClick={handleWhatsApp}
              size="lg"
              className="mb-3 w-full bg-green-india text-primary-foreground hover:bg-green-india/90 font-hindi text-base"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              व्हाट्सएप पर बात करें
            </Button>

            <div className="flex gap-2">
              <Button onClick={handleCall} variant="outline" className="flex-1">
                <Phone className="mr-1 h-4 w-4" /> कॉल करें
              </Button>
              {shop.lat && shop.lng && (
                <Button onClick={handleDirections} variant="outline" className="flex-1">
                  <Navigation className="mr-1 h-4 w-4" /> रास्ता देखें
                </Button>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-center">
              <p className="font-hindi text-sm text-foreground">
                ✅ यह एक सत्यापित भारत दुकान है। 0% कमीशन पर सीधे दुकानदार से बात करें।
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopProfilePage;
