import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/**
 * Safely register the device for FCM push notifications and persist the
 * token in `device_push_tokens` so the `send-push` edge function can
 * deliver admin/owner messages with sound + notification channel.
 *
 * Wrapped in try/catch everywhere so a missing plugin or denied
 * permission can never crash the app or break the JS bundle.
 */
export async function initNativePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const mod = await import("@capacitor/push-notifications").catch(() => null);
    if (!mod) return;
    const { PushNotifications } = mod;

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;

    // Create a high-importance channel with default ringtone (Android 8+).
    try {
      await PushNotifications.createChannel({
        id: "mbd_default",
        name: "Mera Bharat Dukaan Alerts",
        description: "Admin & owner messages",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#FF8C00",
      });
    } catch {
      /* channel already exists or unsupported */
    }

    PushNotifications.addListener("registration", async (token) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !token?.value) return;
        await supabase
          .from("device_push_tokens")
          .upsert(
            { user_id: user.id, token: token.value, platform: "android" },
            { onConflict: "token" },
          );
      } catch (err) {
        console.warn("[push] token persist failed", err);
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] registration error", err);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      try {
        const link = (action.notification?.data as { link?: string } | undefined)?.link;
        if (link && typeof link === "string" && link.startsWith("/")) {
          window.location.assign(link);
        }
      } catch {
        /* no-op */
      }
    });

    await PushNotifications.register();
  } catch (err) {
    console.warn("[push] init failed (non-fatal)", err);
  }
}