import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, ArrowLeft, BookOpen, ChevronRight, ExternalLink, Lightbulb, Send, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { bookCategories, type BookCategory, type PdfItem } from "@/data/skillBooks";
import { ExamDialog } from "@/components/skill/ExamDialog";
import { Award, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import certificateTemplateUrl from "@/assets/certificate-template.jpg";

/* ═══════════════════════════════════
   CATEGORY PDF LIBRARY VIEW
   ═══════════════════════════════════ */
const CategoryLibrary = ({ category, onBack }: { category: BookCategory; onBack: () => void }) => {
  const [pdfSearch, setPdfSearch] = useState("");
  const [examOpen, setExamOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  const filteredPdfs = category.pdfLibrary.filter(p =>
    !pdfSearch.trim() ||
    p.titleHi.toLowerCase().includes(pdfSearch.toLowerCase()) ||
    p.titleEn.toLowerCase().includes(pdfSearch.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(pdfSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onBack} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 shrink-0">
            <ArrowLeft className="h-4 w-4" /> वापस
          </button>
          <h1 className="text-sm font-bold font-hindi truncate flex-1 text-center">
            {category.icon} {category.title}
          </h1>
        </div>
        <p className="text-[10px] opacity-70 text-center mb-2">{category.titleHi}</p>

        {/* Search within category */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="PDF खोजें..."
            value={pdfSearch}
            onChange={e => setPdfSearch(e.target.value)}
            className="pl-9 bg-background/90 text-foreground border-0 h-9 text-xs"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Description */}
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed font-hindi bg-muted/50 p-3 rounded-lg border border-border">
          {category.descriptionHi}
        </p>

        {/* NGO Certification Banner */}
        <div className="mb-3 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-50 via-white to-green-50 dark:from-orange-950/20 dark:via-background dark:to-green-950/20 px-3 py-2 text-center">
          <p className="text-[11px] font-bold font-hindi text-foreground leading-snug">
            लाइव शो शिक्षा एवं सामाजिक कल्याण समिति <span className="text-orange-700 dark:text-orange-400">(State Level NGO)</span> द्वारा प्रमाणित सर्टिफिकेट
          </p>
          <p className="text-[9px] font-bold text-red-700 dark:text-red-400 mt-0.5">Reg. No. 122202059372</p>
        </div>

        {/* Certificate Preview */}
        <div className="relative mb-3 rounded-xl border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-orange-950/20 dark:via-background dark:to-green-950/20 p-3 shadow-sm">
          <span className="absolute top-1 right-2 text-[8px] font-bold text-red-700 dark:text-red-400">Reg. No. 122202059372</span>
          <div className="flex items-center gap-3">
            {/* Mini certificate mock */}
            <div className="relative shrink-0 w-[110px] h-[78px] rounded border-2 border-blue-900 bg-white overflow-hidden shadow">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-orange-500" />
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-green-700" />
              <div className="flex flex-col items-center justify-center h-full text-center px-1">
                <div className="text-[6px] font-bold text-green-700 leading-tight">लाइव शो फाउंडेशन</div>
                <div className="text-[5px] text-red-700 font-bold">Reg. 122202059372</div>
                <div className="w-6 h-6 rounded-full border-[1.5px] border-blue-900 my-0.5 relative">
                  <div className="absolute inset-1 rounded-full border border-blue-900/50" />
                </div>
                <div className="text-[5px] text-blue-900 font-bold">Certificate</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <Award className="h-3.5 w-3.5 text-orange-600" />
                <p className="text-[11px] font-bold font-hindi text-foreground">लाइव शो फाउंडेशन सर्टिफिकेट प्रोग्राम</p>
              </div>
              <p className="text-[9px] font-hindi text-muted-foreground leading-snug">
                कोर्स और परीक्षा पूर्ण करें, डिजिटल सर्टिफिकेट प्राप्त करें।
              </p>
              <p className="text-[8px] font-hindi text-orange-700 dark:text-orange-400 mt-0.5">
                Issued by: लाइव शो शिक्षा एवं सामाजिक कल्याण समिति
              </p>
            </div>
          </div>
        </div>

        {/* परीक्षा केंद्र (Exam Center) */}
        <button
          onClick={() => setExamOpen(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Award className="h-5 w-5" />
          <span className="text-sm font-bold font-hindi">कोर्स और परीक्षा पूर्ण करें, डिजिटल सर्टिफिकेट प्राप्त करें</span>
        </button>

        {/* View Sample Certificate (clean master template, no seal/signature) */}
        <button
          onClick={() => setSampleOpen(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 shadow-sm hover:bg-orange-100 dark:hover:bg-orange-950/30 active:scale-[0.98] transition-all"
        >
          <Eye className="h-5 w-5" />
          <span className="text-sm font-bold font-hindi">नमूना प्रमाण पत्र देखें (View Sample Certificate)</span>
        </button>

        <Dialog open={sampleOpen} onOpenChange={setSampleOpen}>
          <DialogContent className="max-w-md p-3">
            <DialogHeader>
              <DialogTitle className="text-sm font-hindi text-center">
                नमूना प्रमाण पत्र — Sample Certificate
              </DialogTitle>
              <DialogDescription className="text-[10px] text-center font-hindi">
                यह केवल एक झलक है। परीक्षा पास करने के बाद आपका असली हस्ताक्षरित प्रमाण पत्र जारी होगा।
              </DialogDescription>
            </DialogHeader>
            <div
              className="relative rounded-lg overflow-hidden border border-border bg-white select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={certificateTemplateUrl}
                alt="Sample certificate preview"
                draggable={false}
                className="pointer-events-none w-full select-none"
              />
              {/* Diagonal SAMPLE watermark so it can't be misused */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rotate-[-25deg] text-5xl font-black text-orange-600/30 tracking-widest">
                  नमूना • SAMPLE
                </span>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground font-hindi mt-1">
              📌 असली प्रमाण पत्र पर NGO की मुहर और अध्यक्ष के हस्ताक्षर होंगे।
            </p>
          </DialogContent>
        </Dialog>

        <ExamDialog
          open={examOpen}
          onClose={() => setExamOpen(false)}
          categoryId={category.id}
          categoryTitle={category.title}
        />

        {category.pdfLibrary.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-bold font-hindi text-foreground mb-1">📚 पुस्तकें जल्द आ रही हैं</h3>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              इस विभाग में PDF पुस्तकें जल्द ही अपलोड की जाएंगी। कृपया बाद में देखें।
            </p>
          </div>
        ) : (
          /* PDF Grid */
          <>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-green-700" />
              <h3 className="text-xs font-bold font-hindi text-foreground">📕 डिजिटल PDF लाइब्रेरी</h3>
              <Badge variant="secondary" className="text-[9px]">{category.pdfLibrary.length} पुस्तकें</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredPdfs.map(pdf => (
                <a
                  key={pdf.id}
                  href={pdf.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-green-500 hover:shadow-md transition-all active:scale-[0.97]"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">
                    {pdf.icon}
                  </div>
                  <p className="text-[10px] font-bold font-hindi text-foreground text-center leading-tight">{pdf.titleHi}</p>
                  <div className="flex items-center gap-1 text-[9px] text-green-700 font-medium">
                    <ExternalLink className="h-3 w-3" /> पुस्तक पढ़ें
                  </div>
                </a>
              ))}
            </div>

            {filteredPdfs.length === 0 && pdfSearch.trim() && (
              <p className="text-[10px] text-muted-foreground text-center py-6">कोई PDF नहीं मिली — "{pdfSearch}"</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════ */
const SkillDevelopmentPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(null);
  const [businessIdea, setBusinessIdea] = useState("");

  // Search across all PDFs
  const allPdfs = bookCategories.flatMap(c => c.pdfLibrary.map(p => ({ ...p, categoryTitle: c.title, categoryIcon: c.icon, category: c })));
  const filteredPdfs = search.trim()
    ? allPdfs.filter(p =>
        p.titleHi.toLowerCase().includes(search.toLowerCase()) ||
        p.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        p.categoryTitle.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Filter categories by search
  const filteredCategories = search.trim()
    ? bookCategories.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.titleHi.toLowerCase().includes(search.toLowerCase())
      )
    : bookCategories;

  if (selectedCategory) {
    return <CategoryLibrary category={selectedCategory} onBack={() => setSelectedCategory(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            <GraduationCap className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">कौशल विकास — डिजिटल लाइब्रेरी</h1>
              <p className="text-[10px] opacity-80">100% Original PDF पुस्तकें</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोजें... मशरूम, पशुपालन, Tally..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background/90 text-foreground border-0 h-10"
            />
          </div>
        </div>
      </div>

      {/* Search Results — PDFs */}
      {search.trim() && filteredPdfs.length > 0 && (
        <div className="container mx-auto px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">{filteredPdfs.length} PDF पुस्तकें मिलीं</p>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {filteredPdfs.map(pdf => (
              <a
                key={pdf.id}
                href={pdf.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:border-green-500 hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-lg shadow-sm">
                  {pdf.icon}
                </div>
                <p className="text-[10px] font-bold font-hindi text-foreground text-center leading-tight">{pdf.titleHi}</p>
                <p className="text-[8px] text-muted-foreground">{pdf.categoryIcon} {pdf.categoryTitle}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="container mx-auto px-4 py-4 space-y-3">
        {(search.trim() ? filteredCategories : bookCategories).map(cat => (
          <Card
            key={cat.id}
            className="cursor-pointer border-border hover:shadow-lg hover:border-primary/30 transition-all active:scale-[0.98]"
            onClick={() => setSelectedCategory(cat)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm text-2xl shrink-0`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm font-hindi text-foreground leading-tight">{cat.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cat.titleHi}</p>
                <div className="flex gap-2 mt-1.5">
                  {cat.pdfLibrary.length > 0 ? (
                    <Badge className="text-[9px] bg-green-700 text-white">📕 {cat.pdfLibrary.length} PDF Books</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px]">📂 जल्द आ रही हैं</Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}

        {/* Business Ideas */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-hindi flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> नया बिज़नेस आइडिया दें
              <Badge className="text-[9px] bg-primary">🏆 Reward</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-hindi">Approval पर Digital Reward मिलेगा!</p>
            <Textarea placeholder="अपना बिज़नेस आइडिया यहां लिखें..." value={businessIdea} onChange={e => setBusinessIdea(e.target.value)} className="text-sm min-h-[80px]" />
            <Button onClick={() => { if (!businessIdea.trim()) return; toast({ title: "✅ आइडिया सबमिट हो गया!" }); setBusinessIdea(""); }} className="w-full gap-2" size="sm">
              <Send className="h-3.5 w-3.5" /> सबमिट करें
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillDevelopmentPage;
