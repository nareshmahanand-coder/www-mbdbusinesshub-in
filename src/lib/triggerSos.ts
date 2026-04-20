import { supabase } from "@/integrations/supabase/client";
import {
  buildSosMessage,
  distanceMeters,
  getCurrentPosition,
  HELPLINE_NUMBER,
  toWhatsAppNumber,
} from "./familySafety";

export interface SosResult {
  alertId: string;
  lat: number;
  lng: number;
  familyNotified: number;
  merchantsNotified: number;
  whatsappLinks: string[];
}

/**
 * Full SOS flow:
 * 1. Get GPS
 * 2. Insert sos_alerts row
 * 3. Find accepted family members + nearby merchants (≤500m)
 * 4. Insert recipients
 * 5. Return wa.me links for the client to open (we open the top 3 + helpline)
 */
export const triggerSos = async (
  userId: string,
  ownerName: string
): Promise<SosResult> => {
  const pos = await getCurrentPosition();
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const message = buildSosMessage(ownerName || "एक यूज़र", lat, lng);

  // 1. Create alert
  const { data: alert, error: alertErr } = await supabase
    .from("sos_alerts")
    .insert({
      user_id: userId,
      latitude: lat,
      longitude: lng,
      accuracy: pos.coords.accuracy,
      message,
    })
    .select()
    .single();

  if (alertErr || !alert) throw alertErr ?? new Error("Failed to create alert");

  // 2. Family members (accepted)
  const { data: family } = await supabase
    .from("family_members")
    .select("member_name, member_phone, member_user_id")
    .eq("owner_id", userId)
    .eq("status", "accepted");

  // 3. Nearby merchants within 500m
  const { data: merchants } = await supabase
    .from("merchant_profiles")
    .select("id, shop_name, whatsapp, phone, latitude, longitude")
    .eq("is_verified", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const nearby = (merchants ?? [])
    .map((m) => ({
      ...m,
      dist: distanceMeters(lat, lng, m.latitude!, m.longitude!),
    }))
    .filter((m) => m.dist <= 500)
    .sort((a, b) => a.dist - b.dist);

  // 4. Insert recipients
  const recipients: any[] = [];
  (family ?? []).forEach((f) =>
    recipients.push({
      alert_id: alert.id,
      recipient_type: "family",
      recipient_user_id: f.member_user_id,
      recipient_phone: f.member_phone,
      recipient_name: f.member_name,
    })
  );
  nearby.forEach((m) =>
    recipients.push({
      alert_id: alert.id,
      recipient_type: "merchant",
      recipient_merchant_id: m.id,
      recipient_phone: m.whatsapp || m.phone,
      recipient_name: m.shop_name,
      distance_meters: m.dist,
    })
  );
  if (recipients.length) {
    await supabase.from("sos_alert_recipients").insert(recipients);
  }

  // 5. Build WA links: helpline + all family + nearest 3 merchants
  const links: string[] = [];
  links.push(
    `https://wa.me/${HELPLINE_NUMBER}?text=${encodeURIComponent(message)}`
  );
  (family ?? []).forEach((f) => {
    const n = toWhatsAppNumber(f.member_phone);
    if (n) links.push(`https://wa.me/${n}?text=${encodeURIComponent(message)}`);
  });
  nearby.slice(0, 3).forEach((m) => {
    const n = toWhatsAppNumber(m.whatsapp || m.phone || "");
    if (n) links.push(`https://wa.me/${n}?text=${encodeURIComponent(message)}`);
  });

  // Also record as last known location
  await supabase.from("last_known_locations").upsert({
    user_id: userId,
    latitude: lat,
    longitude: lng,
    accuracy: pos.coords.accuracy,
    reason: "sos",
    recorded_at: new Date().toISOString(),
  });

  return {
    alertId: alert.id,
    lat,
    lng,
    familyNotified: family?.length ?? 0,
    merchantsNotified: nearby.length,
    whatsappLinks: links,
  };
};
