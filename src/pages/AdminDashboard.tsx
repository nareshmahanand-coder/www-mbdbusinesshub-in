import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Store, Heart, CreditCard, ShieldCheck,
  MessageSquareWarning, Send, Receipt, BarChart3, Settings as SettingsIcon,
  LogOut, Search, CheckCircle2, XCircle, Eye, RefreshCw, Moon, Sun,
  MapPin, Phone, Calendar, FileCheck2, Mail, Ban, ShieldOff, Trash2, UserX,
  AlertTriangle, MessageCircle, UserCog, Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, SUPERUSER_FLAG } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/lib/signedStorageUrl";

const KycThumb = ({ rawUrl, alt, className }: { rawUrl: string | null | undefined; alt: string; className?: string }) => {
  const signed = useSignedUrl(rawUrl, "kyc-photos");
  if (!rawUrl) return null;
  if (!signed) {
    return <div className={`flex items-center justify-center rounded border bg-muted text-[10px] text-muted-foreground ${className || "h-20 w-full"}`}>…</div>;
  }
  return (
    <a href={signed} target="_blank" rel="noreferrer">
      <img src={signed} className={className || "h-20 w-full object-cover rounded border"} alt={alt} />
    </a>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Section =
  | "overview" | "users" | "merchants" | "matrimony" | "subscriptions"
  | "kyc" | "complaints" | "delete_requests" | "duplicates" | "messaging" | "audit" | "analytics" | "settings"
  | "agents";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "All Users", icon: Users },
  { id: "merchants", label: "Merchants / Shops", icon: Store },
  { id: "matrimony", label: "Matrimony Profiles", icon: Heart },
  { id: "agents", label: "Agent Management", icon: UserCog },
  { id: "subscriptions", label: "Subscriptions & Plans", icon: CreditCard },
  { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
  { id: "complaints", label: "Complaints & Reports", icon: MessageSquareWarning },
  { id: "delete_requests", label: "Delete Account Requests", icon: UserX },
  { id: "duplicates", label: "Duplicate Attempts", icon: AlertTriangle },
  { id: "messaging", label: "Messaging Center", icon: Send },
  { id: "audit", label: "Audit & Payments", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const inr = (n: number | null | undefined) =>
  "₹" + (Number(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const ADMIN_PIN = "02032026";

const HELPLINE_WA = "919203645007";
const HELPLINE_WA_DISPLAY = "+91 9203645007";
const HELPLINE_EMAIL = "helpline.bharatdukaan@gmail.com";

const fetchMembership = async (userId: string) => {
  const nowIso = new Date().toISOString();
  const { data: bg } = await supabase
    .from("bharat_gaurav_memberships")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (bg) {
    return {
      membership_status: "active",
      membership_type: "Bharat Gaurav",
      plan_type: bg.plan,
      current_period_end: bg.expires_at,
    };
  }
  const { data: mp } = await supabase
    .from("merchant_profiles")
    .select("is_premium, premium_plan, plan_ends_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (mp?.is_premium) {
    return {
      membership_status: "active",
      membership_type: "Merchant Premium",
      plan_type: mp.premium_plan,
      current_period_end: mp.plan_ends_at,
    };
  }
  return null;
};

const buildPersonalizedText = async (target: any, title: string, message: string) => {
  if (!target) return "";
  const name = target.display_name || "\u0917\u094d\u0930\u093e\u0939\u0915";
  const m = await fetchMembership(target.id);
  const memLine = m && m.membership_status === "active"
    ? `\u0938\u0926\u0938\u094d\u092f\u0924\u093e / Membership: ${m.membership_type || "\u2014"}${m.plan_type ? ` (${m.plan_type})` : ""} \u2014 Active`
    : `\u0938\u0926\u0938\u094d\u092f\u0924\u093e / Membership: Inactive`;
  const header = `\u0928\u092e\u0938\u094d\u0924\u0947 ${name} \u091c\u0940,\n${memLine}\n\n`;
  const footer = `\n\n\u2014 \u092e\u0947\u0930\u093e \u092d\u093e\u0930\u0924 \u0926\u0941\u0915\u093e\u0928 (Mera Bharat Dukaan)\nHelpline WhatsApp: ${HELPLINE_WA_DISPLAY}\nHelpline Email: ${HELPLINE_EMAIL}`;
  const body = `${title ? title + "\n\n" : ""}${message}${footer}`;
  return header + body;
};

const adminFetch = async (action: string, extra: Record<string, unknown> = {}) => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-pin": ADMIN_PIN,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("admin-data error", res.status, t);
    return null;
  }
  return res.json();
};

// Auto-refresh hook: runs `fn` immediately, then every `ms` milliseconds.
const useAutoRefresh = (fn: () => void | Promise<void>, ms = 8000, deps: any[] = []) => {
  useEffect(() => {
    let active = true;
    const tick = async () => { if (active) await fn(); };
    tick();
    const id = window.setInterval(tick, ms);
    return () => { active = false; window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const getMissingKycPhotos = (k: any) =>
  [
    !k?.selfie_url && "Selfie",
    !k?.aadhaar_front_url && "Aadhaar Front",
    !k?.aadhaar_back_url && "Aadhaar Back",
  ].filter(Boolean) as string[];

const formatKycMissingPhotos = (missing: string[]) =>
  missing.map((m) => {
    const labels: Record<string, string> = {
      selfie_url: "Selfie",
      aadhaar_front_url: "Aadhaar Front",
      aadhaar_back_url: "Aadhaar Back",
    };
    return labels[m] || m;
  });

const StatCard = ({ label, value, hint, accent = "bg-primary/10 text-primary" }: any) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`rounded-lg px-2 py-1 text-xs font-semibold ${accent}`}>LIVE</div>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { isSuperUser } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (!isSuperUser) return <Navigate to="/login" replace />;

  const logout = () => {
    localStorage.removeItem(SUPERUSER_FLAG);
    window.dispatchEvent(new Event("mbd-superuser-changed"));
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="px-5 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">BD</div>
            <div>
              <p className="font-bold leading-tight">Bharat Dukan</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t p-3 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDark((d) => !d)}>
            {dark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {dark ? "Light" : "Dark"} mode
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-card/80 backdrop-blur px-4 md:px-6 py-3">
          <div className="md:hidden">
            <Select value={section} onValueChange={(v) => setSection(v as Section)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NAV.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <h1 className="hidden md:block text-xl font-bold capitalize">
            {NAV.find((n) => n.id === section)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live</Badge>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {section === "overview" && <Overview onJump={setSection} />}
          {section === "users" && <UsersSection />}
          {section === "merchants" && <MerchantsSection />}
          {section === "matrimony" && <MatrimonySection />}
          {section === "agents" && <AgentsSection />}
          {section === "subscriptions" && <SubscriptionsSection />}
          {section === "kyc" && <KycSection />}
          {section === "complaints" && <ComplaintsSection />}
          {section === "delete_requests" && <DeleteRequestsSection />}
          {section === "duplicates" && <DuplicateAttemptsSection />}
          {section === "messaging" && <MessagingSection />}
          {section === "audit" && <AuditSection />}
          {section === "analytics" && <AnalyticsSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  );
};

const Overview = ({ onJump }: { onJump: (s: Section) => void }) => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await adminFetch("overview");
    if (data) setStats(data);
    setLoading(false);
  };

  useAutoRefresh(load, 8000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Real-time overview • auto-refresh every 8s</p>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users ?? "—"} hint="Registered" accent="bg-blue-500/10 text-blue-600" />
        <StatCard label="Premium Members" value={stats.premium ?? "—"} hint="Bharat Gaurav" accent="bg-amber-500/10 text-amber-600" />
        <StatCard label="Total Shops" value={stats.merchants ?? "—"} hint={`${stats.freeMerchants ?? 0} free`} accent="bg-emerald-500/10 text-emerald-600" />
        <StatCard label="Premium Shops" value={stats.premiumMerchants ?? "—"} hint="Verified" accent="bg-purple-500/10 text-purple-600" />
        <StatCard label="Earnings Today" value={inr(stats.todayEarn)} hint="Paid orders" accent="bg-orange-500/10 text-orange-600" />
        <StatCard label="Earnings (Month)" value={inr(stats.monthEarn)} hint="Month to date" accent="bg-orange-500/10 text-orange-600" />
        <StatCard label="Pending KYC" value={stats.kyc ?? "—"} hint="Awaiting review" accent="bg-red-500/10 text-red-600" />
        <StatCard label="Pending Complaints" value={stats.complaints ?? "—"} hint="Need response" accent="bg-rose-500/10 text-rose-600" />
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => onJump("kyc")}><ShieldCheck className="h-4 w-4 mr-2" />Review KYC</Button>
          <Button variant="secondary" onClick={() => onJump("complaints")}><MessageSquareWarning className="h-4 w-4 mr-2" />Open Complaints</Button>
          <Button variant="secondary" onClick={() => onJump("messaging")}><Send className="h-4 w-4 mr-2" />Send Broadcast</Button>
          <Button variant="outline" onClick={() => onJump("audit")}><Receipt className="h-4 w-4 mr-2" />Payment Audit</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const UsersSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<any>(null);
  const [blockTarget, setBlockTarget] = useState<any>(null);
  const [reason, setReason] = useState("Spam");
  const [customReason, setCustomReason] = useState("");

  // Quick-message dialog state
  const [msgTarget, setMsgTarget] = useState<any>(null);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSeverity, setMsgSeverity] = useState("info");
  const [msgSending, setMsgSending] = useState(false);

  const load = async () => {
    const data = await adminFetch("users");
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((r) =>
      !s || (r.display_name || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) || (r.phone || "").includes(s)
    );
  }, [rows, q]);

  const doBlock = async () => {
    if (!blockTarget) return;
    const finalReason = reason === "Other" ? (customReason || "Other") : reason;
    const res = await adminFetch("block_user", { user_id: blockTarget.id, reason: finalReason });
    if (res?.ok) {
      toast.success("User blocked");
      setBlockTarget(null); setCustomReason(""); setReason("Spam");
      load();
    } else toast.error("Failed to block");
  };

  const doUnblock = async (u: any) => {
    const res = await adminFetch("unblock_user", { user_id: u.id });
    if (res?.ok) { toast.success("User unblocked"); load(); }
    else toast.error("Failed to unblock");
  };

  const doDeleteUser = async (u: any) => {
    const label = u.display_name || u.phone || u.email || "user";
    if (!confirm(`Permanently delete ${label}? यह action undo नहीं हो सकता।`)) return;
    const res = await adminFetch("delete_user", { user_id: u.id });
    if (res?.ok) { toast.success("User deleted"); load(); }
    else toast.error(res?.error || "Failed to delete");
  };

  // Quick-send helpers per user row
  const openMsgDialog = (u: any) => {
    setMsgTarget(u);
    setMsgTitle("");
    setMsgBody("");
    setMsgSeverity("info");
  };

  const sendRowInApp = async () => {
    if (!msgTarget) return;
    if (!msgTitle.trim() || !msgBody.trim()) return toast.error("Title & message required");
    setMsgSending(true);
    const res = await adminFetch("send_direct_message", {
      user_id: msgTarget.id, title: msgTitle, message: msgBody, severity: msgSeverity,
    });
    setMsgSending(false);
    if (res?.ok) { toast.success("In-App notification sent"); setMsgTarget(null); setMsgTitle(""); setMsgBody(""); }
    else toast.error(res?.error || "Failed");
  };

  const sendRowWhatsApp = async () => {
    if (!msgTarget) return;
    if (!msgBody.trim()) return toast.error("Message required");
    const text = encodeURIComponent(await buildPersonalizedText(msgTarget, msgTitle, msgBody));
    const userPhone = msgTarget.phone ? String(msgTarget.phone).replace(/\D/g, "") : "";
    const to = userPhone || HELPLINE_WA;
    window.open(`https://wa.me/${to}?text=${text}`, "_blank");
    toast.success(`WhatsApp opened (Helpline ${HELPLINE_WA_DISPLAY})`);
    setMsgTarget(null); setMsgTitle(""); setMsgBody("");
  };

  const sendRowEmail = async () => {
    if (!msgTarget) return;
    if (!msgTarget.email) return toast.error("User has no email on file");
    if (!msgBody.trim()) return toast.error("Message required");
    const subject = encodeURIComponent(msgTitle || "मेरा भारत दुकान — Update");
    const body = encodeURIComponent(await buildPersonalizedText(msgTarget, msgTitle, msgBody));
    const url = `https://mail.google.com/mail/?view=cm&fs=1&authuser=${encodeURIComponent(HELPLINE_EMAIL)}&to=${encodeURIComponent(msgTarget.email)}&su=${subject}&body=${body}`;
    window.open(url, "_blank");
    toast.success(`Gmail opened (from ${HELPLINE_EMAIL})`);
    setMsgTarget(null); setMsgTitle(""); setMsgBody("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>All Users ({filtered.length})</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone..." className="pl-8" />
          </div>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead>
            <TableHead>City</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                <TableCell>{u.phone || "—"}</TableCell>
                <TableCell className="text-xs">{u.email || "—"}</TableCell>
                <TableCell>{u.city || "—"}</TableCell>
                <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {u.blocked
                    ? <Badge variant="destructive" title={u.block_reason}>Blocked</Badge>
                    : <Badge variant="secondary">Active</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => setView(u)} title="View"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => openMsgDialog(u)} title="Send Message">
                      <Send className="h-3.5 w-3.5 mr-1" />Send Message
                    </Button>
                    {u.blocked ? (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => doUnblock(u)}>
                        <ShieldOff className="h-3.5 w-3.5 mr-1" />Unblock
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setBlockTarget(u)}>
                        <Ban className="h-3.5 w-3.5 mr-1" />Block
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="h-7 px-2 bg-red-700 hover:bg-red-800" onClick={() => doDeleteUser(u)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No users</p>}
      </CardContent>

      {/* Quick Message Dialog */}
      <Dialog open={!!msgTarget} onOpenChange={(o) => !o && setMsgTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Message — {msgTarget?.display_name || "User"}</DialogTitle></DialogHeader>
          {msgTarget && (
            <div className="space-y-3 text-sm">
              <div className="rounded border bg-muted/40 p-2 text-xs space-y-1">
                <div><b>Mobile:</b> {msgTarget.phone || <span className="text-muted-foreground">— not on file</span>}</div>
                <div><b>Email:</b> {msgTarget.email || <span className="text-muted-foreground">— not on file</span>}</div>
              </div>
              <Select value={msgSeverity} onValueChange={setMsgSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Title" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} />
              <Textarea placeholder="Message to user..." rows={3} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button onClick={sendRowInApp} disabled={msgSending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Send className="h-4 w-4 mr-1" />In-App
                </Button>
                <Button onClick={sendRowWhatsApp} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                  <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                </Button>
                <Button onClick={sendRowEmail} variant="outline" className="border-orange-600 text-orange-700 hover:bg-orange-50">
                  <Mail className="h-4 w-4 mr-1" />Email
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                WhatsApp <b>{HELPLINE_WA_DISPLAY}</b> से और Email <b>{HELPLINE_EMAIL}</b> से auto-prefill होकर खुलेगा।
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              {view.avatar_url && <img src={view.avatar_url} className="h-20 w-20 rounded-full object-cover" alt="" />}
              <p><b>Name:</b> {view.display_name || "—"}</p>
              <p><b>Phone:</b> {view.phone || "—"}</p>
              <p><b>Email:</b> {view.email || "—"}</p>
              <p><b>City:</b> {view.city || "—"}</p>
              <p><b>Address:</b> {view.address || "—"}</p>
              <p><b>Provider:</b> {view.provider || "—"}</p>
              <p><b>Phone Verified:</b> {view.phone_verified ? "Yes" : "No"}</p>
              {view.blocked && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2">
                  <p className="font-semibold text-destructive">Blocked</p>
                  <p className="text-xs"><b>Reason:</b> {view.block_reason || "—"}</p>
                  {view.blocked_at && <p className="text-xs"><b>At:</b> {new Date(view.blocked_at).toLocaleString()}</p>}
                </div>
              )}
              <p><b>Joined:</b> {new Date(view.created_at).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ID: {view.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Block User</DialogTitle></DialogHeader>
          {blockTarget && (
            <div className="space-y-3 text-sm">
              <p><b>{blockTarget.display_name || blockTarget.phone || blockTarget.email}</b> को ब्लॉक करने का कारण चुनें:</p>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam">Spam</SelectItem>
                  <SelectItem value="Fake Profile">Fake Profile</SelectItem>
                  <SelectItem value="Illegal Activity">Illegal Activity</SelectItem>
                  <SelectItem value="Abusive Behavior">Abusive Behavior</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {reason === "Other" && (
                <Textarea placeholder="कारण लिखें..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBlockTarget(null)}>Cancel</Button>
                <Button variant="destructive" onClick={doBlock}>
                  <Ban className="h-4 w-4 mr-1" />Block User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const DuplicateAttemptsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [kind, setKind] = useState<string>("all");
  const load = async () => {
    const data = await adminFetch("duplicate_attempts");
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 10000);

  const remove = async (id: string) => {
    if (!confirm("Delete this log entry?")) return;
    const res = await adminFetch("delete_duplicate_attempt", { id });
    if (res?.ok) { toast.success("Removed"); load(); }
    else toast.error(res?.error || "Failed");
  };

  const kindLabel: Record<string, string> = {
    signup_email: "Signup • Email",
    signup_phone: "Signup • Phone",
    kyc_aadhaar: "e-KYC • Aadhaar",
    kyc_mobile: "e-KYC • Mobile",
  };
  const kindVariant: Record<string, "destructive" | "secondary" | "default" | "outline"> = {
    signup_email: "secondary",
    signup_phone: "secondary",
    kyc_aadhaar: "destructive",
    kyc_mobile: "destructive",
  };
  const maskAadhaar = (v: string) => v.length === 12 ? `XXXX XXXX ${v.slice(-4)}` : v;
  const display = (r: any) => r.kind === "kyc_aadhaar" ? maskAadhaar(r.value) : r.value;

  const filtered = kind === "all" ? rows : rows.filter((r) => r.kind === kind);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Duplicate Attempts ({filtered.length})
        </CardTitle>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kinds</SelectItem>
            <SelectItem value="signup_email">Signup • Email</SelectItem>
            <SelectItem value="signup_phone">Signup • Phone</SelectItem>
            <SelectItem value="kyc_aadhaar">e-KYC • Aadhaar</SelectItem>
            <SelectItem value="kyc_mobile">e-KYC • Mobile</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">कोई duplicate attempt नहीं / No duplicate attempts.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Attempted By</TableHead>
                <TableHead>Conflicts With</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={kindVariant[r.kind] || "outline"}>{kindLabel[r.kind] || r.kind}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{display(r)}</TableCell>
                  <TableCell className="text-xs">
                    {r.attempted_profile ? (
                      <>
                        <div className="font-medium">{r.attempted_profile.display_name || "—"}</div>
                        <div className="text-muted-foreground">{r.attempted_profile.email || r.attempted_profile.phone || ""}</div>
                      </>
                    ) : <span className="text-muted-foreground">Anonymous</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.existing_profile ? (
                      <>
                        <div className="font-medium">{r.existing_profile.display_name || "—"}</div>
                        <div className="text-muted-foreground">{r.existing_profile.email || r.existing_profile.phone || ""}</div>
                      </>
                    ) : <span className="text-muted-foreground">{r.existing_user_id?.slice(0, 8) || "—"}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const MerchantsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const data = await adminFetch("merchants");
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000);

  const togglePremium = async (m: any) => {
    await adminFetch("update", { table: "merchant_profiles", id: m.id, patch: { is_premium: !m.is_premium } });
    toast.success("Updated"); load();
  };
  const toggleVerified = async (m: any) => {
    await adminFetch("update", { table: "merchant_profiles", id: m.id, patch: { is_verified: !m.is_verified } });
    toast.success("Updated"); load();
  };

  const filtered = rows.filter((r) =>
    !q || (r.shop_name || "").toLowerCase().includes(q.toLowerCase()) || (r.phone || "").includes(q)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Merchants / Shops ({filtered.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-64" />
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Shop</TableHead><TableHead>Owner</TableHead><TableHead>City</TableHead>
            <TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.shop_name}</TableCell>
                <TableCell>{m.owner_name || "—"}</TableCell>
                <TableCell>{m.city || "—"}</TableCell>
                <TableCell>{m.phone || "—"}</TableCell>
                <TableCell className="space-x-1">
                  {m.is_premium ? <Badge className="bg-amber-500">Premium</Badge> : <Badge variant="secondary">Free</Badge>}
                  {m.is_verified && <Badge className="bg-emerald-600">Verified</Badge>}
                </TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" variant="outline" onClick={() => togglePremium(m)}>Toggle Premium</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleVerified(m)}>Toggle Verified</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No merchants</p>}
      </CardContent>
    </Card>
  );
};

const MatrimonySection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const data = await adminFetch("matrimony");
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000);

  const setStatus = async (id: string, moderation_status: string) => {
    await adminFetch("update", { table: "matrimony_profiles", id, patch: { moderation_status, is_published: moderation_status === "approved" } });
    toast.success("Updated"); load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Matrimony Profiles ({rows.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Gender</TableHead><TableHead>City</TableHead>
            <TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.gender}</TableCell>
                <TableCell>{p.city || "—"}</TableCell>
                <TableCell>{p.subscription_plan || "Free"}</TableCell>
                <TableCell><Badge variant={p.is_published ? "default" : "secondary"}>{p.moderation_status}</Badge></TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}>Reject</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No profiles</p>}
      </CardContent>
    </Card>
  );
};

const SubscriptionsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [confirm, setConfirm] = useState<any>(null);
  const [details, setDetails] = useState<any | null>(null);
  const load = async () => {
    const data = await adminFetch("subscriptions");
    const bg = { data: data?.bg || [] };
    const mp = { data: data?.mp || [] };
    const mat = { data: data?.mat || [] };
    const profiles: Record<string, any> = data?.profiles || {};
    const payments: Record<string, any> = data?.payments || {};
    const nameFor = (uid: string) => {
      const p = profiles[uid];
      return p?.display_name || p?.email || p?.phone || (uid ? uid.slice(0, 8) + "…" : "—");
    };
    const phoneFor = (uid: string) => profiles[uid]?.phone || "";
    const emailFor = (uid: string) => profiles[uid]?.email || "";
    const mapPayStatus = (s: string | undefined, fallback = "pending") => {
      const v = (s || fallback).toLowerCase();
      if (v === "active" || v === "paid" || v === "verified") return "Active";
      if (v === "failed" || v === "cancelled" || v === "error") return "Failed";
      return "Pending";
    };
    const out: any[] = [];
    (bg.data || []).forEach((r: any) => out.push({
      id: "bg-" + r.id, kind: "bg", refId: r.id,
      source: "Bharat Gaurav",
      user_id: r.user_id,
      who: nameFor(r.user_id),
      phone: phoneFor(r.user_id),
      email: emailFor(r.user_id),
      plan: r.plan, amount: r.amount, status: r.status,
      payStatus: mapPayStatus(r.status, "pending"),
      latestPayment: payments[`${r.user_id}|bharat_gaurav`] || null,
      started: r.started_at, ends: r.expires_at, ref: r.razorpay_payment_id,
      created_at: r.created_at,
    }));
    (mp.data || []).forEach((r: any) => out.push({
      id: "mp-" + r.user_id, kind: "mp", refId: r.user_id,
      source: "Merchant Premium",
      user_id: r.user_id,
      who: r.shop_name || nameFor(r.user_id),
      phone: phoneFor(r.user_id),
      email: emailFor(r.user_id),
      plan: r.premium_plan, amount: null, status: "active",
      payStatus: "Active",
      latestPayment: payments[`${r.user_id}|merchant_premium`] || null,
      started: r.premium_start_date, ends: r.plan_ends_at, ref: "—",
      created_at: r.created_at,
    }));
    (mat.data || []).forEach((r: any) => out.push({
      id: "mat-" + r.user_id, kind: "mat", refId: r.user_id,
      source: "Marriage Bureau",
      user_id: r.user_id,
      who: r.name || nameFor(r.user_id),
      phone: phoneFor(r.user_id),
      email: emailFor(r.user_id),
      plan: r.subscription_plan, amount: null, status: "active",
      payStatus: "Active",
      latestPayment: payments[`${r.user_id}|marriage_bureau`] || null,
      started: r.subscription_start, ends: r.subscription_end, ref: "—",
      created_at: r.created_at,
    }));
    out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRows(out);
  };
  useAutoRefresh(load, 8000);
  const doDelete = async () => {
    if (!confirm) return;
    const res = await adminFetch("delete_subscription", { kind: confirm.kind, id: confirm.refId });
    if (res?.ok) { toast.success("Subscription cancelled"); setConfirm(null); load(); }
    else toast.error(res?.error || "Failed");
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Subscriptions & Plans ({rows.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Source</TableHead><TableHead>Full Name</TableHead><TableHead>Phone</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead>
            <TableHead>Status</TableHead><TableHead>Started</TableHead><TableHead>Expires</TableHead><TableHead>Ref</TableHead><TableHead className="text-right">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetails(r)}>
                <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                <TableCell className="text-xs font-medium">{r.who}</TableCell>
                <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                <TableCell><Badge>{r.plan}</Badge></TableCell>
                <TableCell>{r.amount != null ? inr(r.amount) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.payStatus === "Active" ? "default" : r.payStatus === "Failed" ? "destructive" : "secondary"}>
                    {r.payStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{r.started ? new Date(r.started).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs">{r.ends ? new Date(r.ends).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs">{r.ref || "—"}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setConfirm(r)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No subscriptions</p>}
      </CardContent>
      <Dialog open={!!details} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Subscription Details</DialogTitle></DialogHeader>
          {details && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Source</span><b>{details.source}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><b>{details.who}</b></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{details.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate max-w-[60%]">{details.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge>{details.plan || "—"}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{details.amount != null ? inr(details.amount) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span>
                <Badge variant={details.payStatus === "Active" ? "default" : details.payStatus === "Failed" ? "destructive" : "secondary"}>{details.payStatus}</Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{details.started ? new Date(details.started).toLocaleString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>{details.ends ? new Date(details.ends).toLocaleString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Ref</span><span className="text-xs">{details.ref || details.latestPayment?.razorpay_payment_id || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">User ID</span><span className="text-[10px] font-mono">{details.user_id}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Subscription?</DialogTitle></DialogHeader>
          {confirm && (
            <div className="space-y-3 text-sm">
              <p><b>{confirm.source}</b> — {confirm.who}</p>
              <p className="text-muted-foreground">Razorpay auto-debit बंद हो जाएगा (अगर subscription ID stored है) और status 'cancelled' हो जाएगा।</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
                <Button variant="destructive" onClick={doDelete}><Trash2 className="h-4 w-4 mr-1" />Delete Subscription</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const KycSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [viewing, setViewing] = useState<any | null>(null);
  const [payLinkFor, setPayLinkFor] = useState<any | null>(null);
  const load = async () => {
    const data = await adminFetch("kyc", { filter });
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000, [filter]);

  const decide = async (id: string, status: "verified" | "rejected") => {
    const patch: any = { status };
    if (status === "verified") {
      patch.kyc_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      patch.verified_at = new Date().toISOString();
      patch.re_kyc_requested_at = null;
    }
    await adminFetch("update", { table: "kyc_verifications", id, patch });
    toast.success(`Marked ${status}`); load();
  };

  const resend = async (user_id: string) => {
    await adminFetch("resend_kyc", { user_id });
    toast.success("Re-KYC link sent / पुनः KYC link भेजा गया");
    load();
  };

  const sendPaymentLink = async (user_id: string, mod: string, plan: string) => {
    const res = await adminFetch("resend_payment_link", { user_id, module: mod, plan });
    if (res?.ok) {
      toast.success("Payment link sent / Payment link भेजा गया");
      setPayLinkFor(null);
    } else {
      toast.error(res?.error || "Failed to send link");
    }
  };

  const manualVerify = async (user_id: string) => {
    if (!confirm("Manual Verify? यूजर का KYC + Payment verified mark होगा।")) return;
    const res = await adminFetch("manual_verify", { user_id });
    if (res?.ok) { toast.success("User manually verified"); load(); }
    else toast.error(res?.error || "Failed");
  };

  const removeKyc = async (id: string) => {
    if (!confirm("Delete KYC record? यह action undo नहीं हो सकता।")) return;
    const res = await adminFetch("delete_kyc", { id });
    if (res?.ok) { toast.success("KYC deleted"); load(); }
    else toast.error(res?.error || "Failed");
  };

  const openCertificate = async (k: any) => {
    setViewing(k);
    const data = await adminFetch("kyc_certificate", { id: k.id, user_id: k.user_id });
    if (data?.row) setViewing(data.row);
  };

  const isExpired = (k: any) =>
    k.kyc_expires_at && new Date(k.kyc_expires_at).getTime() < Date.now();

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>KYC Verification ({rows.length})</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Monthly Re-KYC Pending</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((k) => (
          <Card key={k.id} className="border">
            <CardContent className="p-4 space-y-2 text-sm">
              {(() => {
                const missingPhotos = formatKycMissingPhotos(k.missing_photos?.length ? k.missing_photos : getMissingKycPhotos(k));
                return missingPhotos.length > 0 ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                    Missing photos: {missingPhotos.join(", ")} — Resend e-KYC required
                  </div>
                ) : null;
              })()}
              <div className="flex items-center justify-between">
                <p className="font-semibold">{k.full_name}</p>
                <div className="flex gap-1">
                  {isExpired(k) && <Badge variant="destructive">Expired</Badge>}
                  <Badge variant={k.status === "verified" ? "default" : k.status === "rejected" ? "destructive" : "secondary"}>{k.status}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Aadhaar: •••• {k.aadhaar_last4} • {k.mobile}</p>
              <p className="text-xs">{k.address}</p>
              {k.kyc_expires_at && (
                <p className="text-[11px] text-muted-foreground">Expires: {new Date(k.kyc_expires_at).toLocaleString()}</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <KycThumb rawUrl={k.aadhaar_front_url} alt="front" />
                <KycThumb rawUrl={k.aadhaar_back_url} alt="back" />
                <KycThumb rawUrl={k.selfie_url} alt="selfie" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openCertificate(k)}><Eye className="h-4 w-4 mr-1" />View Certificate</Button>
                <Button
                  size="sm"
                  variant={getMissingKycPhotos(k).length ? "destructive" : "outline"}
                  className={getMissingKycPhotos(k).length ? "font-bold shadow-sm" : ""}
                  onClick={() => resend(k.user_id)}
                >
                  <Send className="h-4 w-4 mr-1" />Resend e-KYC
                </Button>
                {k.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => decide(k.id, "verified")}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(k.id, "rejected")}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => setPayLinkFor(k)}>
                  <Send className="h-4 w-4 mr-1" />Resend Payment Link
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => manualVerify(k.user_id)}>
                  <ShieldCheck className="h-4 w-4 mr-1" />Manual Verify (Payment + KYC)
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeKyc(k.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete KYC
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!rows.length && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nothing here</p>}
      </CardContent>
    </Card>
    <KycCertificateDialog data={viewing} onClose={() => setViewing(null)} onResend={(userId) => resend(userId)} />
    <Dialog open={!!payLinkFor} onOpenChange={(o) => !o && setPayLinkFor(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Send Payment Link</DialogTitle></DialogHeader>
        {payLinkFor && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">User: <b className="text-foreground">{payLinkFor.full_name}</b> ({payLinkFor.mobile})</p>
            <p className="text-xs text-muted-foreground">कौन सा प्लान भेजना है? Notification भेजा जाएगा जिसे छूते ही payment page खुलेगा।</p>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "bharat_gaurav", "monthly")}>
                Bharat Gaurav Monthly — ₹10
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "bharat_gaurav", "yearly")}>
                Bharat Gaurav Yearly — ₹100
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "merchant_premium", "monthly")}>
                Merchant Portal Premium Monthly — ₹99
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "merchant_premium", "yearly")}>
                Merchant Portal Premium Yearly — ₹999
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "marriage_bureau", "monthly")}>
                Marriage Bureau Premium Monthly — ₹99
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => sendPaymentLink(payLinkFor.user_id, "marriage_bureau", "yearly")}>
                Marriage Bureau Premium Yearly — ₹999
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

const KycCertificateDialog = ({ data, onClose, onResend }: { data: any | null; onClose: () => void; onResend: (userId: string) => void | Promise<void> }) => {
  if (!data) return null;
  const missingPhotos = formatKycMissingPhotos(data.missing_photos?.length ? data.missing_photos : getMissingKycPhotos(data));
  const aadhaarDigits = String(data.aadhaar_full || "").replace(/\D/g, "");
  const aadhaarFormatted =
    aadhaarDigits.length === 12
      ? `${aadhaarDigits.slice(0, 4)} ${aadhaarDigits.slice(4, 8)} ${aadhaarDigits.slice(8, 12)}`
      : data.aadhaar_last4 ? `XXXX XXXX ${data.aadhaar_last4}` : "—";
  const CertRow = ({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) => (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`font-semibold text-[#1a237e] ${multiline ? "" : "truncate"}`}>{value}</p>
    </div>
  );
  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white">
        <DialogHeader className="sr-only"><DialogTitle>e-KYC Certificate</DialogTitle></DialogHeader>
        <div className="relative overflow-hidden border-4 border-[#FF8C00] bg-white p-6 text-black">
          {missingPhotos.length > 0 && (
            <div className="mb-4 rounded-lg border-2 border-destructive bg-destructive/10 p-3 text-destructive">
              <p className="text-sm font-extrabold">Photos missing: {missingPhotos.join(", ")}</p>
              <p className="mt-1 text-xs">पुराने record में photo URL नहीं मिला। Fresh KYC के लिए Resend e-KYC भेजें।</p>
              <Button size="sm" variant="destructive" className="mt-2" onClick={() => onResend(data.user_id)}>
                <Send className="h-4 w-4 mr-1" />Resend e-KYC
              </Button>
            </div>
          )}
          {/* Verified stamp */}
          <div className="pointer-events-none absolute -right-6 -top-2 rotate-12 z-10">
            <div className="flex items-center gap-1 rounded-lg border-4 border-green-600 bg-green-600/10 px-3 py-1">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span className="text-xl font-extrabold tracking-widest text-green-700">VERIFIED</span>
            </div>
          </div>

          <div className="mb-3 border-b-2 border-[#1a237e] pb-2">
            <h2 className="text-center text-lg font-extrabold text-[#1a237e]">मेरा भारत दुकान — E-KYC प्रमाण-पत्र</h2>
            <p className="text-center text-[10px] uppercase tracking-wider text-gray-500">Identity Verification Certificate</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2 text-sm">
              <CertRow label="Name / नाम" value={data.full_name || "—"} />
              <CertRow
                label={data.relation_type === "husband" ? "Husband Name / पति का नाम" : "Father Name / पिता का नाम"}
                value={data.relation_name || "—"}
              />
              <div className="rounded-md border-2 border-[#1a237e] bg-[#1a237e]/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Aadhaar No. / आधार संख्या</p>
                <p className="text-lg font-extrabold tracking-[0.2em] text-[#1a237e]">{aadhaarFormatted}</p>
              </div>
              <CertRow label="Mobile / मोबाइल" value={data.mobile || "—"} />
              <CertRow label="Address / पता" value={data.address || "—"} multiline />
              <CertRow
                label="GPS"
                value={data.latitude && data.longitude ? `${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}` : "—"}
              />
              <CertRow label="Verified At" value={data.verified_at ? new Date(data.verified_at).toLocaleString("en-IN") : "—"} />
            </div>
            <div className="flex flex-col items-center justify-start gap-1">
              {data.selfie_url ? (
                <KycThumb rawUrl={data.selfie_url} alt="Selfie" className="h-32 w-32 rounded-lg border-2 border-[#1a237e] object-cover" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-400 text-[10px] text-gray-400">No Selfie</div>
              )}
              <p className="text-[10px] text-gray-500">Live Selfie</p>
            </div>
          </div>

          {/* Aadhaar Front/Back previews */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t-2 border-dashed border-gray-300 pt-3">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Aadhaar Front / सामने</p>
              {data.aadhaar_front_url ? (
                <KycThumb rawUrl={data.aadhaar_front_url} alt="Aadhaar Front" className="h-32 w-full rounded-md border-2 border-gray-300 object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-[10px] text-gray-400">No image</div>
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Aadhaar Back / पीछे</p>
              {data.aadhaar_back_url ? (
                <KycThumb rawUrl={data.aadhaar_back_url} alt="Aadhaar Back" className="h-32 w-full rounded-md border-2 border-gray-300 object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-[10px] text-gray-400">No image</div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t pt-2 text-center text-[10px] text-gray-500">
            Certificate ID: {data.id} • Valid Till: {data.kyc_expires_at ? new Date(data.kyc_expires_at).toLocaleDateString("en-IN") : "—"} • Generated by Bharat Dukan Admin
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 rounded-md border p-2">
    <div className="text-primary mt-0.5">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  </div>
);

const ComplaintsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const data = await adminFetch("complaints");
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000);
  const resolve = async (id: string) => {
    await adminFetch("update", { table: "complaints", id, patch: { status: "resolved", is_read: true } });
    toast.success("Resolved"); load();
  };
  return (
    <Card>
      <CardHeader><CardTitle>Complaints & Reports ({rows.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{c.user_name || "Unknown"} • <span className="text-muted-foreground">{c.user_phone || "—"}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={c.status === "resolved" ? "default" : "secondary"}>{c.status}</Badge>
            </div>
            <p className="mt-2 text-sm">{c.complaint_text}</p>
            {c.status !== "resolved" && (
              <div className="mt-2"><Button size="sm" onClick={() => resolve(c.id)}>Mark Resolved</Button></div>
            )}
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No complaints</p>}
      </CardContent>
    </Card>
  );
};

const MessagingSection = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [severity, setSeverity] = useState("info");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) return toast.error("Title and message required");
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("admin_messages").insert({
      sender_id: user.id, title, message, recipient_group: recipient, severity,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Broadcast sent");
    setTitle(""); setMessage("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Messaging Center — Broadcast</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="merchants">Merchants only</SelectItem>
              <SelectItem value="customers">Customers only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Your message..." rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={send} disabled={sending} className="w-full">
          <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Broadcast"}
        </Button>
        <p className="text-xs text-muted-foreground">
          In-app notifications delivered instantly via AdminMessageListener. WhatsApp / Email delivery requires gateway setup.
        </p>
      </CardContent>
    </Card>
    <DirectMessageCard />
    </div>
  );
};

const DirectMessageCard = () => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [target, setTarget] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");
  const [sending, setSending] = useState(false);

  const search = async () => {
    const data = await adminFetch("search_users", { q });
    setResults(data?.rows || []);
  };

  const sendInApp = async () => {
    if (!target) return toast.error("Select user");
    if (!title.trim() || !message.trim()) return toast.error("Title & message required");
    setSending(true);
    const res = await adminFetch("send_direct_message", {
      user_id: target.id, title, message, severity,
    });
    setSending(false);
    if (res?.ok) { toast.success("Direct message sent"); setMessage(""); setTitle(""); }
    else toast.error(res?.error || "Failed");
  };

  const sendWhatsApp = async () => {
    if (!target) return toast.error("Select user");
    if (!message.trim()) return toast.error("Message required");
    const text = encodeURIComponent(await buildPersonalizedText(target, title, message));
    const userPhone = target.phone ? String(target.phone).replace(/\D/g, "") : "";
    // Open via helpline WhatsApp number; if user has a phone, deep-link to user chat,
    // otherwise open helpline chat with the prefilled text so admin can forward.
    const to = userPhone || HELPLINE_WA;
    window.open(`https://wa.me/${to}?text=${text}`, "_blank");
    toast.success(`WhatsApp opened (Helpline ${HELPLINE_WA_DISPLAY})`);
  };

  const sendEmail = async () => {
    if (!target) return toast.error("Select user");
    if (!target.email) return toast.error("User has no email on file");
    if (!message.trim()) return toast.error("Message required");
    const subject = encodeURIComponent(title || "मेरा भारत दुकान — Update");
    const body = encodeURIComponent(await buildPersonalizedText(target, title, message));
    // Gmail compose pre-filled, authuser set to helpline mailbox so admin sends "from" helpline
    const url = `https://mail.google.com/mail/?view=cm&fs=1&authuser=${encodeURIComponent(HELPLINE_EMAIL)}&to=${encodeURIComponent(target.email)}&su=${subject}&body=${body}`;
    window.open(url, "_blank");
    toast.success(`Gmail opened (from ${HELPLINE_EMAIL})`);
  };

  const sendAll = async () => {
    if (!target) return toast.error("Select user");
    if (!title.trim() || !message.trim()) return toast.error("Title & message required");
    setSending(true);
    const res = await adminFetch("send_direct_message", {
      user_id: target.id, title, message, severity,
    });
    setSending(false);
    if (!res?.ok) {
      toast.error(res?.error || "In-App failed");
      return;
    }
    toast.success("In-App sent — WhatsApp + Email खोल रहे हैं");
    const text = encodeURIComponent(await buildPersonalizedText(target, title, message));
    if (target.phone) {
      const phone = String(target.phone).replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    } else {
      window.open(`https://wa.me/${HELPLINE_WA}?text=${text}`, "_blank");
    }
    if (target.email) {
      const subject = encodeURIComponent(title || "मेरा भारत दुकान — Update");
      const url = `https://mail.google.com/mail/?view=cm&fs=1&authuser=${encodeURIComponent(HELPLINE_EMAIL)}&to=${encodeURIComponent(target.email)}&su=${subject}&body=${text}`;
      window.open(url, "_blank");
    }
    setMessage(""); setTitle("");
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Messaging Center — Direct (In-App / WhatsApp / Email)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Search name / phone / email" value={q} onChange={(e) => setQ(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && search()} />
          <Button variant="outline" onClick={search}><Search className="h-4 w-4" /></Button>
        </div>
        {!!results.length && (
          <div className="max-h-48 overflow-y-auto rounded border divide-y">
            {results.map((u) => (
              <button key={u.id} type="button" onClick={() => { setTarget(u); setResults([]); setQ(u.display_name || u.phone || u.email || ""); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted">
                <div className="font-medium">{u.display_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{u.phone || u.email || "—"}</div>
              </button>
            ))}
          </div>
        )}
        {target && (
          <div className="rounded border bg-muted/40 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">{target.display_name || "—"}</div>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setTarget(null)}>Clear</Button>
            </div>
            <div><b>Mobile:</b> {target.phone || <span className="text-muted-foreground">— not on file</span>}</div>
            <div><b>Email:</b> {target.email || <span className="text-muted-foreground">— not on file</span>}</div>
          </div>
        )}
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Message to user..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button onClick={sendInApp} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />1. Send In-App Notification
          </Button>
          <Button onClick={sendWhatsApp} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
            <Send className="h-4 w-4 mr-2" />2. Send via WhatsApp
          </Button>
          <Button onClick={sendEmail} variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50">
            <Send className="h-4 w-4 mr-2" />3. Send via Email
          </Button>
          <Button onClick={sendAll} disabled={sending} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Send className="h-4 w-4 mr-2" />4. Send to All (तीनों)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          WhatsApp हमारे हेल्पलाइन नंबर <b>{HELPLINE_WA_DISPLAY}</b> से और Email <b>{HELPLINE_EMAIL}</b> से auto-prefill होकर खुलेगा। Mobile / Email user के Supabase profile से उठाए जाते हैं।
        </p>
      </CardContent>
    </Card>
  );
};

const AuditSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const load = async () => {
    const data = await adminFetch("audit", { filter });
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000, [filter]);

  const total = rows.filter((r) => r.status === "paid").reduce((a, b) => a + Number(b.amount || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Audit & Payments — {inr(total)} collected</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Module</TableHead><TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Razorpay Order</TableHead><TableHead>Payment ID</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell>{r.module}</TableCell>
                <TableCell>{r.plan}</TableCell>
                <TableCell className="font-semibold">{inr(r.amount)}</TableCell>
                <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs">{r.razorpay_order_id || "—"}</TableCell>
                <TableCell className="text-xs">{r.razorpay_payment_id || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No payments</p>}
      </CardContent>
    </Card>
  );
};

const AnalyticsSection = () => {
  const [data, setData] = useState<any>({});
  const load = async () => {
      const res = await adminFetch("analytics");
      const users = { data: res?.users || [] };
      const payments = { data: res?.payments || [] };
      const merchants = { data: res?.merchants || [] };
      const members = { data: res?.members || [] };
      const days: Record<string, { users: number; revenue: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = { users: 0, revenue: 0 };
      }
      (users.data || []).forEach((u: any) => {
        const k = u.created_at.slice(0, 10); if (days[k]) days[k].users++;
      });
      (payments.data || []).forEach((p: any) => {
        const k = p.created_at.slice(0, 10); if (days[k]) days[k].revenue += Number(p.amount);
      });
      const m = merchants.data || [];
      const mem = members.data || [];
      setData({
        series: Object.entries(days),
        totalRevenue: (payments.data || []).reduce((a, b: any) => a + Number(b.amount), 0),
        newUsers: (users.data || []).length,
        premiumPct: m.length ? Math.round((m.filter((x: any) => x.is_premium).length / m.length) * 100) : 0,
        activeMembers: mem.filter((x: any) => x.status === "active").length,
      });
  };
  useAutoRefresh(load, 15000);

  const series: [string, { users: number; revenue: number }][] = data.series || [];
  const maxRev = Math.max(1, ...series.map(([, v]) => v.revenue));
  const maxUsers = Math.max(1, ...series.map(([, v]) => v.users));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="30-Day Revenue" value={inr(data.totalRevenue)} accent="bg-orange-500/10 text-orange-600" />
        <StatCard label="New Users (30d)" value={data.newUsers ?? 0} accent="bg-blue-500/10 text-blue-600" />
        <StatCard label="Premium Shops %" value={`${data.premiumPct ?? 0}%`} accent="bg-amber-500/10 text-amber-600" />
        <StatCard label="Active Members" value={data.activeMembers ?? 0} accent="bg-emerald-500/10 text-emerald-600" />
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue — last 30 days</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {series.map(([d, v]) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end" title={`${d}: ${inr(v.revenue)}`}>
                <div className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t" style={{ height: `${(v.revenue / maxRev) * 100}%`, minHeight: v.revenue ? 2 : 0 }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>New users — last 30 days</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {series.map(([d, v]) => (
              <div key={d} className="flex-1 flex flex-col items-center justify-end" title={`${d}: ${v.users} users`}>
                <div className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t" style={{ height: `${(v.users / maxUsers) * 100}%`, minHeight: v.users ? 2 : 0 }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsSection = () => {
  const [s, setS] = useState<any>(null);
  const load = async () => {
    const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
    setS(data);
  };
  useEffect(() => { load(); }, []);

  const update = async (patch: any) => {
    if (!s) return;
    await supabase.from("site_settings").update(patch).eq("id", s.id);
    toast.success("Saved"); load();
  };

  if (!s) return <p className="text-sm text-muted-foreground">Loading settings...</p>;

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Maintenance Mode</p>
            <p className="text-xs text-muted-foreground">Shows "Coming Soon" to non-admins</p>
          </div>
          <Button variant={s.maintenance_mode ? "destructive" : "outline"} onClick={() => update({ maintenance_mode: !s.maintenance_mode })}>
            {s.maintenance_mode ? "Disable" : "Enable"}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Merchant Registrations</p>
            <p className="text-xs text-muted-foreground">Allow new merchant signups</p>
          </div>
          <Button variant={s.merchant_registrations_enabled ? "outline" : "destructive"} onClick={() => update({ merchant_registrations_enabled: !s.merchant_registrations_enabled })}>
            {s.merchant_registrations_enabled ? "Disable" : "Enable"}
          </Button>
        </div>
        <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
          <p>Admin PIN: configured</p>
          <p>Razorpay: {s.razorpay_key_reference || "default"}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DeleteRequestsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [reject, setReject] = useState<any>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    const data = await adminFetch("delete_requests", { filter });
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000, [filter]);

  const approve = async (id: string) => {
    if (!window.confirm("Approve & permanently delete this account? Cannot be undone.")) return;
    const res = await adminFetch("approve_delete_request", { id });
    if (res?.ok) { toast.success("Account deleted"); load(); }
    else toast.error(res?.error || "Failed");
  };

  const doReject = async () => {
    if (!reject) return;
    const res = await adminFetch("reject_delete_request", { id: reject.id, notes });
    if (res?.ok) { toast.success("Request rejected"); setReject(null); setNotes(""); load(); }
    else toast.error(res?.error || "Failed");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Delete Account Requests ({rows.length})</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{r.user_name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {r.user_email || "—"} • {r.user_phone || "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "destructive" : "default"}>
                {r.status}
              </Badge>
            </div>
            <div className="text-sm">
              <p><b>Reason:</b> {r.reason || "—"}</p>
              {r.message && <p className="mt-1 whitespace-pre-wrap"><b>Message:</b> {r.message}</p>}
              {r.reviewer_notes && <p className="mt-1 text-xs text-muted-foreground"><b>Admin notes:</b> {r.reviewer_notes}</p>}
            </div>
            {r.status === "pending" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="destructive" onClick={() => approve(r.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />Approve Delete
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setReject(r); setNotes(""); }}>
                  <XCircle className="h-4 w-4 mr-1" />Reject Request
                </Button>
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No requests</p>}
      </CardContent>

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject delete request</DialogTitle></DialogHeader>
          <Textarea placeholder="Optional note for record" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={doReject}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminDashboard;
