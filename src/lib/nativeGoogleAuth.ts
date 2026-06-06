import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import type { GoogleLoginResponse, LoginResult } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";
import { toast } from "sonner";

// Google Sign-In configuration for native Android.
//
// IMPORTANT: The @capgo/capacitor-social-login plugin (and Google's native
// GoogleSignIn SDK) requires the WEB Client ID to be passed as `webClientId`.
// That is the audience for the returned `idToken` that we exchange with the
// backend. The Android Client ID is matched automatically by Google Play
// Services using the app's package name + SHA-1 fingerprint - it is NOT
// passed to the plugin, but it MUST exist in Google Cloud Console.
//
// Web Client ID (OAuth client_type: 3) - used as `webClientId`:
//   822103899326-5d5k2a6h1r7c1em3fgvcinq6k7scfp3p.apps.googleusercontent.com
//
// Android Client ID (OAuth client_type: 1) - auto-matched by SHA-1, kept here
// for reference only:
//   822103899326-0b9oga5c5idh9vgtslgtghdjovc7rhj6.apps.googleusercontent.com
//
// Android package: com.merabharatdukaan.app
// SHA-1 fingerprint:
//   76:9F:2C:91:FA:7E:3C:2A:77:81:57:69:79:45:AA:9D:F3:57:81:05
//
// Setup checklist if Google Sign-In still cancels/fails:
// 1) Google Cloud Console > Credentials > Android OAuth Client:
//    - Package name: com.merabharatdukaan.app
//    - SHA-1: 76:9F:2C:91:FA:7E:3C:2A:77:81:57:69:79:45:AA:9D:F3:57:81:05
// 2) Google Cloud Console > Credentials > Web OAuth Client:
//    - Copy its Client ID into GOOGLE_WEB_CLIENT_ID below.
// 3) Firebase Console > Project Settings > Android app:
//    - Add the same SHA-1.
//    - Download updated google-services.json into android/app/.
// 4) Backend Google provider settings:
//    - Use the SAME Web Client ID as GOOGLE_WEB_CLIENT_ID below,
//      otherwise backend token exchange fails with audience errors.
const GOOGLE_WEB_CLIENT_ID =
  "822103899326-5d5k2a6h1r7c1em3fgvcinq6k7scfp3p.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  "822103899326-0b9oga5c5idh9vgtslgtghdjovc7rhj6.apps.googleusercontent.com";
// Exported for diagnostics / debug screens. The plugin does not need it.
export { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID };

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
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
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

const readErrorInfo = (error: unknown) => {
  const source = typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {};
  return {
    code: String(source.code || source.errorCode || source.statusCode || ""),
    message: String(source.message || source.errorMessage || error || ""),
  };
};

const isUserCancelledGoogleSignIn = (error: unknown) => {
  const { code: rawCode, message: rawMessage } = readErrorInfo(error);
  const code = rawCode.toUpperCase();
  const message = rawMessage.toLowerCase();
  return (
    code === "USER_CANCELLED" ||
    code === "CANCELED" ||
    code === "CANCELLED" ||
    code === "12501" ||
    code === "16" ||
    message.includes("user_cancelled") ||
    message.includes("cancelled") ||
    message.includes("canceled") ||
    message.includes("cancel") ||
    message.includes("closed") ||
    message.includes("dismiss")
  );
};

const readGoogleProfile = (result: GoogleLoginResponse) => {
  if (result.responseType !== "online") {
    return { id: null, email: null, name: null, givenName: null, familyName: null, photoUrl: null };
  }
  const profile = result.profile;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    givenName: profile.givenName,
    familyName: profile.familyName,
    photoUrl: profile.imageUrl,
  };
};

export async function signInWithGoogleNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await ensureGoogleInitialized();

    const rawNonce = getUrlSafeNonce();
    const nonceDigest = await sha256Hex(rawNonce);

    let login: LoginResult | null;
    try {
      login = await SocialLogin.login({
        provider: "google",
        options: {
          scopes: ["email", "profile"],
          nonce: nonceDigest,
          style: "bottom",
          filterByAuthorizedAccounts: false,
          autoSelectEnabled: false,
        },
      });
    } catch (error: unknown) {
      if (isUserCancelledGoogleSignIn(error)) {
        console.info("[native-google] user cancelled the sign-in picker");
        toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
        return false;
      }
      const { code, message } = readErrorInfo(error);
      console.error("[native-google] plugin error", { code, message, error });
      throw new NativeGoogleAuthError(
        message || "Google sign-in could not start. Please try again.",
        code || "GOOGLE_PLUGIN_FAILED",
      );
    }

    // Defensive null-check: some plugin versions resolve with null on silent cancel.
    if (!login || login.provider !== "google" || !login.result) {
      console.warn("[native-google] empty login result - treating as cancellation", login);
      toast.message("Google Sign-In cancelled. कृपया दोबारा प्रयास करें।");
      return false;
    }

    const result = login.result;
    const idToken = result.responseType === "online" ? result.idToken : null;
    if (!idToken) {
      throw new NativeGoogleAuthError(
        "Google did not return an ID token. Check SHA-1 fingerprint and Web Client ID in Google/Firebase settings.",
        "NO_ID_TOKEN",
      );
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

    // Save user data only after backend session creation succeeds.
    const profile = readGoogleProfile(result);
    const googleUser = {
      ...profile,
      backendUserId: data.user?.id ?? data.session.user.id,
      idToken,
      accessToken: result.responseType === "online" ? result.accessToken?.token ?? null : null,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(GOOGLE_USER_CACHE_KEY, JSON.stringify(googleUser));
    } catch (storageErr) {
      console.warn("[native-google] could not cache user", storageErr);
    }

    return true;
  } catch (error: unknown) {
    if (isUserCancelledGoogleSignIn(error)) {
      toast.message("Google Sign-In cancelled. कृपया दोबारा प्रयास करें।");
      return false;
    }
    if (error instanceof NativeGoogleAuthError) throw error;
    // Final safety net - never crash the caller.
    console.error("[native-google] unexpected error", error);
    const { code, message } = readErrorInfo(error);
    throw new NativeGoogleAuthError(
      message || "Unexpected error during Google Sign-In.",
      code,
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