import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, RotateCcw, Download, Image as ImageIcon, CheckCircle2, XCircle, Camera, Timer, ShieldAlert, Lock } from "lucide-react";
import { buildQuizForCategory, type QuizQuestion } from "@/data/categoryQuizzes";

interface BilingualQuestion extends QuizQuestion {
  q_en?: string;
  options_en?: string[];
}
import {
  downloadCertificate,
  downloadCertificateImage,
  generateCertificateId,
  type CertificateData,
} from "@/lib/generateCertificate";
import { supabase } from "@/integrations/supabase/client";

type Phase = "name" | "quiz" | "result" | "locked" | "terminated";

const PER_QUESTION_SECS = 30;
const TOTAL_EXAM_SECS = 30 * 60; // 30 minutes
const COOLDOWN_HOURS = 24;
const lockKey = (catId: string) => `examLock:${catId}`;

interface Props {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryTitle: string;
}

export const ExamDialog = ({ open, onClose, categoryId, categoryTitle }: Props) => {
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("3 महीने का कोर्स");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [questions, setQuestions] = useState<BilingualQuestion[]>([]);
  const [translating, setTranslating] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [certId, setCertId] = useState("");
  const [qSecs, setQSecs] = useState(PER_QUESTION_SECS);
  const [totalSecs, setTotalSecs] = useState(TOTAL_EXAM_SECS);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef<Phase>("name");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Pre-fill from profile + check 24h lockout when opened
  useEffect(() => {
    if (!open) return;
    const raw = localStorage.getItem(lockKey(categoryId));
    if (raw) {
      const until = parseInt(raw, 10);
      if (until > Date.now()) {
        setLockedUntil(until);
        setPhase("locked");
        return;
      } else {
        localStorage.removeItem(lockKey(categoryId));
      }
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.display_name && !name) setName(prof.display_name);
      if (prof?.avatar_url && !photoUrl) setPhotoUrl(prof.avatar_url);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Apply 24h lockout & terminate
  const applyLockout = (reason: string) => {
    const until = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
    localStorage.setItem(lockKey(categoryId), String(until));
    setLockedUntil(until);
    setTerminationReason(reason);
    setPhase("terminated");
  };

  // Auto-advance: skipped questions are locked (cannot revisit)
  const advanceQuestion = () => {
    setCurrent((c) => {
      if (c >= questions.length - 1) {
        // last question — auto submit
        setCertId(generateCertificateId());
        setPhase("result");
        return c;
      }
      setQSecs(PER_QUESTION_SECS);
      return c + 1;
    });
  };

  // Per-question 30s timer
  useEffect(() => {
    if (phase !== "quiz") return;
    setQSecs(PER_QUESTION_SECS);
    const id = setInterval(() => {
      setQSecs((s) => {
        if (s <= 1) {
          clearInterval(id);
          // time up — skip & lock this question
          setTimeout(advanceQuestion, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current]);

  // Global 30-min timer
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = setInterval(() => {
      setTotalSecs((s) => {
        if (s <= 1) {
          clearInterval(id);
          setCertId(generateCertificateId());
          setPhase("result");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Anti-cheat: tab/app switch, blur, screenshot blocking
  useEffect(() => {
    if (phase !== "quiz") return;

    const onVis = () => {
      if (document.hidden && phaseRef.current === "quiz") {
        applyLockout("आपने ऐप छोड़ दिया / दूसरी विंडो पर गए");
      }
    };
    const onBlur = () => {
      if (phaseRef.current === "quiz") {
        applyLockout("परीक्षा विंडो से फोकस हटाया गया");
      }
    };
    const blockKey = (e: KeyboardEvent) => {
      // Block PrintScreen, Ctrl/Cmd+P, Ctrl+Shift+S, Win+Shift+S, F12, etc.
      const k = e.key;
      if (
        k === "PrintScreen" ||
        ((e.ctrlKey || e.metaKey) && (k === "p" || k === "P" || k === "s" || k === "S")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === "s" || k === "S" || k === "i" || k === "I")) ||
        k === "F12"
      ) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText("").catch(() => {});
      }
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", blockKey, true);
    window.addEventListener("keyup", (e) => { if (e.key === "PrintScreen") navigator.clipboard?.writeText("").catch(() => {}); }, true);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);

    // Disable text selection during exam
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", blockKey, true);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.body.style.userSelect = prevUserSelect;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handlePhotoFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startExam = async () => {
    if (!name.trim() || name.trim().length < 2) return;
    const baseQs = buildQuizForCategory(categoryId);
    setQuestions(baseQs);
    setAnswers({});
    setCurrent(0);
    setQSecs(PER_QUESTION_SECS);
    setTotalSecs(TOTAL_EXAM_SECS);
    setPhase("quiz");

    // Fetch English translations in background — bilingual display
    const cacheKey = `quizTrans:${categoryId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const trans = JSON.parse(cached);
        if (Array.isArray(trans) && trans.length === baseQs.length) {
          setQuestions(baseQs.map((q, i) => ({ ...q, q_en: trans[i]?.q_en, options_en: trans[i]?.options_en })));
          return;
        }
      } catch { /* ignore */ }
    }
    setTranslating(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-quiz`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ questions: baseQs.map((q) => ({ q: q.q, options: q.options })) }),
      });
      if (resp.ok) {
        const { translations } = await resp.json();
        sessionStorage.setItem(cacheKey, JSON.stringify(translations));
        setQuestions(baseQs.map((q, i) => ({ ...q, q_en: translations[i]?.q_en, options_en: translations[i]?.options_en })));
      }
    } catch (e) {
      console.error("translation fetch failed", e);
    } finally {
      setTranslating(false);
    }
  };

  const reset = () => {
    setPhase("name");
    setName("");
    setPhotoUrl("");
    setDuration("3 महीने का कोर्स");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setCertId("");
    setQSecs(PER_QUESTION_SECS);
    setTotalSecs(TOTAL_EXAM_SECS);
    setTerminationReason("");
  };

  const handleClose = () => {
    if (phaseRef.current === "quiz") {
      // Closing during exam = cheating attempt
      applyLockout("परीक्षा बीच में बंद की गई");
      return;
    }
    onClose();
    setTimeout(reset, 300);
  };

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    return correct;
  }, [answers, questions]);

  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passed = percent >= 60;

  const certData: CertificateData = {
    userName: name.trim(),
    courseName: categoryTitle,
    scorePercent: percent,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    certificateId: certId,
    courseDuration: duration,
    userPhotoUrl: photoUrl || undefined,
  };

  const q = questions[current];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const lockRemaining = lockedUntil ? Math.max(0, lockedUntil - Date.now()) : 0;
  const lockHrs = Math.floor(lockRemaining / 3600000);
  const lockMins = Math.floor((lockRemaining % 3600000) / 60000);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={phase === "quiz" ? { WebkitUserSelect: "none", userSelect: "none" } as React.CSSProperties : undefined}
      >
        {/* ───────── PHASE 1: NAME ───────── */}
        {phase === "name" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-hindi text-base">
                <GraduationCap className="h-5 w-5 text-primary" />
                परीक्षा केंद्र — {categoryTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px]">50</Badge> बहुविकल्पीय प्रश्न</p>
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-blue-700">30 sec</Badge> प्रति प्रश्न (छूटा तो वापस नहीं मिलेगा)</p>
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-purple-700">30 min</Badge> कुल समय</p>
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-green-700">60%</Badge> उत्तीर्ण अंक अनिवार्य</p>
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-red-600">⚠️</Badge> ऐप बदलने पर 24 घंटे लॉक</p>
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-orange-600">🏆</Badge> सफलता पर डिजिटल प्रमाणपत्र</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="examName" className="font-hindi text-sm">अपना पूरा नाम दर्ज करें *</Label>
                <Input
                  id="examName"
                  placeholder="जैसे: राम कुमार शर्मा"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  className="font-hindi"
                />
                <p className="text-[10px] text-muted-foreground">यह नाम प्रमाणपत्र पर छपेगा</p>
              </div>

              <div className="space-y-2">
                <Label className="font-hindi text-sm">पासपोर्ट साइज फोटो *</Label>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-16 rounded border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="user" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="w-full text-xs">
                      <Camera className="h-3.5 w-3.5 mr-1" /> {photoUrl ? "फोटो बदलें" : "फोटो अपलोड करें"}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
                    />
                    <p className="text-[9px] text-muted-foreground font-hindi">यह फोटो आपके सर्टिफिकेट पर छपेगी</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-hindi text-sm">कोर्स अवधि चुनें</Label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-hindi"
                >
                  <option value="1 महीने का कोर्स">1 महीने का कोर्स</option>
                  <option value="3 महीने का कोर्स">3 महीने का कोर्स</option>
                  <option value="6 महीने का डिप्लोमा">6 महीने का डिप्लोमा</option>
                  <option value="1 वर्ष का डिप्लोमा">1 वर्ष का डिप्लोमा</option>
                </select>
              </div>

              <div className="rounded-md border border-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 space-y-1">
                <p className="text-[10px] font-hindi text-red-900 dark:text-red-200 font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> सख्त नियम (Anti-Cheat):
                </p>
                <ul className="text-[10px] font-hindi text-red-800 dark:text-red-300 list-disc pl-4 space-y-0.5">
                  <li>ऐप मिनिमाइज़ / दूसरी विंडो पर जाने पर परीक्षा रद्द</li>
                  <li>स्क्रीनशॉट / स्क्रीन रिकॉर्डिंग ब्लॉक</li>
                  <li>एक बार छूटा प्रश्न दोबारा नहीं मिलेगा</li>
                  <li>नियम तोड़ने पर 24 घंटे का लॉक</li>
                </ul>
              </div>

              <div className="rounded-md border border-orange-300 bg-orange-50 dark:bg-orange-950/30 p-2.5">
                <p className="text-[10px] font-hindi text-orange-900 dark:text-orange-200 leading-relaxed">
                  <strong>जारीकर्ता:</strong> लाइव शो शिक्षा एवं सामाजिक कल्याण समिति (Reg. No. 122202059372)
                </p>
              </div>

              <Button onClick={startExam} disabled={name.trim().length < 2 || !photoUrl} className="w-full">
                <GraduationCap className="h-4 w-4 mr-1" /> परीक्षा शुरू करें
              </Button>
            </div>
          </>
        )}

        {/* ───────── PHASE 2: QUIZ ───────── */}
        {phase === "quiz" && q && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-sm gap-2">
                <span className="font-hindi">प्रश्न {current + 1}/{questions.length}</span>
                <div className="flex items-center gap-1.5">
                  <Badge className={`text-[10px] ${qSecs <= 10 ? "bg-red-600 animate-pulse" : "bg-blue-700"}`}>
                    <Timer className="h-2.5 w-2.5 mr-0.5" /> {qSecs}s
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">कुल {fmt(totalSecs)}</Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            <Progress value={(qSecs / PER_QUESTION_SECS) * 100} className={`h-1.5 ${qSecs <= 10 ? "[&>div]:bg-red-600" : ""}`} />

            <div className="space-y-3 pt-2">
              <p className="text-sm font-hindi font-semibold leading-relaxed">{q.q}</p>
              <RadioGroup
                value={answers[current]?.toString() ?? ""}
                onValueChange={(v) => {
                  setAnswers((a) => ({ ...a, [current]: parseInt(v) }));
                  // auto-advance ~400ms after selecting (so user sees their pick)
                  setTimeout(() => advanceQuestion(), 400);
                }}
              >
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    htmlFor={`opt-${current}-${i}`}
                    className="flex items-start gap-2 rounded-md border border-border p-2.5 cursor-pointer hover:bg-muted/50"
                  >
                    <RadioGroupItem value={i.toString()} id={`opt-${current}-${i}`} className="mt-0.5" />
                    <span className="text-xs font-hindi leading-relaxed">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={advanceQuestion} className="w-full">
                छोड़ें / Skip →
              </Button>
              <p className="text-[10px] text-red-600 font-hindi text-center mt-1.5">
                ⚠️ छूटा प्रश्न दोबारा नहीं मिलेगा। ऐप मत बदलें वरना परीक्षा रद्द हो जाएगी।
              </p>
            </div>
          </>
        )}

        {/* ───────── PHASE: TERMINATED (cheating) ───────── */}
        {phase === "terminated" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center font-hindi text-base text-red-600 flex items-center justify-center gap-2">
                <ShieldAlert className="h-5 w-5" /> परीक्षा रद्द
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-3">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/30 p-3 space-y-1.5">
                <p className="font-hindi font-bold text-red-800 dark:text-red-300 text-sm">नियम का उल्लंघन</p>
                <p className="text-[11px] text-red-700 dark:text-red-400 font-hindi">{terminationReason}</p>
                <p className="text-[11px] text-red-700 dark:text-red-400 font-hindi font-bold mt-2">
                  आप अगले 24 घंटे तक परीक्षा नहीं दे सकते।
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { onClose(); setTimeout(reset, 300); }}>
                बंद करें
              </Button>
            </div>
          </>
        )}

        {/* ───────── PHASE: LOCKED (24h cooldown) ───────── */}
        {phase === "locked" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center font-hindi text-base flex items-center justify-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" /> परीक्षा लॉक
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-3">
              <Lock className="h-16 w-16 text-orange-600 mx-auto" />
              <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-3">
                <p className="font-hindi font-bold text-orange-900 dark:text-orange-200 text-sm">
                  कृपया {lockHrs} घंटे {lockMins} मिनट बाद पुनः प्रयास करें
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { onClose(); setTimeout(reset, 300); }}>
                बंद करें
              </Button>
            </div>
          </>
        )}

        {/* ───────── PHASE 3: RESULT ───────── */}
        {phase === "result" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center font-hindi text-base">परिणाम घोषित</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-3">
              {passed ? (
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )}
              <div>
                <p className="text-3xl font-bold" style={{ color: passed ? "#138808" : "#DC2626" }}>{percent}%</p>
                <p className="text-xs text-muted-foreground">{score} / {questions.length} सही उत्तर</p>
              </div>
              {passed ? (
                <div className="rounded-lg border border-green-600 bg-green-50 dark:bg-green-950/30 p-3 space-y-1">
                  <p className="font-hindi font-bold text-green-800 dark:text-green-300 text-sm">🎉 बधाई हो, {name}!</p>
                  <p className="text-[11px] text-green-700 dark:text-green-400 font-hindi">आपने सफलतापूर्वक परीक्षा उत्तीर्ण की है। अपना प्रमाणपत्र डाउनलोड करें।</p>
                </div>
              ) : (
                <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-3 space-y-1">
                  <p className="text-[12px] text-orange-800 dark:text-orange-300 font-hindi font-semibold">
                    Please Try Again — कृपया पुनः प्रयास करें
                  </p>
                  <p className="text-[10px] text-orange-700 dark:text-orange-400 font-hindi">
                    सफलता के लिए 60% अंक अनिवार्य। परीक्षा 24 घंटे के लिए लॉक।
                  </p>
                </div>
              )}

              {passed && (
                <div className="space-y-2 pt-2">
                  <Button onClick={() => downloadCertificate(certData)} className="w-full bg-orange-600 hover:bg-orange-700">
                    <Download className="h-4 w-4 mr-1" /> प्रमाणपत्र डाउनलोड करें (PDF)
                  </Button>
                  <Button onClick={() => downloadCertificateImage(certData)} variant="outline" className="w-full">
                    <ImageIcon className="h-4 w-4 mr-1" /> Image (PNG) डाउनलोड
                  </Button>
                  <p className="text-[9px] text-muted-foreground">Cert ID: {certId}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!passed) {
                    // Lock for 24h on fail
                    const until = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
                    localStorage.setItem(lockKey(categoryId), String(until));
                  }
                  onClose();
                  setTimeout(reset, 300);
                }}
                className="mt-2"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> बंद करें
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
