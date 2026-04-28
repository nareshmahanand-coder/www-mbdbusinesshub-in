import { Car, Home, Smartphone, Bike, Monitor, Sofa, PawPrint, Shirt, BookOpen, Fish, Bone } from "lucide-react";

const categories = [
  { label: "Cars", icon: Car, color: "hsl(220, 70%, 50%)" },
  { label: "Properties", icon: Home, color: "hsl(140, 60%, 35%)" },
  { label: "Mobiles", icon: Smartphone, color: "hsl(24, 95%, 53%)" },
  { label: "Bikes", icon: Bike, color: "hsl(340, 80%, 50%)" },
  { label: "Electronics", icon: Monitor, color: "hsl(260, 60%, 50%)" },
  { label: "Furniture", icon: Sofa, color: "hsl(30, 70%, 45%)" },
  { label: "Pets", icon: PawPrint, color: "hsl(15, 75%, 50%)" },
  { label: "Fashion", icon: Shirt, color: "hsl(300, 50%, 45%)" },
  { label: "Books", icon: BookOpen, color: "hsl(200, 60%, 45%)" },
];

const petSubCategories = [
  { label: "Dogs", icon: PawPrint },
  { label: "Fishes & Aquarium", icon: Fish },
  { label: "Pet Food/Accessories", icon: Bone },
];

interface Props {
  selected: string | null;
  onSelect: (cat: string) => void;
}

const ClassifiedsCategoryGrid = ({ selected, onSelect }: Props) => {
  const showPetOptions = selected === "Pets" || petSubCategories.some(cat => cat.label === selected);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {categories.map(cat => {
          const isActive = selected === cat.label || (cat.label === "Pets" && showPetOptions);
          return (
            <button
              key={cat.label}
              onClick={() => onSelect(cat.label)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 transition-all border ${
                isActive
                  ? "bg-accent/10 border-accent shadow-sm"
                  : "bg-card border-border hover:border-accent/40"
              }`}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <span className="text-[11px] font-medium text-foreground leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {showPetOptions && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
          {petSubCategories.map(cat => {
            const isActive = selected === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => onSelect(cat.label)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-center transition-all ${
                  isActive ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-foreground"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassifiedsCategoryGrid;
