import { useState } from "react";
import { ArrowLeft, MapPin, Camera, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const KISAN_CATEGORIES = [
  { value: "fish", label: "🐟 मछली पालन (Fish Farming)" },
  { value: "poultry", label: "🐔 पोल्ट्री (Poultry)" },
  { value: "vegetables", label: "🥦 सब्जी (Vegetables)" },
  { value: "dairy", label: "🐮 डेयरी (Dairy)" },
  { value: "fruits", label: "🍎 फल (Fruits)" },
  { value: "flowers", label: "🌺 फूल (Flowers)" },
  { value: "organic", label: "🌿 ऑर्गेनिक प्रोडक्ट्स" },
  { value: "other", label: "🏪 अन्य (Other)" },
];

const KisanRegistration = () => {
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [premium, setPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<"monthly" | "yearly">("monthly");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        toast.success("📍 लोकेशन सफलतापूर्वक जोड़ी गई!");
      },
      () => {
        setLocationLoading(false);
        toast.error("लोकेशन नहीं मिल पाई। कृपया अनुमति दें।");
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const trimmedName = name.trim();
    const trimmedFarm = farmName.trim();
    const trimmedWa = whatsapp.trim();

    if (!trimmedName || trimmedName.length > 100) {
      toast.error("कृपया अपना नाम भरें (max 100 characters)");
      return;
    }
    if (!trimmedFarm || trimmedFarm.length > 100) {
      toast.error("कृपया खेत/फार्म का नाम भरें");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(trimmedWa)) {
      toast.error("कृपया सही 10 अंकों का WhatsApp नंबर दें");
      return;
    }
    if (!category) {
      toast.error("कृपया कैटेगरी चुनें");
      return;
    }

    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(140,30%,95%)] to-[hsl(140,20%,90%)]">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-md rounded-2xl border-2 border-[hsl(45,80%,50%)]/40 bg-card p-8 shadow-xl">
            <span className="mb-4 inline-block text-6xl">🎉</span>
            <h2 className="font-hindi text-2xl font-extrabold text-[hsl(140,60%,30%)]">
              बधाई हो! 🙏
            </h2>
            <p className="mt-3 font-hindi text-base text-foreground leading-relaxed">
              आपकी दुकान अब <span className="font-bold text-accent">भारत दुकान</span> पर लाइव है।
              <br />
              <span className="font-bold text-[hsl(140,60%,30%)]">भारत मित्र</span> अब आपकी मदद करेगी।
            </p>
            {premium && (
              <Badge className="mt-3 bg-gradient-to-r from-[hsl(45,80%,45%)] to-[hsl(35,90%,50%)] text-[hsl(140,35%,12%)] font-bold px-4 py-1">
                ⭐ Premium {premiumPlan === "monthly" ? "₹1/महीना" : "₹12/साल"}
              </Badge>
            )}
            <div className="mt-6">
              <Link to="/">
                <Button className="bg-[hsl(140,60%,30%)] text-primary-foreground hover:bg-[hsl(140,60%,25%)] font-bold">
                  🏠 होम पेज पर जाएं
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(140,30%,95%)] to-[hsl(140,20%,90%)]">
      {/* Header */}
      <header className="border-b border-[hsl(140,60%,30%)]/20 bg-gradient-to-r from-[hsl(140,35%,20%)] to-[hsl(140,30%,25%)] py-4">
        <div className="container mx-auto flex items-center gap-3 px-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-hindi text-xl font-extrabold text-primary-foreground flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[hsl(45,80%,60%)]" />
              किसान पंजीकरण
            </h1>
            <p className="text-xs text-primary-foreground/60">Kisan Registration — Free for All Farmers</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-lg border-2 border-[hsl(140,60%,30%)]/20 shadow-xl">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <span className="text-4xl">🌾</span>
              <h2 className="mt-2 font-hindi text-xl font-bold text-[hsl(140,60%,30%)]">
                अपना फार्म रजिस्टर करें
              </h2>
              <p className="text-sm text-muted-foreground">भारत दुकान पर अपने उत्पाद बेचें — बिल्कुल FREE!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <Label htmlFor="kisan-name" className="font-hindi font-semibold">
                  👤 आपका नाम <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kisan-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="अपना पूरा नाम लिखें"
                  maxLength={100}
                  className="mt-1 border-[hsl(140,60%,30%)]/30 focus-visible:ring-[hsl(140,60%,30%)]"
                />
              </div>

              {/* Farm Name */}
              <div>
                <Label htmlFor="farm-name" className="font-hindi font-semibold">
                  🏡 खेत / फार्म का नाम <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="farm-name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="जैसे: नंदा एग्रो फार्म"
                  maxLength={100}
                  className="mt-1 border-[hsl(140,60%,30%)]/30 focus-visible:ring-[hsl(140,60%,30%)]"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <Label htmlFor="wa-number" className="font-hindi font-semibold">
                  📱 WhatsApp नंबर <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="wa-number"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    className="border-[hsl(140,60%,30%)]/30 focus-visible:ring-[hsl(140,60%,30%)]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="font-hindi font-semibold">
                  📋 कैटेगरी चुनें <span className="text-destructive">*</span>
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {KISAN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                        category === cat.value
                          ? "border-[hsl(140,60%,30%)] bg-[hsl(140,60%,30%)]/10 text-[hsl(140,60%,25%)] shadow-sm"
                          : "border-border bg-card text-foreground hover:border-[hsl(140,60%,30%)]/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="font-hindi font-semibold">📍 फार्म लोकेशन</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="mt-1 w-full border-[hsl(140,60%,30%)]/30 text-[hsl(140,60%,25%)] hover:bg-[hsl(140,60%,30%)]/10"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {locationLoading ? "लोकेशन ढूंढ रहे हैं..." : location ? `✅ लोकेशन जोड़ी गई (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : "मेरा स्थान जोड़ें"}
                </Button>
              </div>

              {/* Photo */}
              <div>
                <Label className="font-hindi font-semibold">📸 फार्म की फोटो</Label>
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[hsl(140,60%,30%)]/30 bg-[hsl(140,60%,30%)]/5 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-[hsl(140,60%,30%)]/50">
                  <Camera className="h-5 w-5" />
                  {photo ? photo.name : "फोटो अपलोड करें (optional)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Premium Toggle */}
              <div className="rounded-xl border-2 border-[hsl(45,80%,50%)]/30 bg-gradient-to-r from-[hsl(45,80%,50%)]/5 to-[hsl(45,80%,50%)]/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-hindi text-sm font-bold text-foreground">⭐ प्रीमियम प्लान</p>
                    <p className="text-xs text-muted-foreground">शहर में सबसे ऊपर दिखें, गोल्डन बैज पाएं</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPremium(!premium)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${premium ? "bg-[hsl(45,80%,45%)]" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-md transition-transform ${premium ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                {premium && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPremiumPlan("monthly")}
                      className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-bold transition-all ${
                        premiumPlan === "monthly"
                          ? "border-[hsl(45,80%,45%)] bg-[hsl(45,80%,45%)]/20 text-[hsl(45,80%,35%)]"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      ₹1/महीना
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumPlan("yearly")}
                      className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-bold transition-all ${
                        premiumPlan === "yearly"
                          ? "border-[hsl(45,80%,45%)] bg-[hsl(45,80%,45%)]/20 text-[hsl(45,80%,35%)]"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      ₹12/साल <span className="text-[hsl(140,60%,30%)]">(बचत!)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[hsl(140,60%,30%)] text-primary-foreground hover:bg-[hsl(140,60%,25%)] font-bold text-base h-12 shadow-lg"
              >
                {submitting ? "रजिस्टर हो रहा है..." : "🌾 रजिस्टर करें — FREE"}
              </Button>

              <p className="text-center text-[10px] text-muted-foreground">
                रजिस्ट्रेशन पूरी तरह से निःशुल्क है। Premium वैकल्पिक है।
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KisanRegistration;
