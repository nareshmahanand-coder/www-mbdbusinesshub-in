import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Copy, Loader2, Plus, Radio, Share2, Square, Trash2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Meeting = Database["public"]["Tables"]["meetings"]["Row"];

const makeLocalDateTime = () => {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  date.setSeconds(0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const MeetingsPage = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const hi = lang === "hi";
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(makeLocalDateTime);

  const loadMeetings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("meetings").select("*").eq("host_id", user.id).order("scheduled_at", { ascending: false });
    if (error) toast.error(error.message);
    setMeetings(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  const meetingUrl = (code: string) => `${window.location.origin}/meeting/${code}`;

  const shareMeeting = async (meeting: Meeting) => {
    const url = meetingUrl(meeting.public_code);
    const text = hi
      ? `${meeting.title}\nमेरा भारत दुकान लाइव मीटिंग में जुड़ें: ${url}`
      : `${meeting.title}\nJoin the Mera Bharat Dukaan live meeting: ${url}`;
    if (navigator.share) {
      await navigator.share({ title: meeting.title, text, url }).catch(() => undefined);
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(meetingUrl(code));
    toast.success(hi ? "मीटिंग लिंक कॉपी हो गया" : "Meeting link copied");
  };

  const createMeeting = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("meetings").insert({
      host_id: user.id,
      title: title.trim(),
      description: description.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    setScheduledAt(makeLocalDateTime());
    toast.success(hi ? "मीटिंग बन गई" : "Meeting created");
    void loadMeetings();
  };

  const setStatus = async (meeting: Meeting, status: "live" | "ended") => {
    const { error } = await supabase.from("meetings").update({ status }).eq("id", meeting.id);
    if (error) return toast.error(error.message);
    if (status === "live") window.location.assign(`/meeting/${meeting.public_code}`);
    else void loadMeetings();
  };

  const deleteMeeting = async (meeting: Meeting) => {
    if (!window.confirm(hi ? "यह मीटिंग हटाएँ?" : "Delete this meeting?")) return;
    const { error } = await supabase.from("meetings").delete().eq("id", meeting.id);
    if (error) return toast.error(error.message);
    void loadMeetings();
  };

  const sortedMeetings = useMemo(() => meetings, [meetings]);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Live Meeting & Webinar | Mera Bharat Dukaan" description="Create, schedule and join live video meetings and webinars." path="/meetings" noindex />
      <AppHeader />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-7 flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-destructive"><Radio className="h-4 w-4" /> LIVE</div>
            <h1 className="text-3xl font-extrabold text-foreground">{hi ? "लाइव मीटिंग / ज़ूम वेबिनार" : "Live Meeting / Zoom Webinar"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{hi ? "मीटिंग बनाएँ और मेहमानों को सीधे ब्राउज़र से जोड़ें।" : "Create meetings and let guests join directly from any browser."}</p>
          </div>
          <Badge variant="outline" className="w-fit border-green-india text-green-india">{hi ? "ऐप डाउनलोड जरूरी नहीं" : "No app required"}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="h-fit border-t-4 border-t-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5 text-accent" />{hi ? "नई मीटिंग बनाएँ" : "Create a meeting"}</CardTitle>
              <CardDescription>{hi ? "शीर्षक और समय चुनें। लिंक तुरंत तैयार होगा।" : "Choose a title and time. Your guest link is created instantly."}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={createMeeting}>
                <div className="space-y-1.5"><Label htmlFor="meeting-title">{hi ? "मीटिंग का शीर्षक" : "Meeting title"}</Label><Input id="meeting-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required placeholder={hi ? "जैसे: व्यापारी प्रशिक्षण" : "e.g. Merchant training"} /></div>
                <div className="space-y-1.5"><Label htmlFor="meeting-time">{hi ? "तारीख और समय" : "Date and time"}</Label><Input id="meeting-time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="meeting-description">{hi ? "विवरण (वैकल्पिक)" : "Description (optional)"}</Label><Textarea id="meeting-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder={hi ? "मीटिंग का विषय" : "Meeting agenda"} /></div>
                <Button className="w-full" type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Video />}{hi ? "मीटिंग और लिंक बनाएँ" : "Create meeting & link"}</Button>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="your-meetings-title">
            <h2 id="your-meetings-title" className="mb-4 flex items-center gap-2 text-xl font-bold"><CalendarClock className="h-5 w-5 text-primary" />{hi ? "आपकी मीटिंग" : "Your meetings"}</h2>
            {loading ? <Loader2 className="mx-auto mt-12 h-8 w-8 animate-spin text-primary" /> : sortedMeetings.length === 0 ? (
              <div className="border border-dashed border-border bg-card px-5 py-12 text-center"><Video className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-semibold">{hi ? "अभी कोई मीटिंग नहीं है" : "No meetings yet"}</p></div>
            ) : (
              <div className="space-y-3">
                {sortedMeetings.map((meeting) => (
                  <Card key={meeting.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{meeting.title}</h3><Badge variant={meeting.status === "live" ? "destructive" : meeting.status === "ended" ? "secondary" : "outline"}>{meeting.status === "live" ? "LIVE" : meeting.status === "ended" ? (hi ? "समाप्त" : "Ended") : (hi ? "निर्धारित" : "Scheduled")}</Badge></div>
                          <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meeting.scheduled_at))}</p>
                          {meeting.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{meeting.description}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {meeting.status !== "ended" && <Button size="sm" onClick={() => void setStatus(meeting, "live")}><Video />{meeting.status === "live" ? (hi ? "जुड़ें" : "Join") : (hi ? "शुरू करें" : "Start")}</Button>}
                          <Button size="icon" variant="outline" aria-label={hi ? "लिंक कॉपी करें" : "Copy link"} title={hi ? "लिंक कॉपी करें" : "Copy link"} onClick={() => void copyLink(meeting.public_code)}><Copy /></Button>
                          <Button size="icon" variant="outline" aria-label={hi ? "व्हाट्सएप पर शेयर करें" : "Share on WhatsApp"} title={hi ? "व्हाट्सएप पर शेयर करें" : "Share on WhatsApp"} onClick={() => void shareMeeting(meeting)}><Share2 /></Button>
                          {meeting.status === "live" && <Button size="icon" variant="outline" aria-label={hi ? "मीटिंग समाप्त करें" : "End meeting"} title={hi ? "मीटिंग समाप्त करें" : "End meeting"} onClick={() => void setStatus(meeting, "ended")}><Square /></Button>}
                          <Button size="icon" variant="destructive" aria-label={hi ? "मीटिंग हटाएँ" : "Delete meeting"} title={hi ? "मीटिंग हटाएँ" : "Delete meeting"} onClick={() => void deleteMeeting(meeting)}><Trash2 /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">{hi ? "Free Jitsi सेवा द्वारा वीडियो मीटिंग • उपलब्ध host controls Jitsi के अनुसार" : "Video meetings powered by Free Jitsi • Host controls depend on Jitsi availability"}</p>
      </main>
    </div>
  );
};

export default MeetingsPage;