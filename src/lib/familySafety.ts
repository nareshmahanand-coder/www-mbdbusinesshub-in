import { supabase } from "@/integrations/supabase/client";

export const HELPLINE_NUMBER = "919203645007";

/** Haversine distance in meters */
export const distanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const googleMapsLink = (lat: number, lng: number) =>
  `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

export const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });

/** Normalize Indian phone: strip spaces, +, leading 0 → 10-digit core */
export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(-10);
};

export const toWhatsAppNumber = (raw: string) => {
  const ten = normalizePhone(raw);
  return ten.length === 10 ? `91${ten}` : raw.replace(/\D/g, "");
};

export const buildInviteMessage = (ownerName: string, token: string) => {
  const url = `${window.location.origin}/family-invite/${token}`;
  return `🛡️ ${ownerName} ने आपको Mera Bharat Dukaan के Family Safety Circle में जोड़ा है। Accept करने के लिए: ${url}`;
};

export const buildSosMessage = (ownerName: string, lat: number, lng: number) =>
  `🚨 SOS EMERGENCY 🚨\n${ownerName} को मदद चाहिए!\n📍 Location: ${googleMapsLink(
    lat,
    lng
  )}\n\n— Mera Bharat Dukaan Suraksha Chakra`;

export interface FamilyMember {
  id: string;
  owner_id: string;
  member_name: string;
  member_phone: string;
  member_user_id: string | null;
  status: string;
  invite_token: string;
  accepted_at: string | null;
  created_at: string;
}

/** Record current location to last_known_locations */
export const recordLocation = async (
  userId: string,
  lat: number,
  lng: number,
  reason: string,
  accuracy?: number,
  battery?: number
) => {
  const { error } = await supabase.from("last_known_locations").upsert({
    user_id: userId,
    latitude: lat,
    longitude: lng,
    accuracy: accuracy ?? null,
    battery_level: battery ?? null,
    reason,
    recorded_at: new Date().toISOString(),
  });
  if (error) console.warn("[familySafety] recordLocation failed", error);
};
