import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKETS = ["kyc-photos", "blood-proof"] as const;
type PrivateBucket = (typeof PRIVATE_BUCKETS)[number];

/**
 * Extracts the object path from a stored Supabase storage URL.
 * Works for both `/object/public/<bucket>/...` and `/object/sign/<bucket>/...` styles,
 * and also tolerates the bare path being stored.
 */
export function extractStoragePath(rawUrl: string | null | undefined, bucket: string): string | null {
  if (!rawUrl) return null;
  const publicMarker = `/object/public/${bucket}/`;
  const signMarker = `/object/sign/${bucket}/`;
  let path = rawUrl;
  if (rawUrl.includes(publicMarker)) {
    path = rawUrl.split(publicMarker)[1] ?? "";
  } else if (rawUrl.includes(signMarker)) {
    path = rawUrl.split(signMarker)[1] ?? "";
  } else if (rawUrl.startsWith(`${bucket}/`)) {
    path = rawUrl.slice(bucket.length + 1);
  }
  path = path.split("?")[0];
  return path || null;
}

/**
 * Convert a stored URL/path for a private bucket into a fresh signed URL.
 * Returns the original URL if the bucket isn't private (no signing needed).
 */
export async function toViewableUrl(
  rawUrl: string | null | undefined,
  bucket: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!rawUrl) return null;
  if (!PRIVATE_BUCKETS.includes(bucket as PrivateBucket)) return rawUrl;
  const path = extractStoragePath(rawUrl, bucket);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** React hook: resolves a stored URL into a viewable (signed if private) URL. */
export function useSignedUrl(rawUrl: string | null | undefined, bucket: string, expiresInSeconds = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!rawUrl) {
      setUrl(null);
      return;
    }
    toViewableUrl(rawUrl, bucket, expiresInSeconds).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [rawUrl, bucket, expiresInSeconds]);
  return url;
}