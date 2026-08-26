// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls public store/product routes from the backend via the public_seo_routes RPC.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://shop.mbdbusinesshub.in";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/services", changefreq: "daily", priority: "0.9" },
  { path: "/classifieds", changefreq: "daily", priority: "0.8" },
  { path: "/jobs", changefreq: "daily", priority: "0.8" },
  { path: "/matrimony", changefreq: "weekly", priority: "0.7" },
  { path: "/skills", changefreq: "weekly", priority: "0.6" },
  { path: "/membership", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/contact", changefreq: "yearly", priority: "0.3" },
];

function readEnv(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(".env"), "utf8");
    return Object.fromEntries(
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const idx = line.indexOf("=");
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^"|"$/g, "")];
        }),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

function slugify(input: string) {
  return (
    (input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const env = { ...readEnv(), ...process.env } as Record<string, string>;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(`${url}/rest/v1/rpc/public_seo_routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: "{}",
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { path: string; lastmod: string | null }[];
    return rows
      .filter((r) => typeof r?.path === "string" && r.path.startsWith("/"))
      .map((r) => ({
        path: r.path,
        lastmod: r.lastmod ? new Date(r.lastmod).toISOString().slice(0, 10) : undefined,
        changefreq: "weekly" as const,
        priority: r.path.startsWith("/store/") ? "0.8" : "0.7",
      }));
  } catch {
    return [];
  }
}

async function sampleShopEntries(): Promise<SitemapEntry[]> {
  try {
    const src = readFileSync(resolve("src/data/sampleShops.ts"), "utf8");
    const names = [...src.matchAll(/\n\s*name:\s*"([^"]+)"/g)].map((m) => m[1]);
    const cities = [...src.matchAll(/\n\s*city:\s*"([^"]+)"/g)].map((m) => m[1]);
    return names.map((name, i) => ({
      path: `/store/${slugify(`${name} ${cities[i] ?? ""}`.trim())}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    }));
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const dynamicEntries = [...(await sampleShopEntries()), ...(await fetchDynamicEntries())];
const seen = new Set<string>();
const entries = [...staticEntries, ...dynamicEntries].filter((e) => {
  if (seen.has(e.path)) return false;
  seen.add(e.path);
  return true;
});

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
