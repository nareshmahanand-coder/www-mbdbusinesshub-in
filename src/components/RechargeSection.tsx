import { useState } from "react";
import { Smartphone, Tv, Zap, Flame, Home, BadgeInfo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const services = [
  { id: "mobile", icon: Smartphone, label: "मोबाइल रिचार्ज", labelEn: "Mobile Recharge", placeholder: "मोबाइल नंबर डालें" },
  { id: "dth", icon: Tv, label: "डिश / DTH TV", labelEn: "DTH Recharge", placeholder: "Customer ID डालें" },
  { id: "electricity", icon: Zap, label: "बिजली बिल", labelEn: "Electricity Bill", placeholder: "Consumer नंबर डालें" },
  { id: "gas", icon: Flame, label: "गैस सिलेंडर", labelEn: "Gas Cylinder", placeholder: "LPG ID डालें" },
  { id: "rent", icon: Home, label: "घर का किराया", labelEn: "Home Rent", placeholder: "राशि डालें (₹)" },
];

const RechargeSection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = () => {
    if (!inputVal.trim()) {
      toast.error("कृपया जानकारी भरें");
      return;
    }
    toast.info("🚧 यह सुविधा जल्द आ रही है! Coming Soon. संपर्क करें: helpline.bharatdukaan@gmail.com");
    setInputVal("");
    setSelected(null);
  };

  return (
    <section className="relative z-10 bg-muted/30 py-8 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="mb-5 text-center">
          <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            💰 बचत और भुगतान
            <Badge variant="secondary" className="text-[10px]">
              <BadgeInfo className="mr-1 h-3 w-3" /> Coming Soon
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">Bills & Recharges</p>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(selected === s.id ? null : s.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                selected === s.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selected === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-hindi text-[10px] font-medium text-foreground leading-tight text-center">{s.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <Card className="max-w-sm mx-auto mt-4">
            <CardContent className="p-4 space-y-3">
              <p className="font-hindi text-sm font-semibold text-foreground">
                {services.find(s => s.id === selected)?.label}
              </p>
              <Input
                placeholder={services.find(s => s.id === selected)?.placeholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="font-hindi"
              />
              <Button onClick={handleSubmit} className="w-full">
                आगे बढ़ें • Proceed
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                🚧 यह सुविधा जल्द शुरू होगी। Payment Help Desk: helpline.bharatdukaan@gmail.com
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default RechargeSection;
