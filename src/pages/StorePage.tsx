import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sampleShops } from "@/data/sampleShops";
import Seo from "@/components/Seo";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, MessageCircle, Navigation, Phone, ShieldCheck, Star, Store } from "lucide-react";
import { absoluteUrl, shopSlug, SITE_NAME } from "@/lib/seo";

interface PublicStore {
  id: string;
  slug: string;
  name: string;
  nameHindi: string;
  category: string;
  description: string;
  address: string;
  city: string;
  pincode?: string;
  phone: string;
  whatsapp: string;
  photos: string[];
  lat?: number;
  lng?: number;
  isVerified: boolean;
  isPremium: boolean;
  isGolden: boolean;
  rating: number;
  reviewCount: number;
}

interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);

      const sample = sampleShops.find((s) => shopSlug(s.name, s.city) === slug || s.id === slug);
      if (sample) {
        if (!active) return;
        setStore({
          id: sample.id,
          slug: shopSlug(sample.name, sample.city),
          name: sample.name,
          nameHindi: sample.nameHindi,
          category: sample.category,
          description: sample.description,
          address: sample.address,
          city: sample.city,
          pincode: sample.pincode,
          phone: sample.phone,
          whatsapp: sample.whatsapp,
          photos: sample.photos,
          lat: sample.lat,
          lng: sample.lng,
          isVerified: sample.verified,
          isPremium: !!sample.premium,
          isGolden: false,
          rating: sample.rating,
          reviewCount: sample.reviewCount,
        });
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null }>;
      }).rpc("public_store_by_slug", { p_slug: slug });

      const row = data?.[0];
      if (!active) return;
      if (!row) {
        setStore(null);
        setLoading(false);
        return;
      }

      setStore({
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.shop_name ?? ""),
        nameHindi: String(row.shop_name_hindi ?? ""),
        category: String(row.category ?? ""),
        description: String(row.description ?? ""),
        address: String(row.address ?? ""),
        city: String(row.city ?? ""),
        pincode: (row.pincode as string) ?? undefined,
        phone: String(row.phone ?? ""),
        whatsapp: String(row.whatsapp ?? row.phone ?? ""),
        photos: (row.photos as string[]) ?? [],
        lat: (row.latitude as number) ?? undefined,
        lng: (row.longitude as number) ?? undefined,
        isVerified: !!row.is_verified,
        isPremium: !!row.is_premium,
        isGolden: !!row.is_big_merchant,
        rating: Number(row.rating ?? 0),
        reviewCount: Number(row.review_count ?? 0),
      });

      const { data: prodData } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null }>;
      }).rpc("public_store_products", { p_store_id: row.id });

      if (!active) return;
      setProducts(
        (prodData ?? []).map((p) => ({
          id: String(p.id),
          slug: String(p.slug),
          name: String(p.name ?? ""),
          price: Number(p.price ?? 0),
          image_url: (p.image_url as string) ?? null,
          description: (p.description as string) ?? null,
        })),
      );
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Seo
          title={`दुकान नहीं मिली | ${SITE_NAME}`}
          description="यह दुकान उपलब्ध नहीं है। मेरा भारत दुकान पर अपने शहर की सत्यापित दुकानें खोजें।"
          path={`/store/${slug ?? ""}`}
          noindex
        />
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">दुकान नहीं मिली</h1>
          <p className="mt-2 text-muted-foreground">Shop not found</p>
          <Button onClick={() => navigate("/")} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> वापस जाएं
          </Button>
        </div>
      </div>
    );
  }

  const locationLabel = [store.city, store.pincode].filter(Boolean).join(" ");
  const title = `${store.name}${store.city ? ` — ${store.category || "दुकान"} in ${store.city}` : ""} | ${SITE_NAME}`;
  const description =
    store.description ||
    `${store.name}, ${store.category || "local shop"} ${store.city ? `in ${store.city}` : ""}. पता: ${store.address}. सीधे WhatsApp या कॉल पर ऑर्डर करें — 0% कमीशन।`;

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    alternateName: store.nameHindi || undefined,
    description,
    image: store.photos.length ? store.photos : undefined,
    url: absoluteUrl(`/store/${store.slug}`),
    telephone: store.phone ? `+${store.phone.replace(/^\+/, "")}` : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address || undefined,
      addressLocality: store.city || undefined,
      postalCode: store.pincode || undefined,
      addressCountry: "IN",
    },
    geo:
      store.lat && store.lng
        ? { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng }
        : undefined,
    aggregateRating:
      store.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: store.rating,
            reviewCount: store.reviewCount,
          }
        : undefined,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Stores", item: absoluteUrl("/stores") },
      { "@type": "ListItem", position: 3, name: store.name, item: absoluteUrl(`/store/${store.slug}`) },
    ],
  };

  const handleWhatsApp = () => {
    const message = `नमस्ते! मैं मेरा भारत दुकान से आया/आई हूँ। मुझे "${store.name}" से सामान चाहिए।`;
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description={description}
        path={`/store/${store.slug}`}
        image={store.photos[0]}
        type="profile"
        jsonLd={[localBusiness, breadcrumb]}
      />
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> वापस जाएं
        </Button>

        <Card className={`overflow-hidden ${store.isGolden ? "ring-2 ring-yellow-500" : store.isPremium ? "ring-2 ring-saffron" : ""}`}>
          {store.photos.length > 0 && (
            <div className="h-48 overflow-hidden bg-muted">
              <img src={store.photos[0]} alt={`${store.name} — ${store.category} ${store.city}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{store.name}</h1>
                  {store.isVerified && <ShieldCheck className="h-6 w-6 text-green-india" />}
                </div>
                {store.nameHindi && <p className="font-hindi text-lg text-muted-foreground">{store.nameHindi}</p>}
                {store.reviewCount > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-saffron text-saffron" /> {store.rating} ({store.reviewCount})
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {store.isGolden && <Badge className="bg-yellow-500 text-black font-bold">👑 Golden Merchant</Badge>}
                {store.category && <Badge variant="secondary">{store.category}</Badge>}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 shrink-0 text-saffron" />
              <span>
                {store.address}
                {locationLabel ? `, ${locationLabel}` : ""}
              </span>
            </div>

            {store.description && <p className="mb-6 text-sm text-muted-foreground">{store.description}</p>}

            <Button
              onClick={handleWhatsApp}
              size="lg"
              className="mb-3 w-full bg-green-india font-hindi text-base text-primary-foreground hover:bg-green-india/90"
            >
              <MessageCircle className="mr-2 h-5 w-5" /> व्हाट्सएप पर बात करें
            </Button>

            <div className="flex gap-2">
              <Button onClick={() => window.open(`tel:+${store.phone}`)} variant="outline" className="flex-1">
                <Phone className="mr-1 h-4 w-4" /> कॉल करें
              </Button>
              {store.lat && store.lng && (
                <Button
                  onClick={() =>
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`, "_blank")
                  }
                  variant="outline"
                  className="flex-1"
                >
                  <Navigation className="mr-1 h-4 w-4" /> रास्ता देखें
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {products.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-foreground">
              {store.name} के प्रोडक्ट्स
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                    {p.image_url && (
                      <img src={p.image_url} alt={`${p.name} — ${store.name}`} className="h-28 w-full object-cover" loading="lazy" />
                    )}
                    <CardContent className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="mt-1 text-sm text-saffron">₹{p.price}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StorePage;
