import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { Session } from "@supabase/supabase-js";

// Mirror Supabase auth token between WebView localStorage and Capacitor
// Preferences (Android SharedPreferences). This guarantees the session
// survives WebView storage wipes, app updates, and OS cache clears so
// users stay logged in until they explicitly sign out.
const AUTH_KEY = "sb-tkenjzcyvnqnhgntmmen-auth-token";
const KYC_PREFIX = "mbd-kyc-verified-";

export const getKycVerifiedKey = (userId: string) => `${KYC_PREFIX}${userId}`;

export async function persistNativeAuthSession(session: Session): Promise<void> {
  const value = JSON.stringify(session);
  try { localStorage.setItem(AUTH_KEY, value); } catch {}
  if (!Capacitor.isNativePlatform()) return;
  try { await Preferences.set({ key: AUTH_KEY, value }); } catch (err) { console.warn("[session-bridge] session persist failed", err); }
}

export async function clearNativeAuthSession(): Promise<void> {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
  if (!Capacitor.isNativePlatform()) return;
  try { await Preferences.remove({ key: AUTH_KEY }); } catch (err) { console.warn("[session-bridge] session clear failed", err); }
}

export async function persistKycVerifiedMarker(userId: string, timestamp = Date.now()): Promise<void> {
  const key = getKycVerifiedKey(userId);
  const value = String(timestamp);
  try { localStorage.setItem(key, value); } catch {}
  if (!Capacitor.isNativePlatform()) return;
  try { await Preferences.set({ key, value }); } catch (err) { console.warn("[session-bridge] kyc marker persist failed", err); }
}

export async function readKycVerifiedMarker(userId: string): Promise<number | null> {
  const key = getKycVerifiedKey(userId);
  try {
    const local = localStorage.getItem(key);
    if (local) return Number(local) || null;
  } catch {}
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { value } = await Preferences.get({ key });
    if (value) {
      try { localStorage.setItem(key, value); } catch {}
      return Number(value) || null;
    }
  } catch (err) {
    console.warn("[session-bridge] kyc marker read failed", err);
  }
  return null;
}

export async function restoreSessionFromNativeStorage(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const existing = localStorage.getItem(AUTH_KEY);
    if (!existing) {
      const { value } = await Preferences.get({ key: AUTH_KEY });
      if (value) localStorage.setItem(AUTH_KEY, value);
    } else {
      // Keep native copy fresh on cold start
      await Preferences.set({ key: AUTH_KEY, value: existing });
    }
  } catch (err) {
    console.warn("[session-bridge] restore failed", err);
  }

  // Patch localStorage so any future Supabase token writes also go to
  // Capacitor Preferences. Restores after kill/reinstall scenarios.
  try {
    const origSet = localStorage.setItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = (k: string, v: string) => {
      origSet(k, v);
      if (k === AUTH_KEY) void Preferences.set({ key: k, value: v });
    };
    localStorage.removeItem = (k: string) => {
      origRemove(k);
      if (k === AUTH_KEY) void Preferences.remove({ key: k });
    };
  } catch (err) {
    console.warn("[session-bridge] patch failed", err);
  }
}