import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

let initialized = false;
let lastToken: string | null = null;

async function saveToken(token: string) {
  lastToken = token;
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return;
  await supabase.from("device_push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform: Capacitor.getPlatform(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
}

export async function initPushNotifications() {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    // Create Android channel with custom sound
    if (Capacitor.getPlatform() === "android") {
      await PushNotifications.createChannel({
        id: "mbd_default",
        name: "Mera Bharat Dukaan Alerts",
        description: "Important admin notifications",
        importance: 5, // IMPORTANCE_HIGH (heads-up + sound)
        visibility: 1,
        lights: true,
        vibration: true,
      });
    }

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      console.warn("Push permission not granted");
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      try {
        await saveToken(token.value);
      } catch (e) {
        console.error("Failed to save push token", e);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
    });

    // Tap on notification → deep link
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = (action.notification.data?.link as string) || "/";
      try {
        window.location.href = link;
      } catch (e) {
        console.error("Failed to navigate from push", e);
      }
    });

    // Foreground notification → still navigate-friendly toast (handled by AdminMessageListener)
    PushNotifications.addListener("pushNotificationReceived", (notif) => {
      console.log("Push received in foreground", notif);
    });

    // App resume — re-register in case token rotated
    CapacitorApp.addListener("appStateChange", async (state) => {
      if (state.isActive) {
        try { await PushNotifications.register(); } catch {/* ignore */}
      }
    });

    // When user signs in later, persist the cached token
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && lastToken) {
        void saveToken(lastToken);
      }
    });
  } catch (e) {
    console.error("initPushNotifications failed", e);
  }
}

export async function clearPushToken() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (userId) {
      await supabase.from("device_push_tokens").delete().eq("user_id", userId);
    }
  } catch (e) {
    console.error("clearPushToken failed", e);
  }
}