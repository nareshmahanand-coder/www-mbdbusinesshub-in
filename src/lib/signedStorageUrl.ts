import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// All buckets are public per project decision — nothing is treated as private.
const PRIVATE_BUCKETS = new Set<string>();
const KNOWN_BUCKETS = ["kyc-photos", "blood-proof", "uploads", "skill-pdfs"];

/**
 * Detect which bucket a stored URL/path refers to. Returns null if it can't tell.
 */
function detectBucket(rawUrl: string, fallbackBucket?: string): string | null {
  for (const b of KNOWN_BUCKETS) {
    if (
      rawUrl.includes(`/object/public/${b}/`) ||
      rawUrl.includes(`/object/sign/${b}/`) ||
      rawUrl.includes(`/object/authenticated/${b}/`) ||
      rawUrl.startsWith(`${b}/`)
    ) {
      return b;
    }
  }
  return fallbackBucket ?? null;
}

/**
 * Extract the object path inside a given bucket from a Supabase storage URL.
 */
export function extractStoragePath(rawUrl: string | null | undefined, bucket: string): string | null {
  if (!rawUrl) return null;
  const markers = [
    `/object/public/${bucket}/`,
    `/object/sign/${bucket}/`,
    `/object/authenticated/${bucket}/`,
  ];
  let path: string | null = null;
  for (const m of markers) {
    if (rawUrl.includes(m)) {
      path = rawUrl.split(m)[1] ?? "";
      break;
    }
  }
  if (path === null && rawUrl.startsWith(`${bucket}/`)) {
    path = rawUrl.slice(bucket.length + 1);
  }
  if (path === null) return null;
  path = path.split("?")[0];
  return path || null;
}

/**
 * Convert a stored URL/path into a viewable URL.
 * - If it's in a public bucket, returns the original URL untouched.
 * - If it's in a private bucket, signs it (auto-detects the bucket from the URL).
 * - The `bucketHint` is used only when the URL is just a bare path with no bucket info.
 */
export async function toViewableUrl(
  rawUrl: string | null | undefined,
  bucketHint?: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!rawUrl) return null;
  const bucket = detectBucket(rawUrl, bucketHint);
  if (!bucket) return rawUrl; // unknown — best effort, return as-is
  if (!PRIVATE_BUCKETS.has(bucket)) return rawUrl;
  const path = extractStoragePath(rawUrl, bucket);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** React hook: resolves a stored URL into a viewable (signed if private) URL. */
export function useSignedUrl(rawUrl: string | null | undefined, bucketHint?: string, expiresInSeconds = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!rawUrl) {
      setUrl(null);
      return;
    }
    toViewableUrl(rawUrl, bucketHint, expiresInSeconds).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [rawUrl, bucketHint, expiresInSeconds]);
  return url;
}