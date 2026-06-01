import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

const NATIVE_REDIRECT = "https://shop.mbdbusinesshub.in/login";

let listenerRegistered = false;

/**
 * Register a single global listener that catches the OAuth deep-link
 * (https://shop.mbdbusinesshub.in/...?code=...) coming back from
 * Chrome Custom Tabs into the native app, exchanges the code for a
 * Supabase session and closes the in-app browser.
 */
export function registerNativeOAuthDeepLink() {
  if (listenerRegistered) return;
  if (!Capacitor.isNativePlatform()) return;
  listenerRegistered = true;

  App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    try {
      const incoming = event.url || "";
      if (!incoming) return;
      const url = new URL(incoming);
      const code = url.searchParams.get("code");
      const hasAuthHash = (url.hash || "").includes("access_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(incoming);
        if (error) console.warn("[oauth] exchangeCodeForSession failed", error);
      } else if (hasAuthHash) {
        // Implicit flow fallback: parse tokens from the hash.
        const params = new URLSearchParams(url.hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
    } catch (err) {
      console.warn("[oauth] deep-link handler failed", err);
    } finally {
      try {
        await Browser.close();
      } catch {
        /* no-op */
      }
    }
  });
}

/**
 * Native Google sign-in: opens the OAuth URL in Chrome Custom Tabs
 * instead of the WebView (Google blocks OAuth in WebViews).
 * Returns true when the native flow was started; false to let the
 * caller fall back to the standard web flow.
 */
export async function signInWithGoogleNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: NATIVE_REDIRECT,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    console.error("[oauth] failed to build Google URL", error);
    return false;
  }

  await Browser.open({
    url: data.url,
    presentationStyle: "popover",
    windowName: "_self",
  });
  return true;
}