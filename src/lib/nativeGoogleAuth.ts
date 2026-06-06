import { toast } from "sonner";
// Google Sign-In configuration for native Android.
// Web Client ID (Google OAuth client_type: 3):
// 822103899326-5d5k2a6h1r7c1em3fgvcinq6k7scfp3p.apps.googleusercontent.com

// IMPORTANT: The @capgo/capacitor-social-login plugin requires the WEB Client ID
// to be passed as 'webClientId'. This is the audience for the idToken.
// The Android Client ID is matched automatically by Google Play Services using
// package name + SHA-1. It is NOT passed to the plugin.

const GOOGLE_WEB_CLIENT_ID = "822103899326-5d5k2a6h1r7c1em3fgvcinq6k7scfp3p.apps.googleusercontent.com";

// Android Client ID (for reference only)
const GOOGLE_ANDROID_CLIENT_ID = "822103899326-0b9oga5c5idh9vgtslgtghdjovc7rhj6.apps.googleusercontent.com";

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

    if (!login || !login.result || !login.result.idToken) {
      toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
      return false;
    }

    const result = login.result;
    const idToken = result.idToken;

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