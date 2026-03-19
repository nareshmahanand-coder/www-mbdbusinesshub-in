import { useState, useMemo } from "react";
import { sampleShops, Shop } from "@/data/sampleShops";
import { MapPin, Navigation, Star, Leaf, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const NANDA_FARM_IDS = ["nf-1", "nf-2", "nf-3"];

const getPinStyle = (shop: Shop) => {
  const isNanda = NANDA_FARM_IDS.includes(shop.id);
  if (isNanda) return { color: "text-green-700", bg: "bg-green-600", ring: "ring-green-400", label: "🌿 Nanda Farm", size: "h-8 w-8" };
  if (shop.premium) return { color: "text-yellow-600", bg: "bg-gradient-to-br from-yellow-400 to-yellow-600", ring: "ring-yellow-300", label: "⭐ Premium", size: "h-6 w-6" };
  return { color: "text-blue-600", bg: "bg-blue-500", ring: "ring-blue-300", label: "Registered", size: "h-5 w-5" };
};

const ShopMap = () => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Group shops by approximate location for the visual map
  const shops = useMemo(() => sampleShops, []);

  // Bounding box for our registered shops
  const bounds = useMemo(() => {
    const lats = shops.map(s => s.lat);
    const lngs = shops.map(s => s.lng);
    return {
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
      minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
    };
  }, [shops]);

  const toPercent = (lat: number, lng: number) => {
    const padLat = (bounds.maxLat - bounds.minLat) * 0.1 || 0.5;
    const padLng = (bounds.maxLng - bounds.minLng) * 0.1 || 0.5;
    const x = ((lng - (bounds.minLng - padLng)) / ((bounds.maxLng + padLng) - (bounds.minLng - padLng))) * 100;
    const y = (1 - (lat - (bounds.minLat - padLat)) / ((bounds.maxLat + padLat) - (bounds.minLat - padLat))) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.success("📍 आपकी लोकेशन मिल गई!");
        },
        () => toast.error("लोकेशन एक्सेस नहीं मिला")
      );
    }
  };

  const handleViewRoute = (shop: Shop) => {
    // Only navigate to registered shops
    const isRegistered = sampleShops.some(s => s.id === shop.id);
    if (!isRegistered) {
      toast.error("यह दुकान भारत दुकान में रजिस्टर्ड नहीं है।");
      return;
    }

    toast.success("यह एक सत्यापित भारत दुकान है ✅", {
      description: `${shop.name} तक नेविगेशन शुरू हो रहा है...`,
      duration: 3000,
    });

    // Open Google Maps with directions
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : "";
    const dest = `${shop.lat},${shop.lng}`;
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${dest}`
      : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    window.open(url, "_blank");
  };

  return (
    <section className="relative z-10 bg-gradient-to-b from-muted/50 to-background py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-foreground">
            <MapPin className="mr-2 inline h-6 w-6 text-saffron" />
            भारत दुकान मैप
            <span className="ml-2 text-base font-normal text-muted-foreground">• Registered Shops Only</span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground font-hindi">
            सिर्फ रजिस्टर्ड और सत्यापित दुकानें दिखाई जाती हैं — कोई बाहरी पिन नहीं
          </p>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full bg-green-600 ring-2 ring-green-300" />
            <span className="text-xs font-semibold text-foreground">🌿 Nanda Farm (Flagship)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 ring-2 ring-yellow-300" />
            <span className="text-xs font-semibold text-foreground">⭐ Premium (₹99/₹999)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full bg-blue-500 ring-2 ring-blue-300" />
            <span className="text-xs font-semibold text-foreground">📍 Registered Shop</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleGetLocation} className="text-xs">
            <Navigation className="mr-1 h-3 w-3" /> मेरी लोकेशन
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative mx-auto aspect-[16/10] max-w-4xl overflow-hidden rounded-2xl border-2 border-border bg-gradient-to-br from-green-50 via-blue-50 to-amber-50 dark:from-green-950/30 dark:via-blue-950/30 dark:to-amber-950/30 shadow-xl">
          {/* Grid pattern for map feel */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />

          {/* India label */}
          <div className="absolute left-4 top-4 rounded-lg bg-background/80 px-3 py-1.5 backdrop-blur-sm border border-border">
            <span className="text-xs font-bold text-foreground">🇮🇳 भारत दुकान मैप</span>
            <p className="text-[10px] text-muted-foreground">{shops.length} रजिस्टर्ड दुकानें</p>
          </div>

          {/* User location pin */}
          {userLocation && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${toPercent(userLocation.lat, userLocation.lng).x}%`, top: `${toPercent(userLocation.lat, userLocation.lng).y}%` }}
            >
              <div className="relative">
                <span className="absolute -inset-3 animate-ping rounded-full bg-blue-400/40" />
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white ring-2 ring-white shadow-lg">
                  You
                </span>
              </div>
            </div>
          )}

          {/* Shop Pins — ONLY registered shops */}
          {shops.map((shop) => {
            const pos = toPercent(shop.lat, shop.lng);
            const pin = getPinStyle(shop);
            const isNanda = NANDA_FARM_IDS.includes(shop.id);

            return (
              <button
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all hover:z-30 hover:scale-125 ${
                  selectedShop?.id === shop.id ? "z-30 scale-125" : ""
                }`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={shop.name}
              >
                <div className={`relative flex ${pin.size} items-center justify-center rounded-full ${pin.bg} text-white ring-2 ${pin.ring} shadow-lg ${isNanda ? "animate-pulse" : ""}`}>
                  {isNanda ? <Leaf className="h-4 w-4" /> : shop.premium ? <Star className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                </div>
                {isNanda && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-green-700 px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
                    Nanda Farm
                  </span>
                )}
              </button>
            );
          })}

          {/* Selected Shop Popup */}
          {selectedShop && (
            <div className="absolute bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4">
              <button
                onClick={() => setSelectedShop(null)}
                className="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getPinStyle(selectedShop).bg} text-white ring-2 ${getPinStyle(selectedShop).ring}`}>
                  {NANDA_FARM_IDS.includes(selectedShop.id) ? <Leaf className="h-5 w-5" /> : selectedShop.premium ? <Star className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="truncate text-sm font-bold text-foreground">{selectedShop.name}</h4>
                    {selectedShop.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-green-india" />}
                  </div>
                  <p className="font-hindi text-xs text-muted-foreground">{selectedShop.nameHindi}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedShop.address}, {selectedShop.city} - {selectedShop.pincode}</p>
                  <div className="mt-1 flex gap-1.5">
                    {selectedShop.premium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-[9px] text-white">⭐ Premium</Badge>
                    )}
                    {selectedShop.verified && (
                      <Badge variant="outline" className="border-green-india text-green-india text-[9px]">✅ Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleViewRoute(selectedShop)}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                >
                  <Navigation className="mr-1 h-3 w-3" />
                  View Route • रास्ता देखें
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const msg = `नमस्ते! मैं भारत दुकान मैप से आपकी दुकान "${selectedShop.name}" देख रहा/रही हूँ।`;
                    window.open(`https://wa.me/${selectedShop.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="text-xs border-green-india text-green-india hover:bg-green-india hover:text-white"
                >
                  WhatsApp
                </Button>
              </div>

              {/* Verified shop message */}
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-950/30 px-2 py-1.5 border border-green-200 dark:border-green-800">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                <p className="font-hindi text-[10px] text-green-700 dark:text-green-400">
                  यह एक सत्यापित भारत दुकान है • Coordinates from registration form
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <p className="mt-3 text-center text-[10px] text-muted-foreground font-hindi">
          🔒 दुकानदारों की लोकेशन सिर्फ उनके रजिस्ट्रेशन फॉर्म से ली गई है — कोई बाहरी ट्रैकिंग नहीं
        </p>
      </div>
    </section>
  );
};

export default ShopMap;
