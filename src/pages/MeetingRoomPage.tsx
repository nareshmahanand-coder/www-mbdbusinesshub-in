import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Loader2, LockKeyhole, UserRound, Video } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import JitsiMeetingRoom from "@/components/JitsiMeetingRoom";
import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface PublicMeeting {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  public_code: string;
  jitsi_room: string;
  status: string;
  host_name: string;
}

const MeetingRoomPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const hi = lang === "hi";
  const [meeting, setMeeting] = useState<PublicMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [role, setRole] = useState(hi ? "मेहमान" : "Guest");

  useEffect(() => {
    if (!code) return;
    void supabase.rpc("public_meeting_by_code", { p_code: code }).then(({ data }) => {
      setMeeting((data?.[0] as PublicMeeting | undefined) ?? null);
      setLoading(false);
    });
  }, [code]);

  useEffect(() => {
    if (!user) return;
    setGuestName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Member");
    void Promise.all([
      supabase.from("merchant_profiles").select("id").eq("user_id", user.id).limit(1),
      supabase.from("agents").select("id").eq("user_id", user.id).limit(1),
      supabase.from("coordinators").select("id").eq("user_id", user.id).limit(1),
    ]).then(([merchant, agent, coordinator]) => {
      if (coordinator.data?.length) setRole(hi ? "कोऑर्डिनेटर" : "Coordinator");
      else if (agent.data?.length) setRole(hi ? "एजेंट" : "Agent");
      else if (merchant.data?.length) setRole(hi ? "व्यापारी" : "Merchant");
      else setRole(hi ? "सदस्य" : "Member");
    });
  }, [hi, user]);

  const participantName = useMemo(() => `${guestName.trim()} • ${role}`, [guestName, role]);
  const join = (event: FormEvent) => {
    event.preventDefault();
    if (guestName.trim()) setJoined(true);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;

  if (!meeting || meeting.status === "ended" || meeting.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto max-w-md px-4 py-16 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h1 className="mt-4 text-2xl font-bold">{meeting ? (hi ? "यह मीटिंग समाप्त हो चुकी है" : "This meeting has ended") : (hi ? "मीटिंग नहीं मिली" : "Meeting not found")}</h1><p className="mt-2 text-sm text-muted-foreground">{hi ? "Host से नया meeting link माँगें।" : "Ask the host for a new meeting link."}</p><Button asChild className="mt-5"><Link to="/">{hi ? "होम पर जाएँ" : "Go home"}</Link></Button></main></div>
    );
  }

  if (joined) {
    return (
      <>
        <Seo title={`${meeting.title} | Live Meeting`} description={meeting.description || "Join this live Mera Bharat Dukaan video meeting."} path={`/meeting/${meeting.public_code}`} noindex />
        <JitsiMeetingRoom roomName={meeting.jitsi_room} displayName={participantName} email={user?.email} subject={meeting.title} language={lang} onLeave={() => navigate(user ? "/meetings" : "/")} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title={`${meeting.title} | Live Meeting`} description={meeting.description || "Join this live Mera Bharat Dukaan video meeting."} path={`/meeting/${meeting.public_code}`} noindex />
      <AppHeader />
      <main className="container mx-auto max-w-lg px-4 py-10">
        <Card className="border-t-4 border-t-destructive">
          <CardHeader className="text-center"><div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10"><Video className="h-7 w-7 text-destructive" /></div><Badge variant="destructive" className="mx-auto mb-2 w-fit">LIVE MEETING</Badge><CardTitle className="text-2xl">{meeting.title}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-5 space-y-2 border-y border-border py-4 text-sm"><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><strong>{hi ? "Host:" : "Host:"}</strong> {meeting.host_name}</p><p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" />{new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meeting.scheduled_at))}</p>{meeting.description && <p className="text-muted-foreground">{meeting.description}</p>}</div>
            <form className="space-y-4" onSubmit={join}><div className="space-y-1.5"><Label htmlFor="participant-name">{hi ? "आपका नाम" : "Your name"}</Label><Input id="participant-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required maxLength={60} autoComplete="name" placeholder={hi ? "नाम लिखें" : "Enter your name"} /></div><div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0 text-green-india" />{hi ? "कैमरा और माइक्रोफोन की अनुमति आप स्वयं नियंत्रित करेंगे।" : "You control camera and microphone permissions."}</div><Button className="w-full" size="lg" type="submit"><Video />{hi ? "वीडियो मीटिंग में जुड़ें" : "Join video meeting"}</Button></form>
            {!user && <p className="mt-4 text-center text-xs text-muted-foreground">{hi ? "मेहमान के रूप में जुड़ने के लिए लॉगिन या ऐप की जरूरत नहीं है।" : "Guests do not need to log in or install the app."}</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MeetingRoomPage;