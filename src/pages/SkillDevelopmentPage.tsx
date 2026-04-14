import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Wrench, Car, Scissors, Heart, Monitor, Sprout, Globe, BookOpen, Lightbulb, ChevronRight, ChevronLeft, ArrowLeft, Star, Award, Send, Image, Volume2, VolumeX, FileCheck, Trophy, BookMarked, Layers, List, ChevronDown, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCertificate } from "@/lib/generateCertificate";
import { bookCategories, type Book, type BookPage, type Chapter, type PdfItem } from "@/data/skillBooks";

/* ─── TTS ─── */
const speakHindi = (text: string) => {
  if (!("speechSynthesis" in window)) {
    toast({ title: "⚠️ आपका ब्राउज़र Text-to-Speech सपोर्ट नहीं करता" });
    return null;
  }
  window.speechSynthesis.cancel();
  const cleaned = text.replace(/\*\*/g, "").replace(/→/g, " से ").replace(/\|/g, ", ").replace(/┌|┐|└|┘|│|─|├|┤|▼|▲|═|╳|░|▓|█|◇|∆|●|◉/g, "");
  const u = new SpeechSynthesisUtterance(cleaned);
  u.lang = "hi-IN"; u.rate = 0.9;
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("hi"));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return u;
};
const stopSpeaking = () => window.speechSynthesis?.cancel();

/* ─── Exam Generator ─── */
const generateExam = (book: Book) => {
  const questions: { question: string; options: string[]; correct: number }[] = [];
  book.chapters.forEach(ch => ch.pages.forEach(p => {
    const lines = p.content.split("\n").filter(l => l.includes("**") && l.includes(":"));
    lines.slice(0, 2).forEach(line => {
      const clean = line.replace(/\*\*/g, "");
      const parts = clean.split(":");
      if (parts.length >= 2) {
        questions.push({
          question: `"${parts[0].trim()}" से क्या तात्पर्य है?`,
          options: [parts.slice(1).join(":").trim().substring(0, 80), "यह एक अन्य प्रक्रिया है", "इसकी जानकारी उपलब्ध नहीं", "उपरोक्त में से कोई नहीं"],
          correct: 0,
        });
      }
    });
  }));
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map(q => {
    const correctText = q.options[q.correct];
    const so = [...q.options].sort(() => Math.random() - 0.5);
    return { ...q, options: so, correct: so.indexOf(correctText) };
  });
};

/* ─── Render formatted content ─── */
const FormattedContent = ({ text }: { text: string }) => (
  <div className="space-y-1.5">
    {text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      const html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>')
        .replace(/\|(.*?)\|/g, '<span class="text-muted-foreground">|$1|</span>');
      return <p key={i} className="text-xs leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: html }} />;
    })}
  </div>
);

/* ═══════════════════════════════════
   E-BOOK READER COMPONENT
   ═══════════════════════════════════ */
const EBookReader = ({ book, onBack }: { book: Book; onBack: () => void }) => {
  const [showTOC, setShowTOC] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  // Flatten all pages
  const allPages: { page: BookPage; chapterTitle: string; chapterIdx: number; pageIdx: number }[] = [];
  book.chapters.forEach((ch, ci) => ch.pages.forEach((p, pi) => allPages.push({ page: p, chapterTitle: ch.title, chapterIdx: ci, pageIdx: pi })));

  const current = allPages[currentPage];
  const totalPages = allPages.length;

  const goPage = (n: number) => { stopSpeaking(); setIsSpeaking(false); setCurrentPage(Math.max(0, Math.min(n, totalPages - 1))); };

  const handleListen = () => {
    if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); return; }
    const text = `${current.page.title}। ${current.page.content.substring(0, 2000)}`;
    const u = speakHindi(text);
    if (u) { setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { stopSpeaking(); onBack(); }} className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 shrink-0">
            <ArrowLeft className="h-4 w-4" /> वापस
          </button>
          <h1 className="text-xs font-bold font-hindi truncate flex-1 text-center">{book.icon} {book.titleHi}</h1>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary-foreground hover:bg-white/20" onClick={() => setShowTOC(!showTOC)}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] opacity-60 text-center mt-0.5">पृष्ठ {currentPage + 1} / {totalPages} — {current.chapterTitle}</p>
      </div>

      {/* TOC Overlay */}
      {showTOC && (
        <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setShowTOC(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-xs bg-background shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border">
              <h2 className="font-bold font-hindi text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> विषय-सूची (Contents)</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <div className="p-3 space-y-3">
                {book.chapters.map((ch, ci) => {
                  let pageOffset = 0;
                  for (let i = 0; i < ci; i++) pageOffset += book.chapters[i].pages.length;
                  return (
                    <div key={ci}>
                      <p className="text-xs font-bold text-primary mb-1">{ch.title}</p>
                      {ch.pages.map((p, pi) => (
                        <button key={pi} onClick={() => { goPage(pageOffset + pi); setShowTOC(false); }}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${currentPage === pageOffset + pi ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-accent"}`}>
                          {pageOffset + pi + 1}. {p.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Page Content */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {/* Page Title */}
          <div className="mb-4">
            <Badge variant="secondary" className="text-[9px] mb-2">{current.chapterTitle}</Badge>
            <h2 className="text-base font-bold font-hindi text-foreground">{current.page.title}</h2>
          </div>

          {/* Listen Button */}
          <div className="flex gap-2 mb-4">
            <Button onClick={handleListen} size="sm" variant={isSpeaking ? "destructive" : "secondary"} className="flex-1 gap-2 text-xs">
              {isSpeaking ? <><VolumeX className="h-3.5 w-3.5" /> बंद करें</> : <><Volume2 className="h-3.5 w-3.5" /> 🔊 सुनिए</>}
            </Button>
            {book.govtPdfUrl && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                <a href={book.govtPdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> 📕 सरकारी PDF
                </a>
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-4">
            <FormattedContent text={current.page.content} />
          </div>

          {/* Diagram */}
          {current.page.diagram && (
            <div className="bg-muted/50 border border-dashed border-primary/30 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold text-primary">Technical Diagram / चित्र</span>
              </div>
              <pre className="text-[10px] text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">{current.page.diagram}</pre>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background border-t border-border px-3 py-2 flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => goPage(currentPage - 1)} className="gap-1 text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> पिछला
        </Button>

        {currentPage === totalPages - 1 ? (
          <Button size="sm" className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => setExamOpen(true)}>
            <Award className="h-3.5 w-3.5" /> 📝 परीक्षा दें
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground">{currentPage + 1}/{totalPages}</span>
        )}

        <Button size="sm" variant="outline" disabled={currentPage >= totalPages - 1} onClick={() => goPage(currentPage + 1)} className="gap-1 text-xs">
          अगला <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Exam Dialog */}
      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        {examOpen && <ExamDialog bookTitle={book.titleHi} book={book} onClose={() => setExamOpen(false)} />}
      </Dialog>
    </div>
  );
};

/* ─── Exam Dialog ─── */
const ExamDialog = ({ bookTitle, book, onClose }: { bookTitle: string; book: Book; onClose: () => void }) => {
  const [questions] = useState(() => generateExam(book));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState("");

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.options[q.correct]) s++; });
    setScore(s); setSubmitted(true);
  };

  const passed = score >= Math.ceil(questions.length * 0.6);

  if (questions.length === 0) {
    return (
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle>परीक्षा उपलब्ध नहीं</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">पर्याप्त प्रश्न नहीं हैं।</p>
        <DialogFooter><Button onClick={onClose}>बंद करें</Button></DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <FileCheck className="h-5 w-5 text-primary" />
          {submitted ? (passed ? "🎉 बधाई! परीक्षा पास!" : "❌ पुनः प्रयास करें") : `📝 Final Master Exam`}
        </DialogTitle>
      </DialogHeader>

      {!submitted ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">60% अंक पास होने के लिए ज़रूरी ({Math.ceil(questions.length * 0.6)}/{questions.length})</p>
          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2 border-b border-border pb-3">
              <p className="text-xs font-bold">प्रश्न {qi + 1}: {q.question}</p>
              <RadioGroup value={answers[qi] || ""} onValueChange={v => setAnswers(p => ({ ...p, [qi]: v }))}>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`q${qi}o${oi}`} />
                    <Label htmlFor={`q${qi}o${oi}`} className="text-xs cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleSubmit} className="w-full gap-2" disabled={Object.keys(answers).length < questions.length}>
            <FileCheck className="h-4 w-4" /> Submit Exam
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className={`text-4xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>{score}/{questions.length}</div>
          <p className="text-sm text-muted-foreground">{passed ? "बहुत बढ़िया! Certificate डाउनलोड करें!" : "60% ज़रूरी है। दोबारा कोशिश करें।"}</p>
          {passed && (
            <div className="space-y-2">
              <Input placeholder="अपना नाम लिखें" value={userName} onChange={e => setUserName(e.target.value)} className="text-center" />
              <Button onClick={() => {
                downloadCertificate({ userName: userName || "Student", courseName: bookTitle, score, totalQuestions: questions.length, date: new Date().toLocaleDateString("hi-IN") });
                toast({ title: "🎓 Certificate Downloaded!" });
              }} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Trophy className="h-4 w-4" /> 🎓 Certificate डाउनलोड करें
              </Button>
            </div>
          )}
          <Button onClick={onClose} variant="outline" className="w-full">बंद करें</Button>
        </div>
      )}
    </DialogContent>
  );
};

/* ═══════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════ */
const SkillDevelopmentPage = () => {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [businessIdea, setBusinessIdea] = useState("");
  const [pdfSearch, setPdfSearch] = useState("");

  // All books flat for search
  const allBooks = bookCategories.flatMap(c => c.books.map(b => ({ ...b, categoryTitle: c.title })));
  const filtered = search.trim()
    ? allBooks.filter(b => b.titleHi.toLowerCase().includes(search.toLowerCase()) || b.title.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (selectedBook) {
    return <EBookReader book={selectedBook} onBack={() => { setSelectedBook(null); stopSpeaking(); }} />;
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
              <p className="text-[10px] opacity-80">E-Books, Theory, Diagrams, Audio, Exam & Certificate</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="खोजें... Mobile Repair, Tally, संविधान..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background/90 text-foreground border-0 h-10" />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div className="container mx-auto px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} पुस्तकें मिलीं</p>
          {filtered.map(b => (
            <Card key={b.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedBook(b)}>
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{b.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm font-hindi">{b.titleHi}</p>
                  <p className="text-[10px] text-muted-foreground">{b.totalPages} पृष्ठ • {b.chapters.length} अध्याय</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!search.trim() && (
        <div className="container mx-auto px-4 py-4 space-y-6">
          {bookCategories.map(cat => (
            <div key={cat.id}>
              <h2 className="text-sm font-bold font-hindi text-foreground mb-3 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-primary" /> {cat.title}
                <Badge variant="secondary" className="text-[9px]">{cat.books.length} Books</Badge>
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {cat.books.map(book => (
                  <Card key={book.id} className="cursor-pointer border-border hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
                    onClick={() => setSelectedBook(book)}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm text-xl shrink-0`}>
                        {book.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm font-hindi text-foreground leading-tight">{book.titleHi}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{book.description}</p>
                        <div className="flex gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[9px]">📖 {book.totalPages} Pages</Badge>
                          <Badge variant="outline" className="text-[9px]">📚 {book.chapters.length} Chapters</Badge>
                          <Badge className="text-[9px] bg-green-600">🎓 Certificate</Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
      )}
    </div>
  );
};

export default SkillDevelopmentPage;
