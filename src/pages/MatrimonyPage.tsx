import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, User, Crown, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MatrimonyProfile {
  id: string;
  name: string;
  gender: string;
  dob: string | null;
  height: string;
  education: string;
  profession: string;
  city: string;
  about_me: string;
  is_published: boolean;
  subscription_plan: string | null;
  subscription_end: string | null;
  user_id: string;
}

const MatrimonyPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("browse");
  const [profiles, setProfiles] = useState<MatrimonyProfile[]>([]);
  const [myProfile, setMyProfile] = useState<MatrimonyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: "", gender: "", dob: "", height: "", education: "",
    profession: "", city: "", about_me: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, myRes] = await Promise.all([
      supabase.from("matrimony_profiles").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      user ? supabase.from("matrimony_profiles").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as MatrimonyProfile[]);
    if (myRes.data) {
      const p = myRes.data as MatrimonyProfile;
      setMyProfile(p);
      setForm({
        name: p.name, gender: p.gender, dob: p.dob || "", height: p.height,
        education: p.education, profession: p.profession, city: p.city, about_me: p.about_me,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };

    if (myProfile) {
      const { error } = await supabase.from("matrimony_profiles").update(payload).eq("id", myProfile.id);
      if (error) toast.error("Save failed"); else { toast.success("Profile updated!"); loadData(); }
    } else {
      const { error } = await supabase.from("matrimony_profiles").insert(payload);
      if (error) toast.error("Save failed"); else { toast.success("Profile created!"); loadData(); }
    }
    setSaving(false);
  };

  const requestContact = async (profileId: string) => {
    if (!user) return;
    const { error } = await supabase.from("contact_requests").insert({
      requester_id: user.id, profile_id: profileId,
    });
    if (error?.code === "23505") toast.info("Request already sent");
    else if (error) toast.error("Failed to send request");
    else toast.success("Contact request sent!");
  };

  const getAge = (dob: string | null) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)) + " yrs";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Heart className="h-6 w-6 text-[hsl(340,80%,50%)]" /> मेरा जीवनसाथी
          </h1>
          <p className="text-sm text-muted-foreground">Mera Jeevansathi — Find your life partner</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="browse" className="flex-1">Browse Profiles</TabsTrigger>
            <TabsTrigger value="my-profile" className="flex-1">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="py-16 text-center">
                <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No profiles yet</p>
                <p className="font-hindi text-sm text-muted-foreground">अभी तक कोई प्रोफ़ाइल प्रकाशित नहीं</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.filter(p => p.user_id !== user?.id).map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.city}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{p.gender}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                        {p.dob && <span>🎂 {getAge(p.dob)}</span>}
                        {p.height && <span>📏 {p.height}</span>}
                        {p.education && <span>🎓 {p.education}</span>}
                        {p.profession && <span>💼 {p.profession}</span>}
                      </div>
                      {p.about_me && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.about_me}</p>
                      )}
                      <Button size="sm" className="w-full" onClick={() => requestContact(p.id)}>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Request Contact
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-profile" className="mt-4">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> My Matrimony Profile
                </CardTitle>
                {myProfile && (
                  <Badge variant={myProfile.is_published ? "default" : "secondary"}>
                    {myProfile.is_published ? "Published ✓" : "Unpublished — Subscribe to publish"}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                <Select value={form.gender} onValueChange={v => setForm(f => ({...f, gender: v}))}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <label className="text-xs text-muted-foreground">Date of Birth</label>
                  <Input type="date" value={form.dob} onChange={e => setForm(f => ({...f, dob: e.target.value}))} />
                </div>
                <Input placeholder={"Height (e.g. 5'8\")"} value={form.height} onChange={e => setForm(f => ({...f, height: e.target.value}))} />
                <Input placeholder="Education" value={form.education} onChange={e => setForm(f => ({...f, education: e.target.value}))} />
                <Input placeholder="Profession" value={form.profession} onChange={e => setForm(f => ({...f, profession: e.target.value}))} />
                <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                <Textarea placeholder="About Me..." value={form.about_me} onChange={e => setForm(f => ({...f, about_me: e.target.value}))} rows={3} />

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : myProfile ? "Update Profile" : "Create Profile"}
                </Button>

                {/* Premium subscription CTA */}
                {myProfile && !myProfile.is_published && (
                  <Card className="border-accent/30 bg-accent/5">
                    <CardContent className="p-4 text-center">
                      <Crown className="mx-auto mb-2 h-8 w-8 text-accent" />
                      <h4 className="font-bold text-foreground">Premium Registration</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Publish your profile and get contact requests
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" className="border-accent text-accent"
                          onClick={() => toast.info("Pay ₹99 via UPI to publish. Contact admin: helpline.bharatdukaan@gmail.com")}>
                          ₹99 / Month
                        </Button>
                        <Button size="sm" className="bg-accent text-accent-foreground"
                          onClick={() => toast.info("Pay ₹999 via UPI for yearly plan. Contact admin: helpline.bharatdukaan@gmail.com")}>
                          ₹999 / Year
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        UPI / Contact Admin to activate
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MatrimonyPage;
