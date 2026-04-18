import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, RotateCcw, Download, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import { buildQuizForCategory, type QuizQuestion } from "@/data/categoryQuizzes";
import {
  downloadCertificate,
  downloadCertificateImage,
  generateCertificateId,
  type CertificateData,
} from "@/lib/generateCertificate";

type Phase = "name" | "quiz" | "result";

interface Props {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryTitle: string;
}

export const ExamDialog = ({ open, onClose, categoryId, categoryTitle }: Props) => {
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [certId, setCertId] = useState("");

  const startExam = () => {
    if (!name.trim() || name.trim().length < 2) return;
    setQuestions(buildQuizForCategory(categoryId));
    setAnswers({});
    setCurrent(0);
    setPhase("quiz");
  };

  const reset = () => {
    setPhase("name");
    setName("");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setCertId("");
  };

  const handleClose = () => {
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

  const submit = () => {
    setCertId(generateCertificateId());
    setPhase("result");
  };

  const certData: CertificateData = {
    userName: name.trim(),
    courseName: categoryTitle,
    scorePercent: percent,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    certificateId: certId,
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[current];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <p className="text-xs font-hindi flex items-center gap-1.5"><Badge className="text-[9px] bg-green-700">60%</Badge> उत्तीर्ण अंक अनिवार्य</p>
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
              <Button onClick={startExam} disabled={name.trim().length < 2} className="w-full">
                <GraduationCap className="h-4 w-4 mr-1" /> परीक्षा शुरू करें
              </Button>
            </div>
          </>
        )}

        {/* ───────── PHASE 2: QUIZ ───────── */}
        {phase === "quiz" && q && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-sm">
                <span className="font-hindi">प्रश्न {current + 1} / {questions.length}</span>
                <Badge variant="secondary" className="text-[10px]">उत्तर: {answeredCount}/50</Badge>
              </DialogTitle>
            </DialogHeader>
            <Progress value={((current + 1) / questions.length) * 100} className="h-1.5" />

            <div className="space-y-3 pt-2">
              <p className="text-sm font-hindi font-semibold leading-relaxed">{q.q}</p>
              <RadioGroup
                value={answers[current]?.toString() ?? ""}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [current]: parseInt(v) }))}
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

            <div className="flex gap-2 pt-3">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="flex-1">
                ← पिछला
              </Button>
              {current < questions.length - 1 ? (
                <Button size="sm" onClick={() => setCurrent((c) => c + 1)} className="flex-1">
                  अगला →
                </Button>
              ) : (
                <Button size="sm" onClick={submit} disabled={answeredCount < questions.length} className="flex-1 bg-green-700 hover:bg-green-800">
                  परीक्षा पूरी करें
                </Button>
              )}
            </div>
            {answeredCount < questions.length && current === questions.length - 1 && (
              <p className="text-[10px] text-orange-600 font-hindi text-center">सभी 50 प्रश्नों के उत्तर देना अनिवार्य है</p>
            )}
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
                <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/30 p-3">
                  <p className="text-[12px] text-orange-800 dark:text-orange-300 font-hindi font-semibold">
                    फिर से प्रयास करें! सफलता के लिए 60% अंक अनिवार्य हैं।
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

              <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> {passed ? "नई परीक्षा" : "फिर से प्रयास करें"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
