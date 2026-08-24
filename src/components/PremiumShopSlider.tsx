import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Crown, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumShop {
  id: string;
  shop_name: string;
  shop_name_hindi: string | null;
  category: string | null;
  city: string | null;
  whatsapp: string | null;
  phone: string | null;
  photos: string[];
  description: string | null;
  is_big_merchant?: boolean | null;
}

interface PremiumShopSliderProps {
  rotationSpeed?: number; // in milliseconds
}

const PremiumShopSlider = ({ rotationSpeed = 5000 }: PremiumShopSliderProps) => {
  const [shops, setShops] = useState<PremiumShop[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("merchant_profiles")
        .select("id, shop_name, shop_name_hindi, category, city, whatsapp, phone, photos, description, is_big_merchant")
        .eq("is_premium", true)
        .eq("is_verified", true)
        // Golden Merchant shops always lead the premium rotation.
        .order("is_big_merchant", { ascending: false })
        .order("premium_start_date", { ascending: false });

      if (data) {
        setShops(data.map(d => ({ ...d, photos: (d.photos ?? []) as string[] })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % shops.length);
  }, [shops.length]);

  useEffect(() => {
    if (shops.length <= 1) return;
    const timer = setInterval(next, rotationSpeed);
    return () => clearInterval(timer);
  }, [shops.length, rotationSpeed, next]);

  if (loading) return null;
  if (shops.length === 0) return null;

  const shop = shops[current];
  const bgImage = shop.photos?.[0] || "/placeholder.svg";
  const waNumber = shop.whatsapp || shop.phone || "";
  const waMessage = encodeURIComponent(
    `नमस्ते 🙏 मैं Mera Bharat Dukaan पर आपकी दुकान "${shop.shop_name}" देख रहा/रही हूँ। कृपया जानकारी दें।`
  );

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">प्रीमियम दुकानें — Golden & Premium Merchants</h2>
      </div>

      <Link to={`/shop/${shop.id}`} className="block">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl shadow-lg group">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Merchant tier badge */}
          {shop.is_big_merchant ? (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,90%,50%)] px-3 py-1 shadow">
              <Crown className="h-3.5 w-3.5 text-[hsl(30,60%,15%)]" />
              <span className="text-[10px] font-extrabold text-[hsl(30,60%,15%)]">GOLDEN MERCHANT</span>
            </div>
          ) : (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1 shadow">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground" />
              <span className="text-[10px] font-bold text-accent-foreground">PREMIUM MERCHANT</span>
            </div>
          )}

          {/* WhatsApp button */}
          {waNumber && (
            <Button
              size="sm"
              className="absolute top-3 right-3 bg-[hsl(var(--green-india))] text-white hover:bg-[hsl(140,60%,30%)] shadow-lg z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`https://wa.me/91${waNumber.replace(/\D/g, "")}?text=${waMessage}`, "_blank");
              }}
            >
              <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
            </Button>
          )}

          {/* Shop info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">
              {shop.shop_name}
              {shop.shop_name_hindi && (
                <span className="ml-2 text-base font-normal text-white/80 font-hindi">{shop.shop_name_hindi}</span>
              )}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
              {shop.category && <span className="rounded bg-white/20 px-2 py-0.5">{shop.category}</span>}
              {shop.city && <span>📍 {shop.city}</span>}
            </div>
          </div>

          {/* Dot indicators */}
          {shops.length > 1 && (
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {shops.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                  className={`h-2 w-2 rounded-full transition-all ${i === current ? "bg-accent w-5" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default PremiumShopSlider;
