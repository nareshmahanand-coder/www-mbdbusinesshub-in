import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";

const GOOGLE_WEB_CLIENT_ID = "36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com";

let googleInitialized = false;

const getUrlSafeNonce = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

async function ensureGoogleInitialized() {
  if (googleInitialized) return;
  await SocialLogin.initialize({
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      mode: "online",
    },
  });
  googleInitialized = true;
}

// Kept as a no-op for older startup code paths. Google auth is now fully
// native and does not use Chrome Custom Tabs or OAuth deep-link callbacks.
export function registerNativeOAuthDeepLink() {
  return;
}

/**
 * Native Google sign-in: opens Android's Google account picker (not Chrome),
 * then exchanges the returned Google ID token for the backend session.
 */
export async function signInWithGoogleNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await ensureGoogleInitialized();
    const rawNonce = getUrlSafeNonce();
    const nonceDigest = await sha256Hex(rawNonce);

    const login = await SocialLogin.login({
      provider: "google",
      options: {
        scopes: ["email", "profile"],
        nonce: nonceDigest,
        style: "bottom",
        filterByAuthorizedAccounts: false,
        autoSelectEnabled: false,
      },
    });

    if (login.provider !== "google" || login.result.responseType !== "online" || !login.result.idToken) {
      throw new Error("Google did not return an ID token.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: login.result.idToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      throw error || new Error("Backend session was not created.");
    }

    await persistNativeAuthSession(data.session);
    return true;
  } catch (error: any) {
    if (error?.code !== "USER_CANCELLED") {
      console.error("[native-google] sign-in failed", error);
    }
    return false;
  }
}