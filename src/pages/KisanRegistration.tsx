import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Camera,
  Phone,
  User,
  Leaf,
  Fish,
  Egg,
  Milk,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { id: "fish", label: "मछली (Fish)", icon: Fish, emoji: "🐟" },
  { id: "poultry", label: "मुर्गी (Poultry)", icon: Egg, emoji: "🐔" },
  { id: "vegetables", label: "सब्जियां (Vegetables)", icon: Leaf, emoji: "🥬" },
  { id: "dairy", label: "दूध (Dairy)", icon: Milk, emoji: "🥛" },
];

const KisanRegistration = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [plan, setPlan] = useState<"basic" | "vip">("basic");
  const [submitted, setSubmitted] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS उपलब्ध नहीं है", variant: "destructive" });
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocationLoading(false);
        toast({ title: "📍 स्थान मिल गया!" });
      },
      () => {
        setLocationLoading(false);
        toast({ title: "स्थान नहीं मिला", variant: "destructive" });
      }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !farmName || !category || !whatsapp) {
      toast({ title: "कृपया सभी ज़रूरी जानकारी भरें", variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, hsl(120 40% 95%), hsl(90 30% 92%))" }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            🎉 बधाई हो!
          </h1>
          <p className="text-lg text-green-700 leading-relaxed" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            आपकी दुकान अब <strong>भारत दुकान</strong> पर लाइव है।
            <br />
            <strong>भारत मित्र</strong> अब आपकी मदद करेगी। 🙏
          </p>
          <div className="bg-green-50 rounded-2xl p-4 text-sm text-green-600 space-y-1">
            <p>👤 {name}</p>
            <p>🌾 {farmName}</p>
            <p>📱 {whatsapp}</p>
            <p>📦 {plan === "vip" ? "VIP ₹999/साल" : "बेसिक ₹99/महीना"}</p>
          </div>
          <Link to="/">
            <Button className="w-full h-14 text-lg rounded-2xl bg-green-600 hover:bg-green-700 text-white mt-4">
              <ArrowLeft className="w-5 h-5 mr-2" /> होम पेज पर जाएं
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(120 40% 95%) 0%, hsl(0 0% 100%) 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-green-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              🌾 किसान रजिस्ट्रेशन
            </h1>
            <p className="text-green-200 text-sm" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              मेरा भारत दुकान
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-5 space-y-5 pb-10">
        {/* Name */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <User className="w-5 h-5 text-green-600" /> नाम (Name)
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="अपना नाम लिखें"
            className="h-14 text-lg rounded-2xl border-green-300 focus:border-green-500 bg-white"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />
        </div>

        {/* Farm Name */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <Leaf className="w-5 h-5 text-green-600" /> खेत/फार्म का नाम (Farm Name)
          </Label>
          <Input
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="अपने खेत या फार्म का नाम"
            className="h-14 text-lg rounded-2xl border-green-300 focus:border-green-500 bg-white"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />
        </div>

        {/* Category Grid */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            आप क्या बेचते हैं? (Category)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  category === cat.id
                    ? "border-green-600 bg-green-50 shadow-md scale-[1.02]"
                    : "border-green-200 bg-white hover:border-green-400"
                }`}
              >
                <span className="text-4xl">{cat.emoji}</span>
                <span
                  className="text-sm font-medium text-green-800 text-center"
                  style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <MapPin className="w-5 h-5 text-green-600" /> पता/लोकेशन (Location)
          </Label>
          {location ? (
            <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="text-green-800 font-medium text-sm" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  📍 स्थान जोड़ा गया
                </p>
                <p className="text-green-600 text-xs">{location}</p>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="w-full h-14 text-lg rounded-2xl bg-green-100 hover:bg-green-200 text-green-800 border-2 border-dashed border-green-400"
              variant="ghost"
            >
              {locationLoading ? (
                <span className="animate-pulse" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>📡 स्थान खोज रहे हैं...</span>
              ) : (
                <span className="flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  <MapPin className="w-6 h-6" /> मेरा स्थान जोड़ें
                </span>
              )}
            </Button>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <Phone className="w-5 h-5 text-green-600" /> व्हाट्सएप नंबर (WhatsApp No.)
          </Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10 अंक का नंबर"
            type="tel"
            inputMode="numeric"
            className="h-14 text-lg rounded-2xl border-green-300 focus:border-green-500 bg-white tracking-wider"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <Camera className="w-5 h-5 text-green-600" /> फोटो जोड़ें (Add Photo)
          </Label>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-green-400">
                <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute bottom-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                  ✅ फोटो जोड़ी गई
                </div>
              </div>
            ) : (
              <div className="w-full h-36 rounded-2xl border-2 border-dashed border-green-400 bg-green-50 flex flex-col items-center justify-center gap-2 hover:bg-green-100 transition-colors">
                <Camera className="w-10 h-10 text-green-500" />
                <span className="text-green-700 font-medium" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  📸 फोटो खींचें या चुनें
                </span>
              </div>
            )}
          </label>
        </div>

        {/* Plan Toggle */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-green-900 flex items-center gap-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            <Sparkles className="w-5 h-5 text-amber-500" /> प्रीमियम प्लान चुनें
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlan("basic")}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                plan === "basic"
                  ? "border-green-600 bg-green-50 shadow-md"
                  : "border-green-200 bg-white"
              }`}
            >
              <p className="text-2xl font-bold text-green-700">₹99</p>
              <p className="text-sm text-green-600 mt-1" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                /महीना
              </p>
              <p className="text-xs text-green-500 mt-1 font-medium" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                बेसिक
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("vip")}
              className={`p-4 rounded-2xl border-2 text-center transition-all relative overflow-hidden ${
                plan === "vip"
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-amber-200 bg-white"
              }`}
            >
              {plan === "vip" && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                  ⭐ VIP
                </div>
              )}
              <p className="text-2xl font-bold text-amber-600">₹999</p>
              <p className="text-sm text-amber-600 mt-1" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                /साल
              </p>
              <p className="text-xs text-amber-500 mt-1 font-medium" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                VIP (सबसे लोकप्रिय)
              </p>
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-16 text-xl rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg mt-4"
          style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
        >
          ✅ रजिस्टर करें
        </Button>
        <p className="text-center text-sm text-green-600" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          रजिस्ट्रेशन के बाद भारत मित्र आपसे संपर्क करेगी
        </p>
      </form>
    </div>
  );
};

export default KisanRegistration;
