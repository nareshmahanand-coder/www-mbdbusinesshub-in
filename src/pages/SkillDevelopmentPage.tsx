import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Wrench, Car, Scissors, Heart, Monitor, Sprout, Globe, BookOpen, Lightbulb, Play, ChevronRight, ArrowLeft, Star, Award, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const skillCategories = [
  {
    id: "electronics",
    icon: Wrench,
    title: "टेक्निकल और इलेक्ट्रॉनिक्स रिपेयरिंग",
    subtitle: "All Electronics Repair",
    color: "from-blue-600 to-cyan-500",
    bg: "bg-blue-50",
    topics: [
      { name: "मोबाइल रिपेयरिंग", desc: "Screen, Battery, Motherboard, Software", video: "https://youtube.com/results?search_query=mobile+repairing+course+hindi" },
      { name: "लैपटॉप रिपेयरिंग", desc: "Hardware & Software troubleshooting", video: "https://youtube.com/results?search_query=laptop+repairing+course+hindi" },
      { name: "LED/LCD TV रिपेयरिंग", desc: "Panel, Power Supply, Mainboard", video: "https://youtube.com/results?search_query=led+tv+repairing+hindi" },
      { name: "AC रिपेयरिंग", desc: "Split AC, Window AC, Inverter AC", video: "https://youtube.com/results?search_query=ac+repairing+course+hindi" },
      { name: "फ्रिज रिपेयरिंग", desc: "Compressor, Gas Charging, Thermostat", video: "https://youtube.com/results?search_query=fridge+repairing+hindi" },
      { name: "वॉशिंग मशीन रिपेयरिंग", desc: "Semi-Auto, Fully-Auto, Front Load", video: "https://youtube.com/results?search_query=washing+machine+repair+hindi" },
      { name: "कैमरा और CCTV", desc: "Installation & Repair", video: "https://youtube.com/results?search_query=cctv+installation+course+hindi" },
      { name: "पंखा / कूलर रिपेयरिंग", desc: "Motor winding, Capacitor, Regulator", video: "https://youtube.com/results?search_query=fan+motor+winding+hindi" },
    ],
  },
  {
    id: "automobile",
    icon: Car,
    title: "ऑटोमोबाइल इंजीनियरिंग",
    subtitle: "Vehicle Repair & Engineering",
    color: "from-orange-600 to-amber-500",
    bg: "bg-orange-50",
    topics: [
      { name: "बाइक / स्कूटर रिपेयरिंग", desc: "Engine, Electrical, Suspension", video: "https://youtube.com/results?search_query=bike+repairing+course+hindi" },
      { name: "कार मैकेनिक", desc: "Engine overhaul, Transmission, AC", video: "https://youtube.com/results?search_query=car+mechanic+course+hindi" },
      { name: "डीजल इंजन", desc: "Truck, Tractor, JCB Engine Work", video: "https://youtube.com/results?search_query=diesel+engine+repair+hindi" },
      { name: "ऑटो इलेक्ट्रिकल", desc: "Wiring, Sensors, ECU Diagnostics", video: "https://youtube.com/results?search_query=auto+electrical+course+hindi" },
      { name: "पेंटिंग और डेंटिंग", desc: "Body work, Paint matching", video: "https://youtube.com/results?search_query=car+denting+painting+hindi" },
      { name: "EV रिपेयरिंग", desc: "Electric Vehicle Battery & Motor", video: "https://youtube.com/results?search_query=electric+vehicle+repair+hindi" },
    ],
  },
  {
    id: "modern-skills",
    icon: Scissors,
    title: "आधुनिक हुनर",
    subtitle: "Modern Skills & Trades",
    color: "from-pink-600 to-rose-400",
    bg: "bg-pink-50",
    topics: [
      { name: "टेलरिंग / सिलाई", desc: "कटिंग, स्टिचिंग, डिज़ाइनिंग", video: "https://youtube.com/results?search_query=tailoring+course+hindi" },
      { name: "ब्यूटी पार्लर कोर्स", desc: "Facial, Hair, Bridal Makeup", video: "https://youtube.com/results?search_query=beauty+parlour+course+hindi" },
      { name: "कुकिंग / बेकिंग", desc: "Professional Cooking & Bakery", video: "https://youtube.com/results?search_query=cooking+course+hindi" },
      { name: "ड्राइविंग नियम", desc: "Traffic Rules, License Process", video: "https://youtube.com/results?search_query=driving+rules+india+hindi" },
      { name: "प्लम्बिंग कोर्स", desc: "Pipe fitting, Sanitary work", video: "https://youtube.com/results?search_query=plumbing+course+hindi" },
      { name: "इलेक्ट्रीशियन कोर्स", desc: "House wiring, Industrial wiring", video: "https://youtube.com/results?search_query=electrician+course+hindi" },
    ],
  },
  {
    id: "medical",
    icon: Heart,
    title: "मेडिकल और हेल्थ",
    subtitle: "Medical & Health Knowledge",
    color: "from-red-600 to-rose-500",
    bg: "bg-red-50",
    topics: [
      { name: "नर्सिंग कोर्स", desc: "Patient care, First Aid, Injections", video: "https://youtube.com/results?search_query=nursing+course+hindi" },
      { name: "होम्योपैथिक दवाएं", desc: "Common medicines & usage", video: "https://youtube.com/results?search_query=homeopathy+course+hindi" },
      { name: "एलोपैथिक ज्ञान", desc: "General medicines awareness", video: "https://youtube.com/results?search_query=allopathy+basics+hindi" },
      { name: "आयुर्वेदिक चिकित्सा", desc: "जड़ी-बूटी, काढ़ा, नुस्खे", video: "https://youtube.com/results?search_query=ayurvedic+medicine+hindi" },
      { name: "योग और फिटनेस", desc: "Daily yoga, Exercise routines", video: "https://youtube.com/results?search_query=yoga+course+hindi" },
      { name: "फर्स्ट एड", desc: "Emergency treatment knowledge", video: "https://youtube.com/results?search_query=first+aid+training+hindi" },
    ],
  },
  {
    id: "computer",
    icon: Monitor,
    title: "कंप्यूटर और आईटी",
    subtitle: "Computer & IT Skills",
    color: "from-violet-600 to-purple-500",
    bg: "bg-violet-50",
    topics: [
      { name: "बेसिक कंप्यूटर", desc: "Windows, MS Office, Internet", video: "https://youtube.com/results?search_query=basic+computer+course+hindi" },
      { name: "Tally / अकाउंटिंग", desc: "GST, Billing, Tally Prime", video: "https://youtube.com/results?search_query=tally+prime+course+hindi" },
      { name: "PGDCA कोर्स", desc: "Full diploma syllabus", video: "https://youtube.com/results?search_query=pgdca+course+hindi" },
      { name: "Excel मास्टर", desc: "Formulas, Pivot, Macros, VBA", video: "https://youtube.com/results?search_query=excel+complete+course+hindi" },
      { name: "AI और ChatGPT", desc: "Artificial Intelligence basics", video: "https://youtube.com/results?search_query=ai+course+beginners+hindi" },
      { name: "कोडिंग / प्रोग्रामिंग", desc: "Python, Web Dev, App Dev", video: "https://youtube.com/results?search_query=coding+course+hindi+beginners" },
    ],
  },
  {
    id: "agriculture",
    icon: Sprout,
    title: "आधुनिक कृषि",
    subtitle: "Modern Agriculture & Farming",
    color: "from-green-600 to-emerald-500",
    bg: "bg-green-50",
    topics: [
      { name: "एडवांस खेती तकनीक", desc: "Drip Irrigation, Poly House", video: "https://youtube.com/results?search_query=modern+farming+techniques+hindi" },
      { name: "जैविक खेती", desc: "Organic Farming, Vermicompost", video: "https://youtube.com/results?search_query=organic+farming+hindi" },
      { name: "पशुपालन", desc: "Dairy, Poultry, Goat farming", video: "https://youtube.com/results?search_query=animal+husbandry+hindi" },
      { name: "मशरूम की खेती", desc: "Oyster, Button mushroom", video: "https://youtube.com/results?search_query=mushroom+farming+hindi" },
      { name: "मधुमक्खी पालन", desc: "Honey Bee farming", video: "https://youtube.com/results?search_query=beekeeping+hindi" },
      { name: "नंदा एग्रो फार्म", desc: "Modern integrated farming", video: "https://youtube.com/results?search_query=integrated+farming+hindi" },
    ],
  },
];

const knowledgeCategories = [
  {
    id: "india",
    icon: Globe,
    title: "भारत का कोना-कोना",
    subtitle: "Know Every Indian State",
    color: "from-amber-600 to-yellow-500",
    topics: [
      { name: "उत्तर भारत", desc: "UP, MP, Rajasthan, Bihar, Jharkhand", video: "https://youtube.com/results?search_query=north+india+states+hindi" },
      { name: "दक्षिण भारत", desc: "Tamil Nadu, Kerala, Karnataka, AP, Telangana", video: "https://youtube.com/results?search_query=south+india+culture+hindi" },
      { name: "पूर्वोत्तर भारत", desc: "Assam, Meghalaya, Manipur, Nagaland...", video: "https://youtube.com/results?search_query=northeast+india+hindi" },
      { name: "पश्चिम भारत", desc: "Gujarat, Maharashtra, Goa", video: "https://youtube.com/results?search_query=west+india+culture+hindi" },
      { name: "भारतीय भाषाएं", desc: "22 Official Languages & Scripts", video: "https://youtube.com/results?search_query=indian+languages+hindi" },
    ],
  },
  {
    id: "world",
    icon: Globe,
    title: "विश्व इतिहास और भूगोल",
    subtitle: "World History & Geography",
    color: "from-teal-600 to-cyan-500",
    topics: [
      { name: "विश्व इतिहास", desc: "Ancient to Modern world history", video: "https://youtube.com/results?search_query=world+history+hindi" },
      { name: "विश्व भूगोल", desc: "Continents, Countries, Capitals", video: "https://youtube.com/results?search_query=world+geography+hindi" },
      { name: "प्रथम PM / राष्ट्रपति", desc: "First leaders of every country", video: "https://youtube.com/results?search_query=first+pm+president+countries+hindi" },
      { name: "विश्व युद्ध", desc: "WWI, WWII & Cold War", video: "https://youtube.com/results?search_query=world+war+hindi" },
    ],
  },
  {
    id: "constitution",
    icon: BookOpen,
    title: "संविधान और कानून",
    subtitle: "Indian Constitution & Laws",
    color: "from-indigo-600 to-blue-500",
    topics: [
      { name: "भारतीय संविधान", desc: "Preamble, Articles, Amendments", video: "https://youtube.com/results?search_query=indian+constitution+hindi" },
      { name: "मौलिक अधिकार", desc: "Fundamental Rights (Art 12-35)", video: "https://youtube.com/results?search_query=fundamental+rights+hindi" },
      { name: "रोज़मर्रा के कानून", desc: "Consumer, Property, Labour Laws", video: "https://youtube.com/results?search_query=daily+laws+india+hindi" },
      { name: "RTI और PIL", desc: "Right to Information, Public Interest", video: "https://youtube.com/results?search_query=rti+pil+hindi" },
    ],
  },
  {
    id: "education",
    icon: Star,
    title: "शिक्षा और विज्ञान",
    subtitle: "Education, Science & GK",
    color: "from-yellow-600 to-orange-500",
    topics: [
      { name: "अर्थशास्त्र", desc: "Economics: GDP, Inflation, Budget", video: "https://youtube.com/results?search_query=economics+hindi+basics" },
      { name: "विज्ञान", desc: "Physics, Chemistry, Biology basics", video: "https://youtube.com/results?search_query=science+hindi+basics" },
      { name: "सामान्य ज्ञान (GK)", desc: "Current Affairs & Static GK", video: "https://youtube.com/results?search_query=gk+hindi+2024" },
      { name: "गणित", desc: "Arithmetic, Algebra, Geometry", video: "https://youtube.com/results?search_query=maths+basics+hindi" },
    ],
  },
];

const SkillDevelopmentPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [businessIdea, setBusinessIdea] = useState("");

  const allTopics = [
    ...skillCategories.flatMap((c) => c.topics.map((t) => ({ ...t, category: c.title }))),
    ...knowledgeCategories.flatMap((c) => c.topics.map((t) => ({ ...t, category: c.title }))),
  ];

  const filteredTopics = search.trim()
    ? allTopics.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleSubmitIdea = () => {
    if (!businessIdea.trim()) return;
    toast({ title: "✅ आइडिया सबमिट हो गया!", description: "Admin approval के बाद आपको Digital Reward मिलेगा।" });
    setBusinessIdea("");
  };

  const selectedSkill = skillCategories.find((c) => c.id === selectedCategory);
  const selectedKnowledge = knowledgeCategories.find((c) => c.id === selectedCategory);
  const selected = selectedSkill || selectedKnowledge;

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
          <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-sm mb-2 opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> वापस जाएं
          </button>
          <div className="flex items-center gap-3">
            <selected.icon className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">{selected.title}</h1>
              <p className="text-xs opacity-80">{selected.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 space-y-3">
          {selected.topics.map((topic, i) => (
            <Card key={i} className="overflow-hidden border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold font-hindi text-foreground">{topic.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{topic.desc}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">📖 Lesson</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={topic.video} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs">
                      <Play className="h-3.5 w-3.5" /> Watch Video
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <GraduationCap className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">कौशल विकास</h1>
              <p className="text-[10px] opacity-80">Skill Development & Knowledge Hub</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोजें... Mobile Repair, Tally, संविधान, Cooking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/90 text-foreground border-0 h-10"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div className="container mx-auto px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground font-hindi">{filteredTopics.length} परिणाम मिले</p>
          {filteredTopics.map((t, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm font-hindi text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.category}</p>
                </div>
                <a href={t.video} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <Play className="h-3 w-3" /> Video
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!search.trim() && (
        <div className="container mx-auto px-4 py-4 space-y-6">
          {/* Skills Section */}
          <div>
            <h2 className="text-base font-bold font-hindi text-foreground mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> कौशल प्रशिक्षण
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {skillCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Topics</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Knowledge Section */}
          <div>
            <h2 className="text-base font-bold font-hindi text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> विश्व ज्ञान महासागर
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {knowledgeCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Topics</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Business Ideas Section */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-hindi flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" /> नया बिज़नेस आइडिया दें
                <Badge className="text-[9px] bg-primary">🏆 Reward</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-hindi">
                अपना बिज़नेस आइडिया सबमिट करें। Approval पर Digital Reward मिलेगा!
              </p>
              <Textarea
                placeholder="अपना बिज़नेस आइडिया यहां लिखें..."
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="text-sm min-h-[80px]"
              />
              <Button onClick={handleSubmitIdea} className="w-full gap-2" size="sm">
                <Send className="h-3.5 w-3.5" /> सबमिट करें
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillDevelopmentPage;
