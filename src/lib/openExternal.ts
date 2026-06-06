import { Capacitor } from "@capacitor/core";

/**
 * Open a URL safely from inside the Capacitor WebView without freezing.
 * - On native Android, `window.open(url, '_blank')` is a no-op and PDFs
 *   served from arbitrary hosts often hang the WebView. We route PDFs
 *   through Google's gview so they render inline, and other URLs through
 *   a same-tab navigation that the AndroidManifest browser intent handles.
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  const isNative = Capacitor.isNativePlatform();
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (isNative && isPdf) {
    const viewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    window.location.href = viewer;
    return;
  }

  if (isNative) {
    window.location.href = url;
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}