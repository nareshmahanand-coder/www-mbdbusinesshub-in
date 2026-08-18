import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKycStatus } from "@/hooks/useKycStatus";
import { startCoordinatorPaymentLink } from "@/lib/razorpayPayments";
import {
  BadgeCheck, IndianRupee, Users, Wallet, Loader2, Store, ShieldCheck, Camera,
  Image as ImageIcon, Landmark, Banknote, Crown, TrendingUp, UserPlus, Activity,
} from "lucide-react";

type CoordinatorRow = {
  id: string;
  coordinator_code: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  status: string;
  subscription_status: string;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  wallet_balance: number;
  admin_notes: string;
  account_holder_name: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  created_at: string;
};

type TeamRow = {
  agent_id: string;
  agent_code: string;
  agent_name: string;
  agent_mobile: string;
  agent_city: string | null;
  agent_status: string;
  joined_at: string;
  shops_count: number;
  merchant_subscriptions: number;
  agent_commission_total: number;
  coordinator_earned: number;
};

const MIN_WITHDRAWAL = 1000;
const inr = (n: number | null | undefined) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const isSubscriptionActive = (c: CoordinatorRow | null) =>
  !!c &&
  c.subscription_status === "active" &&
  (!c.subscription_expires_at || new Date(c.subscription_expires_at).getTime() > Date.now());

const CoordinatorPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coordinator, setCoordinator] = useState<CoordinatorRow | null>(null);

  const load = async () => {
    if (!user) { setCoordinator(null); setLoading(false); return; }
    const { data } = await supabase.from("coordinators").select("*").eq("user_id", user.id).maybeSingle();
    setCoordinator((data as CoordinatorRow) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!coordinator?.id) return;
    const channel = supabase
      .channel(`coordinator-${coordinator.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "coordinators", filter: `id=eq.${coordinator.id}` }, (payload) => {
        setCoordinator((prev) => (prev ? { ...prev, ...(payload.new as CoordinatorRow) } : prev));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [coordinator?.id]);

  if (authLoading || loading || kycLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const active = isSubscriptionActive(coordinator);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Crown className="h-7 w-7 text-amber-500" /> Coordinator Portal
          </h1>
          <p className="font-hindi text-sm text-muted-foreground">
            अपनी एजेंट टीम बनाएँ और टीम की हर सब्सक्रिप्शन पर 2% पैसिव कमीशन कमाएँ।
          </p>
        </header>

        {!user && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="font-hindi text-sm">कोऑर्डिनेटर बनने के लिए पहले लॉगिन करें।</p>
              <Button onClick={() => navigate("/login?next=/coordinator")}>Login / Register</Button>
            </CardContent>
          </Card>
        )}

        {user && !hasKyc && (
          <Card className="border-2 border-amber-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-amber-600" /> e-KYC अनिवार्य</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-hindi text-sm text-muted-foreground">
                कोऑर्डिनेटर रजिस्ट्रेशन के लिए e-KYC पूरा करना अनिवार्य है। KYC पूरा करने के बाद यहाँ वापस आएँ।
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate("/ekyc?mode=upload&next=%2Fcoordinator")}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> e-KYC शुरू करें (आधार + PAN अपलोड)
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  मैंने e-KYC कर लिया — Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user && hasKyc && !coordinator && <CoordinatorRegistrationForm userId={user.id} email={user.email ?? ""} onDone={load} />}

        {user && hasKyc && coordinator && !active && <SubscriptionCard coordinator={coordinator} onDone={load} />}

        {user && hasKyc && coordinator && active && <CoordinatorDashboard coordinator={coordinator} onReload={load} />}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          सवाल? <Link to="/help" className="underline">Help Desk</Link>
        </p>
      </main>
    </div>
  );
};

const CoordinatorRegistrationForm = ({
  userId, email, onDone,
}: { userId: string; email: string; onDone: () => void | Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [form, setForm] = useState({
    name: "", mobile: "", email, city: "", address: "", aadhaarNumber: "", panNumber: "",
    accountHolderName: "", accountNumber: "", confirmAccountNumber: "", ifsc: "", upiId: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState("");
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState("");
  const [panDocUrl, setPanDocUrl] = useState("");

  const photoRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const photoCamRef = useRef<HTMLInputElement>(null);
  const frontCamRef = useRef<HTMLInputElement>(null);
  const backCamRef = useRef<HTMLInputElement>(null);
  const panCamRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, folder: string, setter: (u: string) => void) => {
    setUploading(folder);
    const ext = file.name.split(".").pop();
    const path = `coordinators/${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(""); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setter(data.publicUrl);
    setUploading("");
    toast.success("Uploaded");
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>, folder: string, setter: (u: string) => void) => {
    const file = e.target.files?.[0];
    if (file) void upload(file, folder, setter);
  };

  const UploadTile = ({
    label, url, onCamera, onGallery, folder,
  }: { label: string; url: string; onCamera: () => void; onGallery: () => void; folder: string }) => (
    <div className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-2 text-xs">
      <div className="flex h-16 w-16 items-center justify-center">
        {url ? <img src={url} alt={label} className="h-16 w-16 rounded-md object-cover" />
          : uploading === folder ? <Loader2 className="h-5 w-5 animate-spin" />
          : <UserPlus className="h-5 w-5 text-muted-foreground" />}
      </div>
      <span className="text-center font-medium">{label}</span>
      <div className="flex w-full gap-1">
        <Button type="button" size="sm" variant="secondary" className="h-7 flex-1 px-1 text-[10px]" onClick={onCamera}><Camera className="mr-1 h-3 w-3" /> कैमरा</Button>
        <Button type="button" size="sm" variant="outline" className="h-7 flex-1 px-1 text-[10px]" onClick={onGallery}><ImageIcon className="mr-1 h-3 w-3" /> गैलरी</Button>
      </div>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobile = form.mobile.replace(/\D/g, "");
    if (!form.name.trim()) { toast.error("नाम दर्ज करें"); return; }
    if (mobile.length < 10) { toast.error("मान्य मोबाइल नंबर दर्ज करें"); return; }
    if (!photoUrl) { toast.error("अपनी फ़ोटो अपलोड करें"); return; }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) { toast.error("आधार के दोनों फ़ोटो अपलोड करें"); return; }
    const acc = form.accountNumber.replace(/\s/g, "");
    const ifsc = form.ifsc.replace(/\s/g, "").toUpperCase();
    if (!form.accountHolderName.trim()) { toast.error("खाताधारक का नाम दर्ज करें"); return; }
    if (acc.length < 8) { toast.error("मान्य बैंक खाता नंबर दर्ज करें"); return; }
    if (acc !== form.confirmAccountNumber.replace(/\s/g, "")) { toast.error("खाता नंबर मेल नहीं खा रहे हैं"); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { toast.error("मान्य IFSC कोड दर्ज करें"); return; }

    setSaving(true);
    const { error } = await supabase.from("coordinators").insert({
      user_id: userId,
      coordinator_code: "",
      name: form.name.trim(),
      mobile,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      photo_url: photoUrl,
      aadhaar_number: form.aadhaarNumber.replace(/\s/g, "") || null,
      aadhaar_front_url: aadhaarFrontUrl,
      aadhaar_back_url: aadhaarBackUrl,
      pan_number: form.panNumber.toUpperCase() || null,
      pan_url: panDocUrl || null,
      account_holder_name: form.accountHolderName.trim(),
      bank_account_number: acc,
      ifsc_code: ifsc,
      upi_id: form.upiId.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message || "Registration failed"); return; }
    toast.success("रजिस्ट्रेशन जमा हो गया! अब ₹100 मासिक सब्सक्रिप्शन पूरा करें।");
    await onDone();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Coordinator Registration (e-KYC verified)</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} /></div>
            <div><Label>Mobile *</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={15} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} /></div>
            <div><Label>Aadhaar Number</Label><Input value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} maxLength={14} /></div>
            <div><Label>PAN Number</Label><Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} maxLength={10} /></div>
          </div>
          <div><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={500} /></div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Landmark className="h-4 w-4 text-primary" /> Bank & UPI Details (कमीशन भुगतान हेतु)</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Account Holder Name *</Label><Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} maxLength={100} /></div>
              <div><Label>Bank Account Number *</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} maxLength={20} inputMode="numeric" /></div>
              <div><Label>Confirm Account Number *</Label><Input value={form.confirmAccountNumber} onChange={(e) => setForm({ ...form, confirmAccountNumber: e.target.value })} maxLength={20} inputMode="numeric" /></div>
              <div><Label>IFSC Code *</Label><Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} maxLength={11} /></div>
              <div className="md:col-span-2"><Label>UPI ID (Optional)</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} maxLength={80} placeholder="name@bank" /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <UploadTile label="Photo *" url={photoUrl} folder="photo" onGallery={() => photoRef.current?.click()} onCamera={() => photoCamRef.current?.click()} />
            <UploadTile label="Aadhaar Front *" url={aadhaarFrontUrl} folder="aadhaar-front" onGallery={() => frontRef.current?.click()} onCamera={() => frontCamRef.current?.click()} />
            <UploadTile label="Aadhaar Back *" url={aadhaarBackUrl} folder="aadhaar-back" onGallery={() => backRef.current?.click()} onCamera={() => backCamRef.current?.click()} />
            <UploadTile label="PAN Card" url={panDocUrl} folder="pan" onGallery={() => panRef.current?.click()} onCamera={() => panCamRef.current?.click()} />
          </div>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => pick(e, "photo", setPhotoUrl)} />
          <input ref={frontRef} type="file" accept="image/*" hidden onChange={(e) => pick(e, "aadhaar-front", setAadhaarFrontUrl)} />
          <input ref={backRef} type="file" accept="image/*" hidden onChange={(e) => pick(e, "aadhaar-back", setAadhaarBackUrl)} />
          <input ref={panRef} type="file" accept="image/*" hidden onChange={(e) => pick(e, "pan", setPanDocUrl)} />
          <input ref={photoCamRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e, "photo", setPhotoUrl)} />
          <input ref={frontCamRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e, "aadhaar-front", setAadhaarFrontUrl)} />
          <input ref={backCamRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e, "aadhaar-back", setAadhaarBackUrl)} />
          <input ref={panCamRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e, "pan", setPanDocUrl)} />

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
            Submit & Continue to ₹100 Subscription
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SubscriptionCard = ({
  coordinator, onDone,
}: { coordinator: CoordinatorRow; onDone: () => void | Promise<void> }) => {
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      await startCoordinatorPaymentLink({
        plan: "monthly",
        onSuccess: () => {
          toast.success("सब्सक्रिप्शन सक्रिय! आपका Coordinator ID अब चालू है।");
          void onDone();
        },
        onFailure: () => toast.error("भुगतान पूरा नहीं हुआ। कृपया दोबारा प्रयास करें।"),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    }
    setPaying(false);
  };

  return (
    <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-600" /> ₹100 मासिक सब्सक्रिप्शन (Auto-Debit)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-background/70 p-4 text-sm">
          <p>Coordinator ID: <span className="font-mono font-semibold">{coordinator.coordinator_code}</span></p>
          <p className="text-muted-foreground">Status: <span className="capitalize">{coordinator.status}</span> · Subscription: <span className="capitalize">{coordinator.subscription_status}</span></p>
        </div>
        <ul className="space-y-1 font-hindi text-sm text-muted-foreground">
          <li>• e-KYC पूरा ✔ — अब ₹100 मासिक सब्सक्रिप्शन पूरा करें।</li>
          <li>• भुगतान के बाद आपका Coordinator ID तुरंत सक्रिय हो जाएगा।</li>
          <li>• आपकी टीम के एजेंट की हर मर्चेंट सब्सक्रिप्शन पर 2% पैसिव कमीशन।</li>
          <li>• ऑटो-डेबिट हर महीने अपने-आप रिन्यू होगा।</li>
        </ul>
        <Button className="w-full" size="lg" onClick={pay} disabled={paying}>
          {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
          ₹100 / माह — Pay & Activate (Auto-Debit)
        </Button>
        {coordinator.admin_notes && <p className="rounded-md bg-muted p-3 text-xs">{coordinator.admin_notes}</p>}
      </CardContent>
    </Card>
  );
};

const CoordinatorDashboard = ({
  coordinator, onReload,
}: { coordinator: CoordinatorRow; onReload: () => void | Promise<void> }) => {
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    const [{ data: teamData }, { data: comms }, { data: wds }] = await Promise.all([
      supabase.rpc("coordinator_team_overview", { p_coordinator_id: coordinator.id }),
      supabase.from("coordinator_commissions").select("*").eq("coordinator_id", coordinator.id).order("created_at", { ascending: false }),
      supabase.from("coordinator_withdrawals").select("*").eq("coordinator_id", coordinator.id).order("created_at", { ascending: false }),
    ]);
    setTeam((teamData as unknown as TeamRow[]) || []);
    setCommissions(comms || []);
    setWithdrawals(wds || []);
    setBusy(false);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`coordinator-live-${coordinator.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "coordinator_commissions", filter: `coordinator_id=eq.${coordinator.id}` }, () => {
        void load();
        toast.success("नया 2% कमीशन आपके वॉलेट में जुड़ा!");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agents", filter: `coordinator_id=eq.${coordinator.id}` }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_referrals" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "coordinator_withdrawals", filter: `coordinator_id=eq.${coordinator.id}` }, () => {
        void load();
      })
      .subscribe();
    const poll = window.setInterval(() => void load(), 20000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinator.id]);

  const totals = useMemo(() => ({
    agents: team.length,
    shops: team.reduce((s, t) => s + Number(t.shops_count || 0), 0),
    subs: team.reduce((s, t) => s + Number(t.merchant_subscriptions || 0), 0),
    earned: commissions.reduce((s, c) => s + Number(c.amount || 0), 0),
  }), [team, commissions]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-emerald-500/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Wallet className="h-4 w-4" /> Coordinator Wallet</p>
            <p className="mt-1 flex items-center text-4xl font-extrabold text-emerald-700 dark:text-emerald-400">
              <IndianRupee className="h-7 w-7" />{Number(coordinator.wallet_balance || 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">टीम की हर सब्सक्रिप्शन पर 2% पैसिव कमीशन</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="gap-1"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Active</Badge>
            <p className="mt-2 text-xs text-muted-foreground">Coordinator ID</p>
            <p className="font-mono text-lg font-bold">{coordinator.coordinator_code}</p>
            {coordinator.subscription_expires_at && (
              <p className="text-[11px] text-muted-foreground">Renews {new Date(coordinator.subscription_expires_at).toLocaleDateString("en-IN")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> My Agents</p><p className="text-2xl font-bold">{totals.agents}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Store className="h-3 w-3" /> Total Shops</p><p className="text-2xl font-bold">{totals.shops}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><Activity className="h-3 w-3" /> Paid Subscriptions</p><p className="text-2xl font-bold">{totals.subs}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3" /> Total Earned</p><p className="text-2xl font-bold">{inr(totals.earned)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> My Agents — Team Performance</CardTitle></CardHeader>
        <CardContent>
          {busy ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : team.length === 0 ? (
            <p className="font-hindi text-sm text-muted-foreground">
              अभी कोई एजेंट नहीं जुड़ा। एजेंट रजिस्ट्रेशन के समय आपका Coordinator ID{" "}
              <span className="font-mono font-bold text-foreground">{coordinator.coordinator_code}</span> दर्ज करने को कहें।
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Agent</th><th>Agent ID</th><th>Shops</th><th>Subs</th><th>Agent Comm.</th><th className="text-right">आपका 2%</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((t) => (
                    <tr key={t.agent_id} className="border-b last:border-0">
                      <td className="py-2">
                        <p className="font-medium">{t.agent_name}</p>
                        <p className="text-xs text-muted-foreground">{t.agent_city || "—"} · <span className="capitalize">{t.agent_status}</span></p>
                      </td>
                      <td className="font-mono text-xs">{t.agent_code}</td>
                      <td className="font-semibold">{t.shops_count}</td>
                      <td>{t.merchant_subscriptions}</td>
                      <td>{inr(t.agent_commission_total)}</td>
                      <td className="text-right font-semibold text-emerald-600">{inr(t.coordinator_earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CoordinatorWithdrawalCard coordinator={coordinator} withdrawals={withdrawals} onDone={async () => { await load(); await onReload(); }} />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" /> Commission Log (2%)</CardTitle></CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="font-hindi text-sm text-muted-foreground">अभी कोई कमीशन ट्रांज़ैक्शन नहीं।</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium capitalize">{c.plan} plan</p>
                    <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <span className="whitespace-nowrap font-semibold text-emerald-600">+{inr(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CoordinatorWithdrawalCard = ({
  coordinator, withdrawals, onDone,
}: { coordinator: CoordinatorRow; withdrawals: any[]; onDone: () => void | Promise<void> }) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const balance = Number(coordinator.wallet_balance || 0);
  const hasBank = !!(coordinator.bank_account_number && coordinator.ifsc_code);
  const canWithdraw = balance >= MIN_WITHDRAWAL && hasBank;

  const submit = async () => {
    const amt = Number(amount || balance);
    if (!hasBank) { toast.error("पहले बैंक विवरण भरें"); return; }
    if (balance < MIN_WITHDRAWAL) { toast.error(`वॉलेट बैलेंस ${inr(MIN_WITHDRAWAL)} होने पर ही निकासी संभव है`); return; }
    if (amt < MIN_WITHDRAWAL) { toast.error(`न्यूनतम निकासी ${inr(MIN_WITHDRAWAL)} है`); return; }
    if (amt > balance) { toast.error("उपलब्ध बैलेंस से अधिक राशि नहीं निकाल सकते"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("coordinator_withdrawals").insert({
      coordinator_id: coordinator.id,
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      amount: amt,
      account_holder_name: coordinator.account_holder_name,
      bank_account_number: coordinator.bank_account_number,
      ifsc_code: coordinator.ifsc_code,
      upi_id: coordinator.upi_id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Withdrawal request failed"); return; }
    toast.success("निकासी अनुरोध भेज दिया गया — एडमिन अप्रूवल की प्रतीक्षा करें।");
    setAmount("");
    await onDone();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" /> Withdrawal (न्यूनतम ₹1,000)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Wallet Balance</p><p className="font-bold">{inr(balance)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Withdrawable</p><p className={`font-bold ${canWithdraw ? "text-emerald-600" : "text-amber-600"}`}>{canWithdraw ? inr(balance) : inr(0)}</p></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input inputMode="numeric" placeholder={`Amount (min ${MIN_WITHDRAWAL})`} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
          <Button onClick={submit} disabled={!canWithdraw || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />} Request Withdrawal
          </Button>
        </div>
        {!hasBank && <p className="font-hindi text-xs text-destructive">निकासी से पहले बैंक विवरण भरना अनिवार्य है।</p>}
        {hasBank && balance < MIN_WITHDRAWAL && (
          <p className="font-hindi text-xs text-muted-foreground">
            जब तक वॉलेट बैलेंस {inr(MIN_WITHDRAWAL)} तक नहीं पहुँचता, निकासी उपलब्ध नहीं होगी।
          </p>
        )}
        {withdrawals.length > 0 && (
          <div className="space-y-2 pt-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{inr(w.amount)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("en-IN")}</p>
                </div>
                <Badge variant={w.status === "paid" ? "default" : w.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{w.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoordinatorPortal;
