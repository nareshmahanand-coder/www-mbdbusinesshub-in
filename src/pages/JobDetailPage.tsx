import { useMembershipGate } from "@/hooks/useMembershipGate";
import { useEffect, useState } from "react";
import type React from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Briefcase, Building, MapPin, Clock, Phone, ShieldCheck, MessageCircle, Send, ArrowLeft, GraduationCap, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { Job } from "./JobsPage";

interface JobContactRequest {
  id: string;
  job_id: string;
  seeker_id: string;
  recruiter_id: string;
  status: "pending" | "approved" | "rejected";
  message: string;
}

interface JobConversation {
  id: string;
  job_id: string;
  seeker_id: string;
  recruiter_id: string;
  last_message_at: string;
}

interface JobMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Icon className="h-4 w-4 text-accent" /> {label}</p>
    <p className="text-sm font-semibold text-foreground whitespace-pre-wrap">{value || "Not specified"}</p>
  </div>
);

const JobDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { requireMembership, membershipDialog } = useMembershipGate();
  const [job, setJob] = useState<Job | null>(null);
  const [request, setRequest] = useState<JobContactRequest | null>(null);
  const [conversation, setConversation] = useState<JobConversation | null>(null);
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void loadJob(); }, [id]);
  useEffect(() => { if (user && id) { void loadRequest(); void loadConversation(); } }, [user, id]);

  const loadJob = async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    setJob((data as unknown as Job) || null);
    setLoading(false);
  };

  const loadRequest = async () => {
    if (!user || !id) return;
    const { data } = await supabase.from("job_contact_requests" as any).select("*").eq("job_id", id).eq("seeker_id", user.id).maybeSingle();
    setRequest((data as unknown as JobContactRequest) || null);
  };

  const loadConversation = async () => {
    if (!user || !id || !job) return;
    const { data } = await supabase.from("job_conversations" as any).select("*").eq("job_id", id).or(`seeker_id.eq.${user.id},recruiter_id.eq.${user.id}`).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
    const nextConversation = (data as unknown as JobConversation) || null;
    setConversation(nextConversation);
    if (nextConversation) await loadMessages(nextConversation.id);
  };

  useEffect(() => { if (user && id && job) void loadConversation(); }, [job?.id]);

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase.from("job_messages" as any).select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    setMessages((data as unknown as JobMessage[]) || []);
  };

  const requestRecruiterNumber = () => requireMembership(() => { void requestRecruiterNumberInner(); });

  const requestRecruiterNumberInner = async () => {
    if (!user || !job) { toast.info("Please login to request recruiter number."); return; }
    if (job.user_id === user.id) { toast.info("This is your own job post."); return; }
    if (request?.status === "approved") { toast.success("Recruiter approved your request. Number is visible now."); return; }
    if (request?.status === "pending") { toast.info("Your request is already pending with the recruiter."); return; }
    const { error } = await supabase.from("job_contact_requests" as any).insert({ job_id: job.id, seeker_id: user.id, recruiter_id: job.user_id, message: `Job seeker requested contact number for ${job.title}.` });
    if (error) toast.error("Could not send contact request");
    else { toast.success("Request sent to recruiter"); await loadRequest(); await startChat(`Hi, I am interested in ${job.title}. Please share more details.`); }
  };

  const startChat = async (initialMessage?: string) => {
    if (!user || !job) { toast.info("Please login to chat with recruiter."); return; }
    if (job.user_id === user.id) { setChatOpen(true); return; }
    let active = conversation;
    if (!active) {
      const { data } = await supabase.from("job_conversations" as any).insert({ job_id: job.id, seeker_id: user.id, recruiter_id: job.user_id }).select("*").single();
      active = (data as unknown as JobConversation) || null;
      setConversation(active);
    }
    if (!active) { toast.error("Chat could not be started"); return; }
    const text = (initialMessage || `Hi, I am interested in ${job.title}.`).trim();
    const { error } = await supabase.from("job_messages" as any).insert({ conversation_id: active.id, sender_id: user.id, message: text });
    if (error) toast.error("Message not sent");
    else { await loadMessages(active.id); setChatOpen(true); }
  };

  const sendReply = async () => {
    if (!user || !conversation || !replyMessage.trim()) return;
    const { error } = await supabase.from("job_messages" as any).insert({ conversation_id: conversation.id, sender_id: user.id, message: replyMessage.trim() });
    if (error) toast.error("Message not sent");
    else { setReplyMessage(""); await loadMessages(conversation.id); }
  };

  if (loading) return <div className="min-h-screen bg-background"><AppHeader /><div className="py-16 text-center text-muted-foreground">Loading job...</div></div>;
  if (!job) return <div className="min-h-screen bg-background"><AppHeader /><div className="container mx-auto px-4 py-16 text-center"><p className="mb-4 text-muted-foreground">Job not found</p><Button asChild><Link to="/jobs">Back to Jobs</Link></Button></div></div>;

  const approved = request?.status === "approved" || job.user_id === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <Button asChild variant="ghost" className="mb-4"><Link to="/jobs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs</Link></Button>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {job.image_url && <img src={job.image_url} alt={job.title} className="h-56 w-full rounded-lg object-cover" />}
            <div>
              <div className="mb-2 flex flex-wrap gap-2">{job.job_category && <Badge variant="secondary">{job.job_category}</Badge>}<Badge>{job.job_type}</Badge></div>
              <h1 className="text-3xl font-extrabold text-foreground">{job.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground"><Building className="h-4 w-4" /> {job.company_name || "Company not specified"}</p>
            </div>
            <Card><CardHeader><CardTitle>Full Job Description</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6 text-foreground">{job.description || "No detailed description added."}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-accent" /> Job Responsibilities</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6 text-foreground">{job.responsibilities || "Not specified"}</CardContent></Card>
          </section>
          <aside className="space-y-3">
            <DetailRow icon={MapPin} label="Exact Location" value={job.exact_location || job.city} />
            <DetailRow icon={Briefcase} label="Job Type" value={job.job_type} />
            <DetailRow icon={Clock} label="Shift Timings" value={job.shift_timings} />
            <DetailRow icon={GraduationCap} label="Qualifications Required" value={job.qualifications} />
            <DetailRow icon={Phone} label="Recruiter Contact" value={approved && job.contact_phone ? job.contact_phone : request?.status === "pending" ? "Request pending approval" : "Hidden until recruiter approval"} />
            <Card><CardContent className="space-y-2 p-4">
              {approved && job.contact_phone ? <a href={`tel:${job.contact_phone}`}><Button className="w-full"><Phone className="mr-2 h-4 w-4" /> Call Recruiter</Button></a> : <Button variant="outline" className="w-full" onClick={requestRecruiterNumber}><ShieldCheck className="mr-2 h-4 w-4" /> {request?.status === "pending" ? "Request Pending" : "Request Contact Number"}</Button>}
              <Button className="w-full" onClick={() => requireMembership(() => { void startChat(); })}><MessageCircle className="mr-2 h-4 w-4" /> Chat in App</Button>
            </CardContent></Card>
          </aside>
        </div>
      </main>
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chat with Recruiter</DialogTitle></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
            {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : messages.map(message => <div key={message.id} className={`rounded-lg p-2 text-sm ${message.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-muted text-foreground"}`}>{message.message}</div>)}
          </div>
          <div className="flex gap-2"><Input value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type message..." onKeyDown={e => { if (e.key === "Enter") void sendReply(); }} /><Button onClick={sendReply} disabled={!conversation || !replyMessage.trim()}><Send className="h-4 w-4" /></Button></div>
        </DialogContent>
      </Dialog>
      {membershipDialog}
    </div>
  );
};

export default JobDetailPage;
