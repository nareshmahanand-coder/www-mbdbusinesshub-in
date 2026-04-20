import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Briefcase, MapPin, GraduationCap, Shield } from "lucide-react";

const modules = [
  {
    to: "/classifieds",
    icon: ShoppingBag,
    label: "पुरानी चीजें",
    sublabel: "Buy / Sell",
    bg: "bg-[hsl(24,95%,95%)]",
    iconBg: "bg-[hsl(24,95%,53%)]",
  },
  {
    to: "/matrimony",
    icon: Heart,
    label: "मैरिज ब्यूरो",
    sublabel: "Mera Jeevansathi",
    bg: "bg-[hsl(340,80%,95%)]",
    iconBg: "bg-[hsl(340,80%,50%)]",
  },
  {
    to: "/jobs",
    icon: Briefcase,
    label: "नौकरी",
    sublabel: "Jobs / Staff",
    bg: "bg-[hsl(140,60%,93%)]",
    iconBg: "bg-[hsl(140,60%,35%)]",
  },
  {
    to: "/services",
    icon: MapPin,
    label: "नजदीकी दुकान",
    sublabel: "Nearby Shops",
    bg: "bg-[hsl(240,100%,95%)]",
    iconBg: "bg-[hsl(240,100%,25%)]",
  },
  {
    to: "/skills",
    icon: GraduationCap,
    label: "कौशल विकास",
    sublabel: "Skill Development",
    bg: "bg-[hsl(270,80%,95%)]",
    iconBg: "bg-[hsl(270,80%,40%)]",
  },
  {
    to: "/family-safety",
    icon: Shield,
    label: "Family Safety",
    sublabel: "[भारत कवच]",
    bg: "bg-gradient-to-br from-[hsl(28,100%,92%)] via-white to-[hsl(122,55%,88%)]",
    iconBg: "bg-[#1a237e]",
    isKavach: true,
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
              className={`flex-shrink-0 flex items-center gap-2.5 rounded-xl ${m.bg} border border-border px-4 py-2.5 shadow-sm transition-transform hover:scale-[1.03] active:scale-95`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.iconBg} shadow-inner`}>
                <m.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-hindi text-sm font-bold leading-tight text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuperAppNav;
