import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Briefcase, Headphones, Smartphone, Tv, Zap, Flame, Home } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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
    icon: Headphones,
    label: "भारत मित्र",
    sublabel: "Services",
    bg: "bg-[hsl(240,100%,95%)]",
    iconBg: "bg-[hsl(240,100%,25%)]",
  },
];

const rechargeServices = [
  { id: "mobile", icon: Smartphone, label: "मोबाइल", sublabel: "Recharge", bg: "bg-[hsl(200,80%,94%)]", iconBg: "bg-[hsl(200,80%,45%)]", placeholder: "मोबाइल नंबर डालें" },
  { id: "dth", icon: Tv, label: "DTH TV", sublabel: "Recharge", bg: "bg-[hsl(270,70%,94%)]", iconBg: "bg-[hsl(270,70%,45%)]", placeholder: "Customer ID डालें" },
  { id: "electricity", icon: Zap, label: "बिजली बिल", sublabel: "Electricity", bg: "bg-[hsl(45,90%,93%)]", iconBg: "bg-[hsl(45,90%,40%)]", placeholder: "Consumer नंबर डालें" },
  { id: "gas", icon: Flame, label: "गैस सिलेंडर", sublabel: "Gas", bg: "bg-[hsl(15,85%,94%)]", iconBg: "bg-[hsl(15,85%,50%)]", placeholder: "LPG ID डालें" },
  { id: "rent", icon: Home, label: "किराया", sublabel: "Rent", bg: "bg-[hsl(160,50%,93%)]", iconBg: "bg-[hsl(160,50%,38%)]", placeholder: "राशि डालें (₹)" },
];

const SuperAppNav = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = () => {
    if (!inputVal.trim()) {
      toast.error("कृपया जानकारी भरें");
      return;
    }
    toast.info("यह सुविधा जल्द शुरू होगी। संपर्क करें: helpline.bharatdukaan@gmail.com");
    setInputVal("");
    setSelectedService(null);
  };

  return (
    <section className="relative z-10 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        {/* Main nav row */}
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

        {/* Bills & Recharges row */}
        <div className="flex gap-2.5 overflow-x-auto pt-2.5 pb-1 scrollbar-hide">
          {rechargeServices.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedService(selectedService === s.id ? null : s.id)}
              className={`flex-shrink-0 flex items-center gap-2 rounded-xl border px-3.5 py-2 shadow-sm transition-transform hover:scale-[1.03] active:scale-95 ${
                selectedService === s.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : `${s.bg} border-border`
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-inner ${
                selectedService === s.id ? "bg-primary" : s.iconBg
              }`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-hindi text-xs font-bold leading-tight text-foreground">{s.label}</p>
                <p className="text-[9px] text-muted-foreground">{s.sublabel}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Inline form when a service is selected */}
        {selectedService && (
          <Card className="max-w-sm mx-auto mt-3">
            <CardContent className="p-4 space-y-3">
              <p className="font-hindi text-sm font-semibold text-foreground">
                {rechargeServices.find(s => s.id === selectedService)?.label}
              </p>
              <Input
                placeholder={rechargeServices.find(s => s.id === selectedService)?.placeholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="font-hindi"
              />
              <Button onClick={handleSubmit} className="w-full">
                आगे बढ़ें • Proceed
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default SuperAppNav;
