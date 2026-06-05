import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";
import { toast } from "sonner";

// MUST be the Web Client ID (client_type: 3) from the SAME Google Cloud
// project as android/app/google-services.json. The Android OAuth client
// (with this app's SHA-1) lives in project 36966220674, so Google Play
// Services will only mint ID tokens whose `aud` is this Web Client ID.
// Using a Web Client ID from a different project causes sign-in to fail
// with no idToken (login loop) or "Unacceptable audience" on the backend.
const GOOGLE_WEB_CLIENT_ID = "36966220674-2ddjv8kfhn91b2k93qqsb54muc5ilvf2.apps.googleusercontent.com";

let googleInitialized = false;
const GOOGLE_USER_CACHE_KEY = "mbd-google-user";

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
  try {
    await SocialLogin.initialize({
      google: { webClientId: GOOGLE_WEB_CLIENT_ID },
    });
    googleInitialized = true;
  } catch (err) {
    console.error("[native-google] initialize failed", err);
    throw new NativeGoogleAuthError(
      "Google Sign-In could not be initialized. Please restart the app and try again.",
      "INIT_FAILED",
    );
  }
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
export class NativeGoogleAuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export async function signInWithGoogleNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await ensureGoogleInitialized();

    const rawNonce = getUrlSafeNonce();
    const nonceDigest = await sha256Hex(rawNonce);

    let login: any;
    try {
      login = await SocialLogin.login({
        provider: "google",
        options: {
          scopes: ["email", "profile"],
          nonce: nonceDigest,
          forceRefreshToken: true,
        },
      });
    } catch (error: any) {
      const code = error?.code || "";
      const msg = String(error?.message || "");
      // Gracefully handle user cancellation - DO NOT crash or surface as error.
      if (
        code === "USER_CANCELLED" ||
        code === "CANCELED" ||
        code === "12501" ||
        /cancel/i.test(msg) ||
        /closed/i.test(msg) ||
        /dismiss/i.test(msg)
      ) {
        console.info("[native-google] user cancelled the sign-in picker");
        toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
        return false;
      }
      console.error("[native-google] plugin error", { code, msg, error });
      throw new NativeGoogleAuthError(
        msg || "Google sign-in could not start. Please try again.",
        code,
      );
    }

    // Defensive null-check: some plugin versions resolve with null on silent cancel.
    if (!login || login.provider !== "google" || !login.result) {
      console.warn("[native-google] empty login result - treating as cancellation", login);
      toast.message("Google Sign-In cancelled. कृपया दोबारा प्रयास करें।");
      return false;
    }

    const result = login.result;
    const idToken: string | undefined = result.idToken;
    if (!idToken) {
      throw new NativeGoogleAuthError(
        "Google did not return an ID token. Check SHA-1 fingerprint and Web Client ID in Firebase.",
        "NO_ID_TOKEN",
      );
    }

    // Persist Google profile locally for quick UI hydration.
    const profile = result.profile || {};
    const googleUser = {
      email: profile.email ?? null,
      name: profile.name ?? null,
      givenName: profile.givenName ?? null,
      familyName: profile.familyName ?? null,
      photoUrl: profile.imageUrl ?? profile.photoUrl ?? null,
      id: profile.id ?? null,
      idToken,
      accessToken: result.accessToken?.token ?? result.accessToken ?? null,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(GOOGLE_USER_CACHE_KEY, JSON.stringify(googleUser));
    } catch (storageErr) {
      console.warn("[native-google] could not cache user", storageErr);
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      console.error("[native-google] supabase exchange failed", error);
      throw new NativeGoogleAuthError(
        error?.message || "Backend session was not created.",
        "SUPABASE_EXCHANGE_FAILED",
      );
    }

    await persistNativeAuthSession(data.session);
    return true;
  } catch (error: any) {
    if (error instanceof NativeGoogleAuthError) throw error;
    // Final safety net - never crash the caller.
    console.error("[native-google] unexpected error", error);
    throw new NativeGoogleAuthError(
      error?.message || "Unexpected error during Google Sign-In.",
      error?.code,
    );
  }
}

export function getCachedGoogleUser() {
  try {
    const raw = localStorage.getItem(GOOGLE_USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCachedGoogleUser() {
  try {
    localStorage.removeItem(GOOGLE_USER_CACHE_KEY);
  } catch {
    /* noop */
  }
}