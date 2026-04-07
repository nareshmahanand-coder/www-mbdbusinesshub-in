import { Car, Home, Smartphone, Bike, Monitor, Sofa, PawPrint, Shirt, BookOpen } from "lucide-react";

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

interface Props {
  selected: string | null;
  onSelect: (cat: string) => void;
}

const ClassifiedsCategoryGrid = ({ selected, onSelect }: Props) => (
  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
    {categories.map(cat => {
      const isActive = selected === cat.label;
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
);

export default ClassifiedsCategoryGrid;
