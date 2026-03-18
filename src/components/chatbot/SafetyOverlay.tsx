import { Shield, Phone, MapPin, MessageCircle } from "lucide-react";
import { sampleShops } from "@/data/sampleShops";

interface SafetyOverlayProps {
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
}

const SafetyOverlay = ({ onClose, userLocation }: SafetyOverlayProps) => {
  // Find nearest registered shopkeeper as local guardian
  const nearestShop = userLocation
    ? sampleShops
        .filter((s) => s.verified)
        .sort((a, b) => {
          const distA = Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng);
          const distB = Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng);
          return distA - distB;
        })[0]
    : null;

  const shareLocationViaWhatsApp = (phone: string, name: string) => {
    const locationUrl = userLocation
      ? `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
      : "Location unavailable";
    const message = `🚨 SOS - EMERGENCY! मुझे मदद चाहिए! मेरी लोकेशन: ${locationUrl} — भारत दुकान सुरक्षा चक्र से भेजा गया।`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-destructive/95 p-5 text-center overflow-y-auto">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary-foreground/30" style={{ width: 80, height: 80 }} />
        <Shield className="relative h-14 w-14 text-primary-foreground" />
      </div>
      <h4 className="font-hindi text-lg font-bold text-primary-foreground">🚨 सुरक्षा चक्र — Emergency Mode</h4>
      <p className="font-hindi text-xs text-primary-foreground/90">
        आपकी लोकेशन शेयर की जा रही है। नजदीकी दुकानदार को भी सूचित किया जा रहा है।
      </p>

      {userLocation && (
        <div className="flex items-center gap-1 rounded bg-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground">
          <MapPin className="h-3 w-3" />
          📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <a href="tel:112" className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground px-4 py-3 text-sm font-bold text-destructive">
          <Phone className="h-4 w-4" /> 112 — Emergency Call
        </a>
        <a href="tel:181" className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground/90 px-4 py-3 text-sm font-bold text-destructive">
          <Phone className="h-4 w-4" /> 181 — Women Helpline
        </a>
        <a href="tel:100" className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground/80 px-4 py-3 text-sm font-bold text-destructive">
          <Phone className="h-4 w-4" /> 100 — Police
        </a>
        <a href="tel:108" className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground/70 px-4 py-3 text-sm font-bold text-destructive">
          <Phone className="h-4 w-4" /> 108 — Ambulance
        </a>
      </div>

      {nearestShop && (
        <div className="w-full rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 p-3">
          <p className="mb-1 text-xs font-bold text-primary-foreground">🏪 नजदीकी लोकल गार्जियन:</p>
          <p className="text-xs text-primary-foreground/90">{nearestShop.name} — {nearestShop.address}</p>
          <button
            onClick={() => shareLocationViaWhatsApp(nearestShop.whatsapp, nearestShop.name)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-green-india px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <MessageCircle className="h-3 w-3" />
            व्हाट्सएप पर लोकेशन भेजें
          </button>
        </div>
      )}

      <button onClick={onClose} className="mt-1 text-xs text-primary-foreground/60 underline">
        बंद करें
      </button>
    </div>
  );
};

export default SafetyOverlay;
