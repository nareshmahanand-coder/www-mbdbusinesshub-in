import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import LocationSearchBar from "@/components/LocationSearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Plus, Phone, MapPin, Building, MessageCircle, ShieldCheck, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import ImageUpload, { NoImage } from "@/components/ImageUpload";

export interface Job {
  id: string;
  title: string;
  description: string;
  company_name: string;
  city: string;
  exact_location: string;
  salary_range: string;
  job_type: string;
  job_category: string;
  shift_timings: string;
  qualifications: string;
  responsibilities: string;
  contact_phone: string;
  image_url: string;
  is_active: boolean;
  moderation_status?: string;
  created_at: string;
  user_id: string;
}

interface JobContactRequest {
  id: string;
  job_id: string;
  seeker_id: string;
  recruiter_id: string;
  status: "pending" | "approved" | "rejected";
  message: string;
  created_at: string;
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

const emptyForm = {
  title: "", description: "", company_name: "", city: "", exact_location: "",
  salary_range: "", job_type: "full-time", contact_phone: "", job_category: "",
  shift_timings: "", qualifications: "", responsibilities: "",
};

const locationTokens = (value = "") => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const matchesLocation = (jobLocation = "", selectedLocation = "All") => {
  if (selectedLocation === "All") return true;
  const jobTokens = locationTokens(jobLocation);
  const selectedTokens = locationTokens(selectedLocation);
  return jobTokens.some(token => selectedTokens.includes(token)) || selectedTokens.some(token => jobTokens.includes(token));
};

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contactRequests, setContactRequests] = useState<JobContactRequest[]>([]);
  const [conversations, setConversations] = useState<JobConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<JobConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<JobMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobImage, setJobImage] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [locationFilter, setLocationFilter] = useState("All");

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => { if (user) { loadContactRequests(); loadConversations(); } }, [user]);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setJobs(data as unknown as Job[]);
    setLoading(false);
  };

  const loadContactRequests = async () => {
    if (!user) return;
    const { data } = await supabase.from("job_contact_requests" as any).select("*").order("created_at", { ascending: false });
    if (data) setContactRequests(data as unknown as JobContactRequest[]);
  };

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from("job_conversations" as any).select("*").order("last_message_at", { ascending: false });
    if (data) setConversations(data as unknown as JobConversation[]);
  };

  const filtered = useMemo(() => jobs.filter(j => {
    const q = search.toLowerCase();
    const matchesSearch = !search || [j.title, j.company_name, j.city, j.exact_location, j.job_category].some(value => value?.toLowerCase().includes(q));
    const matchesCity = matchesLocation([j.exact_location, j.city].filter(Boolean).join(" "), locationFilter);
    return matchesSearch && matchesCity;
  }), [jobs, search, locationFilter]);

  const requestForJob = (job: Job) => contactRequests.find(request => request.job_id === job.id && request.seeker_id === user?.id);

  const postJob = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.company_name.trim() || !form.city.trim()) {
      toast.error("Job title, company and location are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("jobs" as any).insert({ ...form, user_id: user.id, image_url: jobImage[0] || "" });
    setSaving(false);
    if (error) toast.error("Failed to post job");
    else {
      toast.success("Job posted securely");
      setForm(emptyForm);
      setJobImage([]);
      setDialogOpen(false);
      loadJobs();
    }
  };

  const requestRecruiterNumber = async (job: Job) => {
    if (!user) { toast.info("Please login to request recruiter number."); return; }
    if (job.user_id === user.id) { toast.info("This is your own job post."); return; }
    const existing = requestForJob(job);
    if (existing?.status === "approved") { toast.success("Recruiter approved your request. Number is visible now."); return; }
    if (existing?.status === "pending") { toast.info("Your request is already pending with the recruiter."); return; }
    const message = `Job seeker is interested in ${job.title} and requested your contact number.`;
    const { error } = await supabase.from("job_contact_requests" as any).insert({ job_id: job.id, seeker_id: user.id, recruiter_id: job.user_id, message });
    if (error) toast.error("Could not send contact request");
    else {
      toast.success("Request sent to recruiter for approval");
      await loadContactRequests();
      await startChatForJob(job, `Hi, I am interested in ${job.title}. Please share more details when convenient.`);
    }
  };

  const startChatForJob = async (job: Job, messageText?: string) => {
    if (!user) { toast.info("Please login to chat with recruiter."); return; }
    if (job.user_id === user.id) { toast.info("This is your own job post."); return; }
    const message = (messageText || `Hi, I am interested in ${job.title}.`).trim();
    const { data: existing } = await supabase.from("job_conversations" as any)
      .select("id").eq("job_id", job.id).eq("seeker_id", user.id).eq("recruiter_id", job.user_id).maybeSingle();
    const existingConversation = existing as { id?: string } | null;
    const createdConversation = existingConversation?.id ? null : (await supabase.from("job_conversations" as any).insert({ job_id: job.id, seeker_id: user.id, recruiter_id: job.user_id }).select("id").single()).data as { id?: string } | null;
    const conversationId = existingConversation?.id || createdConversation?.id;
    if (!conversationId) { toast.error("Chat could not be started right now"); return; }
    const { error } = await supabase.from("job_messages" as any).insert({ conversation_id: conversationId, sender_id: user.id, message });
    if (error) toast.error("Message not sent");
    else { toast.success("Chat started with recruiter"); await loadConversations(); setChatOpen(true); }
  };

  const openConversation = async (conversation: JobConversation) => {
    setActiveConversation(conversation);
    setChatOpen(true);
    const { data } = await supabase.from("job_messages" as any)
      .select("*").eq("conversation_id", conversation.id).order("created_at", { ascending: true });
    setConversationMessages((data as unknown as JobMessage[]) || []);
  };

  const sendReply = async () => {
    if (!user || !activeConversation || !replyMessage.trim()) return;
    const { error } = await supabase.from("job_messages" as any).insert({ conversation_id: activeConversation.id, sender_id: user.id, message: replyMessage.trim() });
    if (error) toast.error("Message not sent");
    else { setReplyMessage(""); await openConversation(activeConversation); await loadConversations(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Briefcase className="h-6 w-6 text-accent" /> नौकरी — Jobs & Hiring</h1>
            <p className="text-sm text-muted-foreground">Secure hiring with hidden numbers and in-app chat</p>
          </div>
          <div className="flex gap-2">
            {conversations.length > 0 && <Button variant="outline" onClick={() => setChatOpen(true)}><MessageCircle className="mr-1.5 h-4 w-4" /> Chats</Button>}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button className="bg-accent text-accent-foreground"><Plus className="mr-1.5 h-4 w-4" /> Post Job</Button></DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>Post a Professional Job</DialogTitle></DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Job Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Input placeholder="Job Category" value={form.job_category} onChange={e => setForm(f => ({ ...f, job_category: e.target.value }))} />
                  <Input placeholder="Company Name *" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                  <Input placeholder="City *" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  <Input placeholder="Exact Location / Address" value={form.exact_location} onChange={e => setForm(f => ({ ...f, exact_location: e.target.value }))} />
                  <Input placeholder="Salary Range (e.g. ₹10,000 - ₹20,000)" value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} />
                  <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                    <SelectContent><SelectItem value="full-time">Full Time</SelectItem><SelectItem value="part-time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="daily-wage">Daily Wage</SelectItem></SelectContent>
                  </Select>
                  <Input placeholder="Shift Timings" value={form.shift_timings} onChange={e => setForm(f => ({ ...f, shift_timings: e.target.value }))} />
                  <Input placeholder="Recruiter Phone (hidden until approved)" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                  <Input placeholder="Qualifications Required" value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} />
                  <Textarea className="sm:col-span-2" placeholder="Full Job Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                  <Textarea className="sm:col-span-2" placeholder="Detailed Job Responsibilities" value={form.responsibilities} onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))} rows={3} />
                  <div className="sm:col-span-2"><ImageUpload images={jobImage} onImagesChange={setJobImage} maxImages={1} folder="jobs" label="Upload Company Logo / Job Banner" /></div>
                  <Button onClick={postJob} disabled={saving} className="sm:col-span-2">{saving ? "Posting..." : "Post Job"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
          <Input placeholder="Search jobs by title, company or category..." value={search} onChange={e => setSearch(e.target.value)} className="h-11" />
          <LocationSearchBar value={locationFilter} onChange={setLocationFilter} placeholder="Search job city — Chandigarh, Bhilai, Delhi..." />
        </div>

        {loading ? <div className="py-16 text-center text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
          <div className="py-16 text-center"><Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">No jobs posted yet</p></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => {
              const request = requestForJob(job);
              const approved = request?.status === "approved" || job.user_id === user?.id;
              return (
                <Card key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md">
                  {job.image_url ? <img src={job.image_url} alt={job.title} className="h-36 w-full object-cover" /> : <NoImage />}
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2"><h3 className="font-semibold text-foreground">{job.title}</h3>{job.job_category && <Badge variant="secondary">{job.job_category}</Badge>}</div>
                    {job.company_name && <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><Building className="h-3 w-3" /> {job.company_name}</p>}
                    <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {job.exact_location || job.city || "Location not specified"}</p>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs"><Badge variant="secondary">{job.job_type}</Badge>{job.shift_timings && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{job.shift_timings}</span>}{job.salary_range && <span className="font-semibold text-accent">{job.salary_range}</span>}</div>
                    <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{job.description || job.responsibilities || "Open role details available on job page."}</p>
                    <div className="grid gap-2" onClick={event => event.stopPropagation()}>
                      {approved && job.contact_phone ? <a href={`tel:${job.contact_phone}`}><Button size="sm" variant="outline" className="w-full text-xs"><Phone className="mr-1 h-3.5 w-3.5" /> {job.contact_phone}</Button></a> : <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => requestRecruiterNumber(job)}><ShieldCheck className="mr-1 h-3.5 w-3.5" /> {request?.status === "pending" ? "Request Pending" : "Request Contact Number"}</Button>}
                      {job.user_id !== user?.id && <Button size="sm" className="w-full text-xs" onClick={() => startChatForJob(job)}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Chat with Recruiter</Button>}
                      <Button size="sm" variant="secondary" asChild><Link to={`/jobs/${job.id}`}>View Full Details</Link></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Job Chats</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {conversations.length === 0 ? <p className="text-sm text-muted-foreground">No job chats yet.</p> : conversations.map(conversation => {
                const job = jobs.find(item => item.id === conversation.job_id);
                return <button key={conversation.id} className="w-full rounded-md border p-2 text-left text-sm hover:bg-muted" onClick={() => openConversation(conversation)}>{job?.title || "Job conversation"}<span className="block text-xs text-muted-foreground">{new Date(conversation.last_message_at).toLocaleDateString("en-IN")}</span></button>;
              })}
            </div>
            <div className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
                {!activeConversation ? <p className="text-sm text-muted-foreground">Select a conversation.</p> : conversationMessages.map(message => <div key={message.id} className={`rounded-lg p-2 text-sm ${message.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-muted text-foreground"}`}>{message.message}</div>)}
              </div>
              <div className="flex gap-2"><Input value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type message..." onKeyDown={e => { if (e.key === "Enter") void sendReply(); }} /><Button onClick={sendReply} disabled={!activeConversation || !replyMessage.trim()}><Send className="h-4 w-4" /></Button></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsPage;
