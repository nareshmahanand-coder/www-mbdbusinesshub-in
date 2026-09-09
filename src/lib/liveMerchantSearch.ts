import { expandQuery } from "@/data/categoryFields";
import type { Shop } from "@/data/sampleShops";

export interface LiveMerchantResult {
  id: string;
  name: string;
  nameHindi?: string;
  category?: string;
  address?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  photos?: string[];
  verified?: boolean;
  premium?: boolean;
  golden?: boolean;
  flagship?: boolean;
  description?: string;
  serviceTags?: string[];
  categoryDetails?: Record<string, unknown>;
  lat?: number;
  lng?: number;
}

const SEARCH_WORDS = [
  "दुकान", "shop", "merchant", "व्यापारी", "फार्म", "farm", "service", "सेवा",
  "चाहिए", "कहाँ", "कहां", "near", "पास", "auto", "ऑटो", "रिक्शा", "taxi",
  "टैक्सी", "travel", "ट्रेवल", "बाई", "maid", "plumber", "प्लंबर", "parlour",
  "पार्लर", "fish", "मछली", "meat", "मीट", "किराना", "vehicle", "गाड़ी",
];

const FILLER_WORDS = new Set([
  "मुझे", "एक", "कोई", "का", "की", "के", "है", "हैं", "में", "से", "और", "या",
  "चाहिए", "कहाँ", "कहां", "बताओ", "दिखाओ", "please", "need", "want", "show", "find",
  "where", "is", "the", "a", "an", "me", "near", "nearby", "boss", "जी",
]);

const BRAND_ALIASES: Record<string, string[]> = {
  "नंदा": ["nanda"],
  "एग्रो": ["agro"],
  "फार्म": ["farm"],
  "nanda": ["नंदा"],
  "agro": ["एग्रो"],
  "farm": ["फार्म"],
};

const normalize = (value: unknown): string => String(value ?? "")
  .toLowerCase()
  .replace(/[\-_./]+/g, " ")
  .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
  .replace(/\s+/g, " ")
  .trim();

const detailText = (details?: Record<string, unknown>): string => {
  if (!details) return "";
  return Object.values(details)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ");
};

const searchableText = (shop: LiveMerchantResult): string => normalize([
  shop.name,
  shop.nameHindi,
  shop.category,
  shop.address,
  shop.city,
  shop.description,
  ...(shop.serviceTags ?? []),
  detailText(shop.categoryDetails),
].filter(Boolean).join(" "));

const usefulTerms = (query: string): string[] => {
  const baseTerms = expandQuery(query).flatMap((term) => normalize(term).split(" "));
  const expanded = baseTerms.flatMap((term) => [term, ...(BRAND_ALIASES[term] ?? [])]);
  return [...new Set(expanded.filter((term) => term.length > 1 && !FILLER_WORDS.has(term)))];
};

const tier = (shop: LiveMerchantResult): number => shop.flagship ? 0 : shop.golden ? 1 : shop.premium ? 2 : 3;

const distance = (shop: LiveMerchantResult, location?: { lat: number; lng: number } | null): number => {
  if (!location || typeof shop.lat !== "number" || typeof shop.lng !== "number") return Number.MAX_SAFE_INTEGER;
  return Math.hypot(shop.lat - location.lat, shop.lng - location.lng);
};

const scoreShop = (shop: LiveMerchantResult, query: string): number => {
  const q = normalize(query);
  const name = normalize(shop.name);
  const hindiName = normalize(shop.nameHindi);
  const category = normalize(shop.category);
  const blob = searchableText(shop);
  const terms = usefulTerms(query);

  let score = 0;
  if (q && (name === q || hindiName === q || category === q)) score += 200;
  if (q && (name.includes(q) || hindiName.includes(q))) score += 120;
  if (q && category.includes(q)) score += 80;
  for (const term of terms) {
    if (name.includes(term) || hindiName.includes(term)) score += 30;
    else if (category.includes(term)) score += 20;
    else if (blob.includes(term)) score += 8;
  }
  return score;
};

export const isMerchantSearchQuery = (query: string, shops: LiveMerchantResult[]): boolean => {
  const q = normalize(query);
  if (SEARCH_WORDS.some((word) => q.includes(normalize(word)))) return true;
  return shops.some((shop) => scoreShop(shop, query) >= 30);
};

export const searchLiveMerchants = (
  query: string,
  shops: LiveMerchantResult[],
  location?: { lat: number; lng: number } | null,
  limit = 6,
): { results: LiveMerchantResult[]; exact: boolean } => {
  const scored = shops
    .map((shop) => ({ shop, score: scoreShop(shop, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || tier(a.shop) - tier(b.shop) || distance(a.shop, location) - distance(b.shop, location));

  if (!scored.length) return { results: [], exact: false };
  const bestScore = scored[0].score;
  const exact = bestScore >= 80;
  const minimum = exact ? Math.max(20, bestScore * 0.2) : 1;
  return { results: scored.filter(({ score }) => score >= minimum).slice(0, limit).map(({ shop }) => shop), exact };
};

export const sampleShopToLiveResult = (shop: Shop): LiveMerchantResult => ({
  id: shop.id,
  name: shop.name,
  nameHindi: shop.nameHindi,
  category: shop.category,
  address: shop.address,
  city: shop.city,
  phone: shop.phone,
  whatsapp: shop.whatsapp,
  photos: shop.photos,
  verified: shop.verified,
  premium: shop.premium,
  golden: shop.golden,
  flagship: shop.flagship,
  description: shop.description,
  categoryDetails: shop.categoryDetails,
  lat: shop.lat,
  lng: shop.lng,
});