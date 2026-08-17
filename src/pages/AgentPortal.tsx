import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import AgentTerms from "@/components/AgentTerms";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BadgeCheck, IndianRupee, LogIn, UserPlus, Users, Wallet, Loader2, Store, Clock, Info,
  Landmark, Banknote, Camera, Image as ImageIcon, Search, Receipt, Crown, ShieldCheck,
} from "lucide-react";

type AgentRow = {
  id: string;
  agent_code: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  address: string | null;
  photo_url: string | null;
  status: string;
  admin_notes: string;
  wallet_balance: number;
  created_at: string;
  account_holder_name?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  coordinator_id?: string | null;
  registration_type?: string | null;
};

const MIN_WITHDRAWAL = 1000;
const HOLD_DAYS = 7;

const inr = (n: number | null | undefined) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const AgentPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [mode, setMode] = useState<"choose" | "register">("choose");

  const loadAgent = async () => {
    if (!user) { setAgent(null); setLoading(false); return; }
    const { data } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setAgent((data as AgentRow) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void loadAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // Live wallet updates
  useEffect(() => {
    if (!agent?.id) return;
    const channel = supabase
      .channel(`agent-wallet-${agent.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agents", filter: `id=eq.${agent.id}` }, (payload) => {
        setAgent((prev) => (prev ? { ...prev, ...(payload.new as AgentRow) } : prev));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [agent?.id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Agent Portal</h1>
          <p className="font-hindi text-sm text-muted-foreground">
            एजेंट बनें, दुकानदार जोड़ें और हर सब्सक्रिप्शन पर कमीशन कमाएँ।
          </p>
        </header>

        {!user && <GuestOptions onLogin={() => navigate("/login?next=/agent")} />}

        {user && !agent && mode === "choose" && (
          <GuestOptions
            signedIn
            onCreate={() => setMode("register")}
            onLogin={() => toast.info("आप पहले से लॉगिन हैं। कृपया Create Agent से रजिस्टर करें।")}
          />
        )}

        {user && !agent && mode === "register" && (
          <AgentRegistrationForm userId={user.id} email={user.email ?? ""} onDone={loadAgent} />
        )}

        {user && agent && agent.status !== "approved" && <AgentStatusCard agent={agent} />}

        {user && agent && agent.status === "approved" && <AgentDashboard agent={agent} />}

        <div className="mt-6">
          <AgentTerms />
        </div>
      </main>
    </div>
  );
};

const GuestOptions = ({
  onCreate, onLogin, signedIn,
}: { onCreate?: () => void; onLogin?: () => void; signedIn?: boolean }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5 text-primary" /> Create Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          नया एजेंट रजिस्ट्रेशन — नाम, मोबाइल, फ़ोटो और KYC दस्तावेज़ जमा करें। अप्रूवल के बाद आपको अपना यूनिक रेफरल लिंक मिलेगा।
        </p>
        <Button className="w-full" onClick={signedIn ? onCreate : onLogin}>
          <UserPlus className="mr-2 h-4 w-4" /> New Registration
        </Button>
      </CardContent>
    </Card>

    <Card className="border-2 border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><LogIn className="h-5 w-5 text-amber-600" /> Agent Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          पहले से एजेंट हैं? लॉगिन करें — आपकी लॉगिन सेशन सुरक्षित रहती है, बार-बार लॉगिन करने की ज़रूरत नहीं।
        </p>
        <Button variant="secondary" className="w-full" onClick={onLogin}>
          <LogIn className="mr-2 h-4 w-4" /> Login with Agent ID
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AgentStatusCard = ({ agent }: { agent: AgentRow }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-600" /> Application {agent.status}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <p>Agent ID: <span className="font-mono font-semibold">{agent.agent_code}</span></p>
      <p className="text-muted-foreground font-hindi">
        {agent.status === "rejected"
          ? "आपका आवेदन अस्वीकृत कर दिया गया है।"
          : agent.status === "suspended"
            ? "आपका एजेंट खाता अस्थायी रूप से निलंबित है।"
            : "आपका आवेदन एडमिन समीक्षा में है। अप्रूवल के बाद रेफरल लिंक और वॉलेट चालू हो जाएगा।"}
      </p>
      {agent.admin_notes && <p className="rounded-md bg-muted p-3 text-xs">{agent.admin_notes}</p>}
    </CardContent>
  </Card>
);

const AgentRegistrationForm = ({
  userId, email, onDone,
}: { userId: string; email: string; onDone: () => void | Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [regType, setRegType] = useState<"" | "self" | "coordinator">("");
  const [coordinatorCode, setCoordinatorCode] = useState("");
  const [coordinatorInfo, setCoordinatorInfo] = useState<{ id: string; name: string; coordinator_code: string } | null>(null);
  const [checkingCoordinator, setCheckingCoordinator] = useState(false);
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
    const path = `agents/${userId}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(""); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setter(data.publicUrl);
    setUploading("");
    toast.success("Uploaded");
  };

  const pick = (
    e: React.ChangeEvent<HTMLInputElement>, folder: string, setter: (u: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) void upload(file, folder, setter);
  };

  const verifyCoordinator = async () => {
    const code = coordinatorCode.trim().toUpperCase();
    if (!code) { toast.error("Coordinator ID दर्ज करें"); return null; }
    setCheckingCoordinator(true);
    const { data, error } = await supabase.rpc("lookup_coordinator_by_code", { p_code: code });
    setCheckingCoordinator(false);
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      setCoordinatorInfo(null);
      toast.error("यह Coordinator ID मान्य नहीं है या सक्रिय नहीं है");
      return null;
    }
    setCoordinatorInfo({ id: row.id, name: row.name, coordinator_code: row.coordinator_code });
    toast.success(`Coordinator सत्यापित: ${row.name}`);
    return row;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobile = form.mobile.replace(/\D/g, "");
    if (!form.name.trim()) { toast.error("नाम दर्ज करें"); return; }
    if (mobile.length < 10) { toast.error("मान्य मोबाइल नंबर दर्ज करें"); return; }
    if (!photoUrl) { toast.error("अपनी फ़ोटो अपलोड करें"); return; }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) { toast.error("आधार के दोनों फ़ोटो अपलोड करें"); return; }
    const acc = form.accountNumber.replace(/\s/g, "");
    const confirmAcc = form.confirmAccountNumber.replace(/\s/g, "");
    const ifsc = form.ifsc.replace(/\s/g, "").toUpperCase();
    if (!form.accountHolderName.trim()) { toast.error("खाताधारक का नाम दर्ज करें"); return; }
    if (acc.length < 8) { toast.error("मान्य बैंक खाता नंबर दर्ज करें"); return; }
    if (acc !== confirmAcc) { toast.error("खाता नंबर मेल नहीं खा रहे हैं"); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { toast.error("मान्य IFSC कोड दर्ज करें"); return; }
    if (!regType) { toast.error("कृपया 'Self' या 'Coordinator ID' विकल्प चुनें"); return; }
    let coordinatorId: string | null = null;
    if (regType === "coordinator") {
      const verified = coordinatorInfo && coordinatorInfo.coordinator_code === coordinatorCode.trim().toUpperCase()
        ? coordinatorInfo
        : await verifyCoordinator();
      if (!verified) return;
      coordinatorId = verified.id;
    }
    if (!acceptedTerms) { toast.error("कृपया एजेंट नियम और शर्तें स्वीकार करें"); return; }

    setSaving(true);
    const { error } = await supabase.from("agents").insert({
      user_id: userId,
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
      registration_type: regType,
      coordinator_id: coordinatorId,
    });
    setSaving(false);
    if (error) { toast.error(error.message || "Registration failed"); return; }
    toast.success("आवेदन जमा हो गया! एडमिन अप्रूवल के बाद रेफरल लिंक मिलेगा।");
    await onDone();
  };

  const UploadTile = ({
    label, url, onCamera, onGallery, folder,
  }: { label: string; url: string; onCamera: () => void; onGallery: () => void; folder: string }) => (
    <div className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-2 text-xs">
      <div className="flex h-16 w-16 items-center justify-center">
        {url ? (
          <img src={url} alt={label} className="h-16 w-16 rounded-md object-cover" />
        ) : uploading === folder ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <span className="text-center font-medium">{label}</span>
      <div className="flex w-full gap-1">
        <Button type="button" size="sm" variant="secondary" className="h-7 flex-1 px-1 text-[10px]" onClick={onCamera}>
          <Camera className="mr-1 h-3 w-3" /> कैमरा
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 flex-1 px-1 text-[10px]" onClick={onGallery}>
          <ImageIcon className="mr-1 h-3 w-3" /> गैलरी
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle>Agent Registration</CardTitle></CardHeader>
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

          <div className="rounded-lg border-2 border-primary/25 bg-primary/5 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> रजिस्ट्रेशन प्रकार चुनें * (अनिवार्य)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setRegType("self"); setCoordinatorInfo(null); }}
                className={`rounded-xl border-2 p-3 text-left transition ${regType === "self" ? "border-primary bg-background shadow" : "border-border bg-background/60"}`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4" /> Self Registration</p>
                <p className="font-hindi text-xs text-muted-foreground">मैं स्वयं एजेंट बन रहा/रही हूँ (निःशुल्क)</p>
              </button>
              <button
                type="button"
                onClick={() => setRegType("coordinator")}
                className={`rounded-xl border-2 p-3 text-left transition ${regType === "coordinator" ? "border-amber-500 bg-background shadow" : "border-border bg-background/60"}`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-amber-600" /> Coordinator ID से</p>
                <p className="font-hindi text-xs text-muted-foreground">किसी कोऑर्डिनेटर के अंतर्गत जुड़ रहा/रही हूँ</p>
              </button>
            </div>

            {regType === "coordinator" && (
              <div className="mt-3 space-y-2">
                <Label>Coordinator ID *</Label>
                <div className="flex gap-2">
                  <Input
                    value={coordinatorCode}
                    onChange={(e) => { setCoordinatorCode(e.target.value.toUpperCase()); setCoordinatorInfo(null); }}
                    placeholder="CO123456"
                    maxLength={12}
                  />
                  <Button type="button" variant="secondary" onClick={() => void verifyCoordinator()} disabled={checkingCoordinator}>
                    {checkingCoordinator ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                {coordinatorInfo && (
                  <p className="font-hindi text-xs text-emerald-600">
                    सत्यापित: {coordinatorInfo.name} ({coordinatorInfo.coordinator_code}) — यह लिंक स्थायी रूप से लॉक हो जाएगा।
                  </p>
                )}
                <p className="font-hindi text-[11px] text-muted-foreground">
                  एक बार जुड़ने के बाद Coordinator ID बदला नहीं जा सकता।
                </p>
              </div>
            )}
          </div>

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

          <AgentTerms compact />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} className="mt-0.5" />
            <span className="font-hindi text-sm">
              मैंने ऊपर दी गई एजेंट नियम और शर्तें पढ़ ली हैं और मैं इन्हें पूरी तरह स्वीकार करता/करती हूँ।
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={saving || !acceptedTerms}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
            Submit Application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const AgentDashboard = ({ agent }: { agent: AgentRow }) => {
  return <AgentDashboardInner agent={agent} />;
};

const WithdrawalCard = ({
  agent, commissions, withdrawals, onDone,
}: { agent: AgentRow; commissions: any[]; withdrawals: any[]; onDone: () => void | Promise<void> }) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const holdCutoff = Date.now() - HOLD_DAYS * 24 * 60 * 60 * 1000;
  const heldAmount = commissions
    .filter((c) => new Date(c.created_at).getTime() > holdCutoff)
    .reduce((s, c) => s + Number(c.amount || 0), 0);
  const balance = Number(agent.wallet_balance || 0);
  const eligible = Math.max(0, balance - heldAmount);
  const hasBank = !!(agent.bank_account_number && agent.ifsc_code);
  const canWithdraw = eligible >= MIN_WITHDRAWAL && hasBank;

  const submit = async () => {
    const amt = Number(amount || eligible);
    if (!hasBank) { toast.error("पहले बैंक विवरण भरें"); return; }
    if (amt < MIN_WITHDRAWAL) { toast.error(`न्यूनतम निकासी ${inr(MIN_WITHDRAWAL)} है`); return; }
    if (amt > eligible) { toast.error("उपलब्ध eligible बैलेंस से अधिक राशि नहीं निकाल सकते"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("agent_withdrawals").insert({
      agent_id: agent.id,
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      amount: amt,
      account_holder_name: agent.account_holder_name ?? null,
      bank_account_number: agent.bank_account_number ?? null,
      ifsc_code: agent.ifsc_code ?? null,
      upi_id: agent.upi_id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Withdrawal request failed"); return; }
    toast.success("निकासी अनुरोध भेज दिया गया — एडमिन अप्रूवल की प्रतीक्षा करें।");
    setAmount("");
    await onDone();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" /> Withdrawal</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Wallet Balance</p><p className="font-bold">{inr(balance)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">On Hold ({HOLD_DAYS} days)</p><p className="font-bold text-amber-600">{inr(heldAmount)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Eligible</p><p className="font-bold text-emerald-600">{inr(eligible)}</p></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            inputMode="numeric"
            placeholder={`Amount (min ${MIN_WITHDRAWAL})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          />
          <Button onClick={submit} disabled={!canWithdraw || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
            Request Withdrawal
          </Button>
        </div>
        {!hasBank && <p className="font-hindi text-xs text-destructive">निकासी से पहले बैंक विवरण भरना अनिवार्य है।</p>}
        {hasBank && eligible < MIN_WITHDRAWAL && (
          <p className="font-hindi text-xs text-muted-foreground">
            न्यूनतम निकासी राशि {inr(MIN_WITHDRAWAL)} है। कमीशन {HOLD_DAYS} दिन के होल्डिंग पीरियड के बाद eligible होता है।
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

const BankDetailsCard = ({ agent }: { agent: AgentRow }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: agent.account_holder_name || "",
    accountNumber: agent.bank_account_number || "",
    confirmAccountNumber: agent.bank_account_number || "",
    ifsc: agent.ifsc_code || "",
    upiId: agent.upi_id || "",
  });

  const save = async () => {
    const acc = form.accountNumber.replace(/\s/g, "");
    const ifsc = form.ifsc.replace(/\s/g, "").toUpperCase();
    if (!form.accountHolderName.trim()) { toast.error("खाताधारक का नाम दर्ज करें"); return; }
    if (acc.length < 8) { toast.error("मान्य बैंक खाता नंबर दर्ज करें"); return; }
    if (acc !== form.confirmAccountNumber.replace(/\s/g, "")) { toast.error("खाता नंबर मेल नहीं खा रहे हैं"); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { toast.error("मान्य IFSC कोड दर्ज करें"); return; }
    setSaving(true);
    const { error } = await supabase.from("agents").update({
      account_holder_name: form.accountHolderName.trim(),
      bank_account_number: acc,
      ifsc_code: ifsc,
      upi_id: form.upiId.trim() || null,
    }).eq("id", agent.id);
    setSaving(false);
    if (error) { toast.error(error.message || "Save failed"); return; }
    toast.success("बैंक विवरण सुरक्षित हो गया");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" /> Bank & UPI Details</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Account Holder Name</Label><Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} maxLength={100} /></div>
          <div><Label>Bank Account Number</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} maxLength={20} inputMode="numeric" /></div>
          <div><Label>Confirm Account Number</Label><Input value={form.confirmAccountNumber} onChange={(e) => setForm({ ...form, confirmAccountNumber: e.target.value })} maxLength={20} inputMode="numeric" /></div>
          <div><Label>IFSC Code</Label><Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} maxLength={11} /></div>
          <div className="md:col-span-2"><Label>UPI ID (Optional)</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} maxLength={80} placeholder="name@bank" /></div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Details</Button>
      </CardContent>
    </Card>
  );
};

const AgentDashboardInner = ({ agent }: { agent: AgentRow }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const load = async () => {
    const [{ data: refs }, { data: comms }, { data: wds }] = await Promise.all([
      supabase.from("agent_referrals").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }),
      supabase.from("agent_commissions").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }),
      supabase.from("agent_withdrawals").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }),
    ]);
    setReferrals(refs || []);
    setCommissions(comms || []);
    setWithdrawals(wds || []);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`agent-live-${agent.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_commissions", filter: `agent_id=eq.${agent.id}` }, () => {
        void load();
        toast.success("नया कमीशन आपके वॉलेट में जुड़ गया!");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_referrals", filter: `agent_id=eq.${agent.id}` }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_withdrawals", filter: `agent_id=eq.${agent.id}` }, () => {
        void load();
      })
      .subscribe();
    // Safety net if the realtime socket drops (mobile WebView / background).
    const poll = window.setInterval(() => void load(), 20000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-4 w-4" /> Live Wallet
            </p>
            <p className="mt-1 flex items-center text-4xl font-extrabold text-emerald-700 dark:text-emerald-400">
              <IndianRupee className="h-7 w-7" />{Number(agent.wallet_balance || 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              हर सब्सक्रिप्शन (₹10 / ₹99 / ₹999) और उसके रिन्यूअल पर 10% कमीशन
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live</Badge>
            <p className="mt-2 text-xs text-muted-foreground">Agent ID</p>
            <p className="font-mono text-lg font-bold">{agent.agent_code}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Referrals</p><p className="text-2xl font-bold">{referrals.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid Subscriptions</p><p className="text-2xl font-bold">{commissions.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Earned</p><p className="text-2xl font-bold">{inr(agent.wallet_balance)}</p></CardContent></Card>
      </div>

      <WithdrawalCard agent={agent} commissions={commissions} withdrawals={withdrawals} onDone={load} />

      <BankDetailsCard agent={agent} />

      <Card className="border-2 border-primary/25 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" /> रजिस्ट्रेशन कैसे करवाएँ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-hindi text-sm font-medium">
            मर्चेंट पोर्टल का रजिस्ट्रेशन करवाने के लिए आपको लॉगिन करते समय अपना एजेंट आईडी दर्ज करना होगा।
          </p>
          <p className="font-hindi text-xs text-muted-foreground">
            लॉगिन/रजिस्ट्रेशन स्क्रीन पर “Agent” विकल्प चुनकर यह Agent ID डालें:{" "}
            <span className="font-mono font-bold text-foreground">{agent.agent_code}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4" /> आपके द्वारा जोड़े गए लॉगिन</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="font-hindi text-sm text-muted-foreground">अभी कोई रजिस्ट्रेशन नहीं। यूज़र को लॉगिन के समय अपना Agent ID दर्ज करने को कहें।</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{r.shop_name || (r.source === "login_agent_id" ? "Login (Agent ID)" : "User")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge variant="secondary">Joined</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AgentTransactionLog agentId={agent.id} />

      <p className="text-center text-xs text-muted-foreground">
        सवाल? <Link to="/help" className="underline">Help Desk</Link>
      </p>
    </div>
  );
};

type TxRow = {
  id: string;
  created_at: string;
  merchant_name: string | null;
  shop_name: string | null;
  plan: string | null;
  module: string | null;
  amount: number;
};

const AgentTransactionLog = ({ agentId }: { agentId: string }) => {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("agent_transaction_log", {
      p_agent_id: agentId,
      p_search: q.trim() || null,
      p_from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
      p_to: to ? new Date(`${to}T23:59:59`).toISOString() : null,
      p_limit: 500,
      p_offset: 0,
    });
    setBusy(false);
    if (error) { toast.error(error.message || "Load failed"); return; }
    setRows((data as unknown as TxRow[]) || []);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [agentId]);

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" /> Transaction Log — कमीशन इतिहास (10%)
        </CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="दुकान / मर्चेंट / प्लान खोजें"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void load(); }}
          />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={load} disabled={busy}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />} खोजें
            </Button>
            <Button variant="outline" onClick={() => { setQ(""); setFrom(""); setTo(""); setTimeout(() => void load(), 0); }}>Reset</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {rows.length} transactions · कुल कमीशन <span className="font-semibold text-emerald-600">{inr(total)}</span>
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="font-hindi text-sm text-muted-foreground">इस फ़िल्टर में कोई कमीशन ट्रांज़ैक्शन नहीं मिला।</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.shop_name || r.merchant_name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.merchant_name || "—"} · <span className="capitalize">{r.plan}</span>
                    {r.module ? ` · ${String(r.module).replace(/_/g, " ")}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
                </div>
                <span className="whitespace-nowrap font-semibold text-emerald-600">+{inr(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPortal;