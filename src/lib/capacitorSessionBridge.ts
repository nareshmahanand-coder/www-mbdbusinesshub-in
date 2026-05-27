import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Mirror Supabase auth token between WebView localStorage and Capacitor
// Preferences (Android SharedPreferences). This guarantees the session
// survives WebView storage wipes, app updates, and OS cache clears so
// users stay logged in until they explicitly sign out.
const AUTH_KEY = "sb-tkenjzcyvnqnhgntmmen-auth-token";

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