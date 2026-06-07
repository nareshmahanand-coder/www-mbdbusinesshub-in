import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";
import { persistNativeAuthSession } from "@/lib/capacitorSessionBridge";

/**
 * Native Android Google Sign-In configuration.
 *
 * Google Cloud Console / Firebase checklist:
 * 1. OAuth consent screen: add scopes `openid`, `email`, `profile`.
 * 2. OAuth Credentials → Web application: use GOOGLE_WEB_CLIENT_ID below.
 * 3. OAuth Credentials → Android: package `com.merabharatdukaan.app` + SHA-1 below.
 * 4. Firebase Android app: add the same SHA-1, then download a fresh google-services.json.
 * 5. After changing IDs/SHA-1: run `npx cap sync android`, rebuild, then reinstall the APK.
 *
 * Important: @capgo/capacitor-social-login must receive the WEB client ID as
 * `webClientId`. The Android client ID is matched by Google Play Services from
 * package name + SHA-1 and must NOT be passed to SocialLogin.initialize().
 */

export const GOOGLE_WEB_CLIENT_ID =
  "822103899326-5d5k2a6h1r7c1em3fgvcinq6k75cfg3p.apps.googleusercontent.com";

export const GOOGLE_ANDROID_CLIENT_ID =
  "822103899326-0b9oga5c5idh9vgtslgtghdjovc7rhj6.apps.googleusercontent.com";

export const GOOGLE_ANDROID_SHA1 =
  "76:9F:2C:91:FA:7E:3C:2A:77:81:57:69:79:45:AA:9D:F3:57:81:D5";

const GOOGLE_USER_CACHE_KEY = "mbd-google-user";
let initializePromise: Promise<void> | null = null;

type GoogleProfile = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  imageUrl?: string | null;
};

type GoogleLoginResult = {
  idToken?: string | null;
  accessToken?: string | { token?: string | null } | null;
  profile?: GoogleProfile | null;
  authentication?: {
    idToken?: string | null;
    accessToken?: string | null;
  };
};

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

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    console.warn("[native-google] could not decode idToken payload", error);
    return {};
  }
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const asString = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);

const getErrorCode = (error: unknown) => {
  const record = toRecord(error);
  return String(record.code || record.errorCode || record.name || "").toUpperCase();
};

const getErrorMessage = (error: unknown) => {
  const record = toRecord(error);
  return String(record.message || error || "");
};

const isUserCancelled = (error: unknown) => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();
  return code === "USER_CANCELLED" || /user.*cancel|cancelled by user|canceled by user/.test(message);
};

const extractGoogleResult = (login: unknown): GoogleLoginResult => {
  const response = (login ?? {}) as { result?: GoogleLoginResult } & GoogleLoginResult;
  return response.result ?? response;
};

const getAccessTokenValue = (accessToken: GoogleLoginResult["accessToken"]) => {
  if (!accessToken) return null;
  if (typeof accessToken === "string") return accessToken;
  return accessToken.token ?? null;
};

export async function initializeNativeGoogleAuth(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  initializePromise ??= SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    }).catch((error) => {
      initializePromise = null;
      console.error("[native-google] initialize failed", {
        error,
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        androidSha1: GOOGLE_ANDROID_SHA1,
      });
      throw new Error("Google Sign-In initialize नहीं हो पाया। App update/sync करके दोबारा कोशिश करें।");
    });

  await initializePromise;
  return true;
}

export async function signInWithGoogleNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await initializeNativeGoogleAuth();

    const rawNonce = getUrlSafeNonce();
    const nonceDigest = await sha256Hex(rawNonce);

    const login = await SocialLogin.login({
      provider: "google",
      options: {
        // Android Credential Manager bottom-sheet flow. Keep authorized-account
        // filtering disabled so first-time users and supervised accounts are shown.
        style: "bottom",
        filterByAuthorizedAccounts: false,
        autoSelectEnabled: false,
        nonce: nonceDigest,
        forceRefreshToken: false,
      },
    });

    const result = extractGoogleResult(login);
    const idToken = result.idToken ?? result.authentication?.idToken ?? null;

    if (!idToken) {
      console.error("[native-google] missing idToken", login);
      toast.error("Google token नहीं मिला। Web Client ID और Android SHA-1 check करके APK फिर rebuild करें।");
      return false;
    }

    const tokenPayload = decodeJwtPayload(idToken);
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      console.error("[native-google] auth token exchange failed", {
        error,
        tokenAudience: tokenPayload.aud,
        expectedWebClientId: GOOGLE_WEB_CLIENT_ID,
      });
      toast.error("Google token verify नहीं हुआ। Backend Google Web Client ID इसी ID से match होना चाहिए।");
      return false;
    }

    const profile = result.profile ?? {};
    const email = data.user.email ?? profile.email ?? asString(tokenPayload.email);
    const name =
      data.user.user_metadata?.full_name ??
      data.user.user_metadata?.name ??
      profile.name ??
      asString(tokenPayload.name);
    const avatarUrl = data.user.user_metadata?.avatar_url ?? profile.imageUrl ?? asString(tokenPayload.picture);

    await persistNativeAuthSession(data.session);

    localStorage.setItem(
      GOOGLE_USER_CACHE_KEY,
      JSON.stringify({
        provider: "google",
        userId: data.user.id,
        googleId: profile.id ?? tokenPayload.sub ?? null,
        email,
        name,
        avatar_url: avatarUrl,
        sessionAccessToken: data.session.access_token,
        sessionExpiresAt: data.session.expires_at ?? null,
        googleAccessToken: getAccessTokenValue(result.accessToken ?? result.authentication?.accessToken ?? null),
        tokenAudience: asString(tokenPayload.aud),
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        androidSha1: GOOGLE_ANDROID_SHA1,
        savedAt: new Date().toISOString(),
      })
    );

    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        display_name: name,
        avatar_url: avatarUrl,
        provider: "google",
      },
      { onConflict: "id" }
    );

    toast.success("Google से सफलतापूर्वक लॉगिन हो गया!");
    return true;

  } catch (error: unknown) {
    console.error("[native-google] login failed", {
      error,
      code: getErrorCode(error),
      message: getErrorMessage(error),
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      androidSha1: GOOGLE_ANDROID_SHA1,
    });

    if (isUserCancelled(error)) {
      toast.message("Google Sign-In cancelled. आप दोबारा कोशिश कर सकते हैं।");
      return false;
    }

    toast.error("Google Login में समस्या आई। कृपया app update/sync करके दोबारा प्रयास करें।");
    return false;
  }
}