import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import LocationSearchBar from "@/components/LocationSearchBar";
import PremiumShopSlider from "@/components/PremiumShopSlider";
import { sampleShops } from "@/data/sampleShops";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LocateFixed, MapPin, Navigation, Search, ShieldCheck, Star, Store } from "lucide-react";
import { toast } from "sonner";

interface NearbyShop {
  id: string;
  shop_name: string;
  shop_name_hindi?: string | null;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_premium?: boolean | null;
  is_verified?: boolean | null;
  distanceKm?: number | null;
  avgRating?: number;
  reviewCount?: number;
}

interface ShopRating {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
}

const toRad = (value: number) => (value * Math.PI) / 180;

const distanceKm = (fromLat: number, fromLng: number, toLat?: number | null, toLng?: number | null) => {
  if (toLat == null || toLng == null) return null;
  const earthKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ServicesPage = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("All");
  const [activeCity, setActiveCity] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [ratings, setRatings] = useState<ShopRating[]>([]);

  useEffect(() => {
    loadShops();
    loadRatings();
    detectLocation(true);
  }, []);

  const loadShops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("merchant_profiles")
      .select("id, shop_name, shop_name_hindi, category, city, address, pincode, latitude, longitude, is_premium, is_verified")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) toast.error("Shops could not be loaded");

    const registeredShops: NearbyShop[] = (data || []).map((shop) => ({ ...shop, is_premium: !!shop.is_premium }));
    const flagshipShops: NearbyShop[] = sampleShops.map((shop) => ({
      id: shop.id,
      shop_name: shop.name,
      shop_name_hindi: shop.nameHindi,
      category: shop.category,
      city: shop.city,
      address: shop.address,
      pincode: shop.pincode,
      latitude: shop.lat,
      longitude: shop.lng,
      is_premium: !!shop.premium,
      is_verified: shop.verified,
    }));

    setShops([...flagshipShops, ...registeredShops]);
    setLoading(false);
  };

  const loadRatings = async () => {
    const { data } = await supabase.from("shop_ratings" as any).select("id, shop_id, user_id, rating");
    setRatings((data as unknown as ShopRating[]) || []);
  };

  const detectLocation = (silent = false) => {
    if (!("geolocation" in navigator)) {
      if (!silent) toast.error("GPS is not available on this device");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setActiveCity("");
        setLocating(false);
        if (!silent) toast.success("Nearby shops updated from your GPS location");
      },
      () => {
        setLocating(false);
        if (!silent) toast.error("Location permission is needed for 10km nearby results");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const applyCitySearch = () => {
    setActiveCity(locationSearch === "All" ? "" : locationSearch.trim());
    if (locationSearch !== "All" && locationSearch.trim()) toast.success(`Showing shops for ${locationSearch.trim()}`);
  };

  const rateShop = async (shopId: string, rating: number) => {
    if (!user) { toast.info("Please login to rate a shop"); return; }
    const { error } = await supabase.from("shop_ratings" as any).upsert({ shop_id: shopId, user_id: user.id, rating }, { onConflict: "shop_id,user_id" });
    if (error) toast.error("Rating could not be saved");
    else { toast.success("Shop rating saved"); await loadRatings(); }
  };

  const visibleShops = useMemo(() => {
    const query = activeCity.trim().toLowerCase();
    const categoryQuery = search.trim().toLowerCase();
    const ratingStats = ratings.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
      acc[item.shop_id] = acc[item.shop_id] || { total: 0, count: 0 };
      acc[item.shop_id].total += item.rating;
      acc[item.shop_id].count += 1;
      return acc;
    }, {});
    const withDistance = shops.map((shop) => ({
      ...shop,
      distanceKm: userLocation ? distanceKm(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : null,
      avgRating: ratingStats[shop.id] ? ratingStats[shop.id].total / ratingStats[shop.id].count : 0,
      reviewCount: ratingStats[shop.id]?.count || 0,
    }));

    const locationFiltered = query
      ? withDistance.filter((shop) => [shop.shop_name, shop.shop_name_hindi, shop.category, shop.city, shop.address, shop.pincode].some((value) => value?.toLowerCase().includes(query)))
      : userLocation
        ? withDistance.filter((shop) => shop.distanceKm == null || shop.distanceKm <= 10)
        : withDistance;

    const filtered = categoryQuery ? locationFiltered.filter((shop) => [shop.shop_name, shop.shop_name_hindi, shop.category, shop.address].some((value) => value?.toLowerCase().includes(categoryQuery))) : locationFiltered;

    return filtered.sort((a, b) => {
      if (!!a.is_premium !== !!b.is_premium) return a.is_premium ? -1 : 1;
      const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });
  }, [activeCity, ratings, search, shops, userLocation]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Store className="h-6 w-6 text-primary" /> नजदीकी दुकान — Nearby Shops
            </h1>
            <p className="text-sm text-muted-foreground">GPS-based live shopping directory within 10km</p>
          </div>
          <Button variant="outline" onClick={() => detectLocation()} disabled={locating}>
            <LocateFixed className="mr-1.5 h-4 w-4" /> {locating ? "Detecting..." : "Use GPS"}
          </Button>
        </div>

        <PremiumShopSlider />

        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search city or area — Pune, Bhilai, Risali..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && applyCitySearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={applyCitySearch}>Search</Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{visibleShops.length} shops found</Badge>
          {activeCity ? <span>Area: {activeCity}</span> : userLocation ? <span>Showing shops within 10km of your location</span> : <span>Showing all registered shops until GPS permission is allowed</span>}
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading live shops...</div>
        ) : visibleShops.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No nearby shops found for this location</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleShops.map((shop) => (
              <Card key={shop.id} className={shop.is_premium ? "ring-2 ring-saffron" : undefined}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-foreground">{shop.shop_name}</h2>
                      {shop.shop_name_hindi && <p className="font-hindi text-xs text-muted-foreground">{shop.shop_name_hindi}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {shop.is_premium && <Badge className="bg-accent text-accent-foreground">Premium</Badge>}
                      {shop.is_verified && <ShieldCheck className="h-4 w-4 text-green-india" />}
                    </div>
                  </div>

                  <Badge variant="secondary" className="mb-3">{shop.category || "Local Shop"}</Badge>
                  <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />{[shop.address, shop.city, shop.pincode].filter(Boolean).join(", ") || "Location available in profile"}</p>
                    <p className="flex items-center gap-2"><Navigation className="h-4 w-4 shrink-0 text-primary" />{shop.distanceKm == null ? "Distance calculating after GPS" : `${shop.distanceKm.toFixed(1)} km away`}</p>
                  </div>

                  <Button asChild className="w-full">
                    <Link to={`/shop/${shop.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage;