import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Phone, MapPin, Building } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ImageUpload, { NoImage } from "@/components/ImageUpload";

interface Job {
  id: string;
  title: string;
  description: string;
  company_name: string;
  city: string;
  salary_range: string;
  job_type: string;
  contact_phone: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

const JobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobImage, setJobImage] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", company_name: "", city: "",
    salary_range: "", job_type: "full-time", contact_phone: "",
  });

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs")
      .select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setJobs(data as Job[]);
    setLoading(false);
  };

  const postJob = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Job title required"); return; }
    setSaving(true);
    const { error } = await supabase.from("jobs").insert({
      ...form, user_id: user.id, image_url: jobImage[0] || "",
    });
    setSaving(false);
    if (error) toast.error("Failed to post job");
    else {
      toast.success("Job posted!");
      setForm({ title: "", description: "", company_name: "", city: "", salary_range: "", job_type: "full-time", contact_phone: "" });
      setJobImage([]);
      setDialogOpen(false);
      loadJobs();
    }
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return !search || j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q) || j.city.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-[hsl(var(--green-india))]" /> नौकरी — Jobs & Hiring
            </h1>
            <p className="text-sm text-muted-foreground">Post or find local jobs and staff</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Post Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Post a Job / Need Help</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Job Title *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
                <Textarea placeholder="Job Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} />
                <Input placeholder="Company / Business Name" value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))} />
                <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                <Input placeholder="Salary Range (e.g. ₹10,000 - ₹20,000)" value={form.salary_range} onChange={e => setForm(f => ({...f, salary_range: e.target.value}))} />
                <Select value={form.job_type} onValueChange={v => setForm(f => ({...f, job_type: v}))}>
                  <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="daily-wage">Daily Wage</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} />
                <ImageUpload
                  images={jobImage}
                  onImagesChange={setJobImage}
                  maxImages={1}
                  folder="jobs"
                  label="Upload Company Logo / Job Banner"
                />
                <Button onClick={postJob} disabled={saving} className="w-full">
                  {saving ? "Posting..." : "Post Job"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No jobs posted yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                {job.image_url ? (
                  <img src={job.image_url} alt={job.title} className="h-36 w-full object-cover" />
                ) : (
                  <NoImage />
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{job.title}</h3>
                  {job.company_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Building className="h-3 w-3" /> {job.company_name}
                    </p>
                  )}
                  {job.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{job.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <Badge variant="secondary">{job.job_type}</Badge>
                    {job.city && <span className="flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{job.city}</span>}
                    {job.salary_range && <span className="text-accent font-semibold">{job.salary_range}</span>}
                  </div>
                  {job.contact_phone && (
                    <a href={`tel:${job.contact_phone}`}>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        <Phone className="mr-1 h-3.5 w-3.5" /> Call Now
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
