import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Briefcase, Headphones } from "lucide-react";

const modules = [
  {
    to: "/classifieds",
    icon: ShoppingBag,
    label: "पुरानी चीजें",
    sublabel: "Buy / Sell",
    color: "from-[hsl(24,95%,53%)] to-[hsl(24,95%,40%)]",
  },
  {
    to: "/matrimony",
    icon: Heart,
    label: "मैरिज ब्यूरो",
    sublabel: "Mera Jeevansathi",
    color: "from-[hsl(340,80%,50%)] to-[hsl(340,80%,38%)]",
  },
  {
    to: "/jobs",
    icon: Briefcase,
    label: "नौकरी",
    sublabel: "Jobs / Staff",
    color: "from-[hsl(140,60%,35%)] to-[hsl(140,60%,25%)]",
  },
  {
    to: "/services",
    icon: Headphones,
    label: "भारत मित्र",
    sublabel: "Services",
    color: "from-[hsl(240,100%,25%)] to-[hsl(240,100%,18%)]",
  },
];

const SuperAppNav = () => {
  return (
    <section className="relative z-10 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="flex-shrink-0 flex items-center gap-2.5 rounded-xl bg-gradient-to-r px-4 py-2.5 text-primary-foreground shadow-md transition-transform hover:scale-[1.03] active:scale-95"
              style={{
                backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
              }}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${m.color} shadow-inner`}>
                <m.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-hindi text-sm font-bold leading-tight text-white">{m.label}</p>
                <p className="text-[10px] text-white/70">{m.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuperAppNav;
