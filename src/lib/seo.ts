export const SITE_URL = "https://shop.mbdbusinesshub.in";
export const SITE_NAME = "Mera Bharat Dukaan";

export const slugify = (input: string) =>
  (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "item";

export const shopSlug = (name: string, city?: string) => slugify(`${name} ${city ?? ""}`.trim());

export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const truncate = (text: string, max = 155) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
