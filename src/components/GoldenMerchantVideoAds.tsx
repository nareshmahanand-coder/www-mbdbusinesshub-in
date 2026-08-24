import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Volume2, VolumeX } from "lucide-react";

interface VideoAd {
  id: string;
  big_merchant_id: string | null;
  shop_name: string | null;
  city: string | null;
  category: string | null;
  video_ad_url: string | null;
}

/** Auto-playing 10-second video advertisement banner for Golden Merchants. */
const CLIP_SECONDS = 10;

const GoldenMerchantVideoAds = () => {
  const [ads, setAds] = useState<VideoAd[]>([]);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("golden_merchant_video_ads");
      if (!error && data) setAds(data as VideoAd[]);
    };
    void load();
  }, []);

  const next = useCallback(() => {
    setAds((list) => {
      if (list.length > 0) setCurrent((c) => (c + 1) % list.length);
      return list;
    });
  }, []);

  // Each clip plays for a maximum of 10 seconds, then rotates.
  useEffect(() => {
    if (ads.length === 0) return;
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    }
    const timer = setTimeout(next, CLIP_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [current, ads.length, next]);

  if (ads.length === 0) return null;
  const ad = ads[current];

  return (
    <section className="relative z-10 bg-background pt-6">
      <div className="container mx-auto px-4">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-[hsl(45,90%,50%)]" />
          <h3 className="text-lg font-bold text-foreground">
            Golden Merchant विज्ञापन{" "}
            <span className="font-hindi text-sm font-normal text-muted-foreground">• Video Ads</span>
          </h3>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-[hsl(45,90%,50%)] bg-black shadow-[0_0_24px_hsl(45,90%,55%,0.35)]">
          <video
            ref={videoRef}
            key={ad.id}
            src={ad.video_ad_url ?? undefined}
            className="h-44 w-full object-cover sm:h-64"
            autoPlay
            muted={muted}
            playsInline
            loop
            onEnded={next}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,90%,50%)] px-3 py-1 shadow">
            <Crown className="h-3.5 w-3.5 text-[hsl(30,60%,15%)]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[hsl(30,60%,15%)]">
              Golden Merchant
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Sound on" : "Sound off"}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow transition-transform hover:scale-105"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-bold text-primary-foreground drop-shadow">{ad.shop_name}</p>
              <p className="text-[11px] text-primary-foreground/80">
                {[ad.category, ad.city].filter(Boolean).join(" • ")}
              </p>
            </div>
            {ads.length > 1 && (
              <div className="flex gap-1.5">
                {ads.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ad ${i + 1}`}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === current ? "w-5 bg-[hsl(45,90%,55%)]" : "w-2 bg-primary-foreground/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoldenMerchantVideoAds;
