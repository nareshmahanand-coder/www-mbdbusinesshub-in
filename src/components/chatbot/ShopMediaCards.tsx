import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Crown, MapPin, MessageCircle, Phone, ShieldCheck, Store } from "lucide-react";
import type { LiveMerchantResult } from "@/lib/liveMerchantSearch";

export interface ShopMedia {
  id: string;
  shop_name: string | null;
  shop_name_hindi: string | null;
  city: string | null;
  category: string | null;
  photo_url: string | null;
  whatsapp: string | null;
  is_big_merchant: boolean | null;
  video_ad_url: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Photo + video-ad preview cards for shops mentioned by Bharat Mitra AI. */
const ShopMediaCards = ({ shopIds = [], liveShops, onNavigate }: { shopIds?: string[]; liveShops?: LiveMerchantResult[]; onNavigate?: () => void }) => {
  const [shops, setShops] = useState<ShopMedia[]>([]);
  const navigate = useNavigate();

  const ids = shopIds.filter((id) => UUID_RE.test(id));
  const key = ids.join(",");

  useEffect(() => {
    if (!key) {
      setShops([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc("shop_media_cards", { shop_ids: key.split(",") });
      if (!cancelled && !error && data) setShops(data as ShopMedia[]);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (liveShops?.length) {
    return (
      <div className="mt-2 space-y-2">
        {liveShops.map((shop) => {
          const contact = String(shop.whatsapp || shop.phone || "").replace(/\D/g, "").slice(-10);
          const photo = shop.photos?.[0];
          return (
            <article key={shop.id} className={`overflow-hidden rounded-lg border bg-card ${shop.golden || shop.flagship ? "border-warning shadow-sm" : shop.premium ? "border-accent" : "border-border"}`}>
              {photo && <img src={photo} alt={`${shop.nameHindi || shop.name} की फोटो`} loading="lazy" className="h-28 w-full object-cover" />}
              <div className="space-y-2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs font-bold text-foreground">
                      {shop.golden || shop.flagship ? <Crown className="h-3.5 w-3.5 shrink-0 text-warning" /> : <Store className="h-3.5 w-3.5 shrink-0 text-accent" />}
                      <span className="truncate">{shop.nameHindi || shop.name}</span>
                      {shop.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{shop.category || "स्थानीय सेवा"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-foreground">
                    {shop.golden || shop.flagship ? "Golden" : shop.premium ? "Premium" : "Free"}
                  </span>
                </div>
                {(shop.address || shop.city) && (
                  <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    {[shop.address, shop.city].filter(Boolean).join(", ")}
                  </p>
                )}
                {(shop.phone || shop.whatsapp) && <p className="text-[10px] font-semibold text-foreground">📞 {shop.phone || shop.whatsapp}</p>}
                <div className="grid grid-cols-3 gap-1.5">
                  {contact && (
                    <a href={`https://wa.me/91${contact}?text=${encodeURIComponent(`नमस्ते! मुझे ${shop.name} की जानकारी चाहिए।`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-md bg-success px-1.5 py-1.5 text-[9px] font-bold text-success-foreground">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  )}
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="flex items-center justify-center gap-1 rounded-md bg-primary px-1.5 py-1.5 text-[9px] font-bold text-primary-foreground">
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                  <button type="button" onClick={() => { onNavigate?.(); navigate(`/shop/${shop.id}`); }} className="rounded-md border border-border bg-background px-1.5 py-1.5 text-[9px] font-bold text-foreground">
                    Details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  const visible = shops.filter((s) => s.photo_url || s.video_ad_url);
  if (visible.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {visible.map((s) => (
        <div
          key={s.id}
          className={`overflow-hidden rounded-xl border bg-card ${
            s.is_big_merchant ? "border-[hsl(45,90%,50%)] shadow-[0_0_12px_hsl(45,90%,55%,0.3)]" : "border-border"
          }`}
        >
          {s.video_ad_url ? (
            <video
              src={s.video_ad_url}
              className="h-32 w-full bg-black object-cover"
              controls
              muted
              playsInline
              preload="metadata"
              poster={s.photo_url ?? undefined}
            />
          ) : (
            s.photo_url && (
              <img
                src={s.photo_url}
                alt={`${s.shop_name ?? "दुकान"} की फोटो`}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
            )
          )}

          <div className="flex items-center justify-between gap-2 p-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-xs font-bold text-foreground">
                {s.is_big_merchant ? (
                  <Crown className="h-3.5 w-3.5 shrink-0 text-[hsl(45,90%,45%)]" />
                ) : (
                  <Store className="h-3.5 w-3.5 shrink-0 text-accent" />
                )}
                {s.shop_name_hindi || s.shop_name}
              </p>
              <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {[s.category, s.city].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              {s.whatsapp && (
                <a
                  href={`https://wa.me/91${String(s.whatsapp).replace(/\D/g, "").slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[hsl(142,70%,40%)] p-1.5 text-primary-foreground"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  onNavigate?.();
                  navigate(`/shop/${s.id}`);
                }}
                className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground"
              >
                देखें
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopMediaCards;
