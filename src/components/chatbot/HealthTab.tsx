import { HEALTH_TIPS } from "./constants";
import { sampleShops } from "@/data/sampleShops";

interface HealthTabProps {
  onAskHealth: (question: string, answer: string) => void;
}

const HealthTab = ({ onAskHealth }: HealthTabProps) => {
  const findHealthServices = (): string => {
    const healthShops = sampleShops.filter(
      (s) => s.category === "Pharmacy" || s.description.toLowerCase().includes("doctor") || s.description.toLowerCase().includes("clinic")
    );
    if (healthShops.length === 0) return "बॉस, अभी नजदीकी क्लिनिक/फार्मेसी की जानकारी उपलब्ध नहीं है।";
    let response = "बॉस, ये रहीं नजदीकी स्वास्थ्य सेवाएं:\n";
    healthShops.forEach((s, i) => {
      response += `${i + 1}. ${s.premium ? "⭐ " : ""}${s.name} — ${s.address}, ${s.city}। व्हाट्सएप: ${s.whatsapp}\n`;
    });
    return response;
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="rounded-lg bg-muted p-3">
        <h5 className="mb-1 text-sm font-semibold text-foreground">🏥 डिजिटल स्वास्थ्य मित्र</h5>
        <p className="text-xs text-muted-foreground">बॉस, प्राथमिक उपचार और स्वास्थ्य टिप्स:</p>
      </div>
      {HEALTH_TIPS.map((tip, i) => (
        <button
          key={i}
          onClick={() => onAskHealth(tip.q, tip.a)}
          className="rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
        >
          <h6 className="text-sm font-semibold text-foreground">💊 {tip.q}</h6>
        </button>
      ))}
      <button
        onClick={() => onAskHealth("नजदीकी क्लिनिक बताओ", findHealthServices())}
        className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-left transition-colors hover:bg-accent/20"
      >
        <h6 className="text-sm font-semibold text-accent">🏥 नजदीकी क्लिनिक / फार्मेसी खोजें</h6>
      </button>
    </div>
  );
};

export default HealthTab;
