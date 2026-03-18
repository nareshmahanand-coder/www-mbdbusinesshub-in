import { useState } from "react";
import { Phone, MessageCircle, Droplets } from "lucide-react";
import { BLOOD_DONORS } from "./constants";

const BLOOD_GROUPS = ["All", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const BloodDonorTab = () => {
  const [selectedGroup, setSelectedGroup] = useState("All");

  const filtered = selectedGroup === "All"
    ? BLOOD_DONORS
    : BLOOD_DONORS.filter((d) => d.bloodGroup === selectedGroup);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="rounded-lg bg-destructive/10 p-3">
        <h5 className="mb-1 flex items-center gap-1 text-sm font-semibold text-destructive">
          <Droplets className="h-4 w-4" /> रक्तदान डायरेक्टरी — भिलाई
        </h5>
        <p className="text-xs text-muted-foreground">
          बॉस, इमरजेंसी में ब्लड डोनर ढूंढें। सीधे कॉल या व्हाट्सएप करें।
        </p>
      </div>

      {/* Blood group filter */}
      <div className="flex flex-wrap gap-1">
        {BLOOD_GROUPS.map((bg) => (
          <button
            key={bg}
            onClick={() => setSelectedGroup(bg)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
              selectedGroup === bg
                ? "bg-destructive text-destructive-foreground"
                : "border border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {bg === "All" ? "सभी" : bg}
          </button>
        ))}
      </div>

      {/* Donor list */}
      <div className="max-h-[280px] space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            इस ब्लड ग्रुप का कोई डोनर उपलब्ध नहीं है।
          </p>
        ) : (
          filtered.map((donor, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{donor.name}</p>
                  <p className="text-xs text-muted-foreground">{donor.area}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    अंतिम रक्तदान: {donor.lastDonation}
                  </p>
                </div>
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  {donor.bloodGroup}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={`tel:+${donor.phone}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded bg-accent px-2 py-1.5 text-[10px] font-bold text-accent-foreground"
                >
                  <Phone className="h-3 w-3" /> कॉल करें
                </a>
                <a
                  href={`https://wa.me/${donor.phone}?text=${encodeURIComponent("नमस्ते! मुझे इमरजेंसी में ब्लड की जरूरत है। क्या आप रक्तदान कर सकते हैं? — भारत दुकान सुरक्षा चक्र")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded bg-green-india px-2 py-1.5 text-[10px] font-bold text-primary-foreground"
                >
                  <MessageCircle className="h-3 w-3" /> व्हाट्सएप
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BloodDonorTab;
