import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";
// Google Sign-In configuration for native Android.
//
// Web Client ID (Google OAuth client_type: 3) — REQUIRED as `webClientId`
// for @capgo/capacitor-social-login. This is the audience for the idToken
// that Supabase verifies during signInWithIdToken.
//
// Verified Android signing certificate SHA-1:
//   76:9F:2C:91:FA:7E:3C:2A:77:81:57:69:79:45:AA:9D:F3:57:81:D5
// (must be registered on the Android OAuth client in Google Cloud Console,
//  matching package name `com.merabharatdukaan.app`).
//
// The Android Client ID itself is matched automatically by Google Play
// Services using package name + SHA-1, so it is NOT passed to the plugin.

export const GOOGLE_WEB_CLIENT_ID =
  "822103899326-5d5k2a6h1r7c1em3fgvcinq6k75cfg3p.apps.googleusercontent.com";

// Android Client ID (for reference / diagnostics only — never passed to plugin)
export const GOOGLE_ANDROID_CLIENT_ID =
  "822103899326-0b9oga5c5idh9vgtslgtghdjovc7rhj6.apps.googleusercontent.com";

export const GOOGLE_ANDROID_SHA1 =
  "76:9F:2C:91:FA:7E:3C:2A:77:81:57:69:79:45:AA:9D:F3:57:81:D5";

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
      },
    });
    googleInitialized = true;
  } catch (err) {
    console.error("[native-google] initialize failed", err);
    throw new Error("Google Sign-In could not be initialized. Please try again.");
  }
}

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
        forceRefreshToken: true,
      },
    });

    const result = (login?.result ?? {}) as Record<string, unknown>;
    const idToken =
      (result.idToken as string | undefined) ??
      ((result as { authentication?: { idToken?: string } }).authentication?.idToken);

    if (!idToken) {
      toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
      return false;
    }

    // Supabase login with Google ID Token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      console.error("Supabase error:", error);
      toast.message("Login failed. Please try again.");
      return false;
    }

    // Save session
    await persistNativeAuthSession(data.session);

    toast.message("Google से सफलतापूर्वक लॉगिन हो गया!");
    return true;

  } catch (error: any) {
    console.error("[native-google] error", error);

    if (error.message?.includes("cancel") || error.code === "USER_CANCELLED") {
      toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
      return false;
    }

    toast.message("Google Login में समस्या आई। कृपया दोबारा प्रयास करें।");
    return false;
  }
}