import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, MessageCircle, Package } from "lucide-react";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  nameHindi: string;
  description: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  storeSlug: string;
  storeName: string;
  storeCity: string;
  storeAddress: string;
  storeWhatsapp: string;
}

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null }>;
      }).rpc("public_product_by_slug", { p_slug: slug });

      const row = data?.[0];
      if (!active) return;
      setProduct(
        row
          ? {
              id: String(row.id),
              slug: String(row.slug),
              name: String(row.name ?? ""),
              nameHindi: String(row.name_hindi ?? ""),
              description: String(row.description ?? ""),
              price: Number(row.price ?? 0),
              imageUrl: (row.image_url as string) ?? null,
              inStock: row.in_stock !== false,
              storeSlug: String(row.store_slug ?? ""),
              storeName: String(row.store_name ?? ""),
              storeCity: String(row.store_city ?? ""),
              storeAddress: String(row.store_address ?? ""),
              storeWhatsapp: String(row.store_whatsapp ?? ""),
            }
          : null,
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Seo
          title={`प्रोडक्ट नहीं मिला | ${SITE_NAME}`}
          description="यह प्रोडक्ट उपलब्ध नहीं है।"
          path={`/product/${slug ?? ""}`}
          noindex
        />
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">प्रोडक्ट नहीं मिला</h1>
          <Button onClick={() => navigate("/")} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> वापस जाएं
          </Button>
        </div>
      </div>
    );
  }

  const title = `${product.name} — ₹${product.price}${product.storeCity ? ` in ${product.storeCity}` : ""} | ${product.storeName}`;
  const description =
    product.description ||
    `${product.name} ₹${product.price} पर ${product.storeName}${product.storeCity ? `, ${product.storeCity}` : ""} से सीधे खरीदें। 0% कमीशन, WhatsApp पर ऑर्डर करें।`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.nameHindi || undefined,
    description,
    image: product.imageUrl || undefined,
    url: absoluteUrl(`/product/${product.slug}`),
    brand: { "@type": "Brand", name: product.storeName },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
      seller: { "@type": "LocalBusiness", name: product.storeName, address: product.storeAddress || undefined },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: product.storeName, item: absoluteUrl(`/store/${product.storeSlug}`) },
      { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/product/${product.slug}`) },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description={description}
        path={`/product/${product.slug}`}
        image={product.imageUrl ?? undefined}
        imageAlt={`${product.name} — ${product.storeName}, ${product.storeCity}`}
        type="product"

        jsonLd={[productLd, breadcrumb]}
      />
      <AppHeader />
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> वापस जाएं
        </Button>

        <Card className="overflow-hidden">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={`${product.name} — ${product.storeName} ${product.storeCity}`}
              className="h-56 w-full object-cover"
              loading="lazy"
            />
          )}
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            {product.nameHindi && <p className="font-hindi text-muted-foreground">{product.nameHindi}</p>}
            <p className="mt-2 text-xl font-bold text-saffron">₹{product.price}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.inStock ? "उपलब्ध है (In stock)" : "अभी उपलब्ध नहीं (Out of stock)"}
            </p>

            {product.description && <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>}

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-saffron" />
              <Link to={`/store/${product.storeSlug}`} className="underline">
                {product.storeName}
              </Link>
              {product.storeCity ? `, ${product.storeCity}` : ""}
            </div>

            <Button
              onClick={() =>
                window.open(
                  `https://wa.me/${product.storeWhatsapp}?text=${encodeURIComponent(
                    `नमस्ते! मुझे "${product.name}" (₹${product.price}) चाहिए — मेरा भारत दुकान से।`,
                  )}`,
                  "_blank",
                )
              }
              size="lg"
              className="mt-5 w-full bg-green-india font-hindi text-base text-primary-foreground hover:bg-green-india/90"
            >
              <MessageCircle className="mr-2 h-5 w-5" /> व्हाट्सएप पर ऑर्डर करें
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductPage;
