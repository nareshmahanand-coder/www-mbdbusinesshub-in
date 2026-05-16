import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Store, Heart, CreditCard, ShieldCheck,
  MessageSquareWarning, Send, Receipt, BarChart3, Settings as SettingsIcon,
  LogOut, Search, CheckCircle2, XCircle, Eye, RefreshCw, Moon, Sun,
  MapPin, Phone, Calendar, FileCheck2, Mail, Ban, ShieldOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, SUPERUSER_FLAG } from "@/contexts/AuthContext";
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
  | "kyc" | "complaints" | "messaging" | "audit" | "analytics" | "settings";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "All Users", icon: Users },
  { id: "merchants", label: "Merchants / Shops", icon: Store },
  { id: "matrimony", label: "Matrimony Profiles", icon: Heart },
  { id: "subscriptions", label: "Subscriptions & Plans", icon: CreditCard },
  { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
  { id: "complaints", label: "Complaints & Reports", icon: MessageSquareWarning },
  { id: "messaging", label: "Messaging Center", icon: Send },
  { id: "audit", label: "Audit & Payments", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const inr = (n: number | null | undefined) =>
  "₹" + (Number(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// PIN must match the value in src/components/AdminPinAccess.tsx and
// supabase/functions/admin-data/index.ts. Used to authorise the service-role
// edge function that bypasses RLS for the admin dashboard.
const ADMIN_PIN = "02032026";

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
          {section === "subscriptions" && <SubscriptionsSection />}
          {section === "kyc" && <KycSection />}
          {section === "complaints" && <ComplaintsSection />}
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
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setView(u)}><Eye className="h-3.5 w-3.5" /></Button>
                    {u.blocked ? (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => doUnblock(u)}>
                        <ShieldOff className="h-3.5 w-3.5 mr-1" />Unblock
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setBlockTarget(u)}>
                        <Ban className="h-3.5 w-3.5 mr-1" />Block
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No users</p>}
      </CardContent>

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
  const load = async () => {
    const data = await adminFetch("subscriptions");
    const bg = { data: data?.bg || [] };
    const mp = { data: data?.mp || [] };
    const mat = { data: data?.mat || [] };
    const out: any[] = [];
    (bg.data || []).forEach((r: any) => out.push({
      id: "bg-" + r.id, source: "Bharat Gaurav", who: r.user_id?.slice(0, 8) + "...",
      plan: r.plan, amount: r.amount, status: r.status,
      started: r.started_at, ends: r.expires_at, ref: r.razorpay_payment_id,
      created_at: r.created_at,
    }));
    (mp.data || []).forEach((r: any) => out.push({
      id: "mp-" + r.user_id, source: "Merchant Premium", who: r.shop_name || r.user_id?.slice(0, 8) + "...",
      plan: r.premium_plan, amount: null, status: "active",
      started: r.premium_start_date, ends: r.plan_ends_at, ref: "—",
      created_at: r.created_at,
    }));
    (mat.data || []).forEach((r: any) => out.push({
      id: "mat-" + r.user_id, source: "Marriage Bureau", who: r.name || r.user_id?.slice(0, 8) + "...",
      plan: r.subscription_plan, amount: null, status: "active",
      started: r.subscription_start, ends: r.subscription_end, ref: "—",
      created_at: r.created_at,
    }));
    out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRows(out);
  };
  useAutoRefresh(load, 8000);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Subscriptions & Plans ({rows.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Source</TableHead><TableHead>User / Shop</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead>
            <TableHead>Status</TableHead><TableHead>Started</TableHead><TableHead>Expires</TableHead><TableHead>Ref</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                <TableCell className="text-xs">{r.who}</TableCell>
                <TableCell><Badge>{r.plan}</Badge></TableCell>
                <TableCell>{r.amount != null ? inr(r.amount) : "—"}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell className="text-xs">{r.started ? new Date(r.started).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs">{r.ends ? new Date(r.ends).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-xs">{r.ref || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && <p className="py-8 text-center text-sm text-muted-foreground">No subscriptions</p>}
      </CardContent>
    </Card>
  );
};

const KycSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [viewing, setViewing] = useState<any | null>(null);
  const load = async () => {
    const data = await adminFetch("kyc", { filter });
    setRows(data?.rows || []);
  };
  useAutoRefresh(load, 8000, [filter]);

  const decide = async (id: string, status: "verified" | "rejected") => {
    const patch: any = { status };
    if (status === "verified") {
      patch.kyc_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
                {k.aadhaar_front_url && <a href={k.aadhaar_front_url} target="_blank" rel="noreferrer"><img src={k.aadhaar_front_url} className="h-20 w-full object-cover rounded border" alt="front" /></a>}
                {k.aadhaar_back_url && <a href={k.aadhaar_back_url} target="_blank" rel="noreferrer"><img src={k.aadhaar_back_url} className="h-20 w-full object-cover rounded border" alt="back" /></a>}
                {k.selfie_url && <a href={k.selfie_url} target="_blank" rel="noreferrer"><img src={k.selfie_url} className="h-20 w-full object-cover rounded border" alt="selfie" /></a>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setViewing(k)}><Eye className="h-4 w-4 mr-1" />View Certificate</Button>
                <Button size="sm" variant="outline" onClick={() => resend(k.user_id)}><Send className="h-4 w-4 mr-1" />Resend e-KYC</Button>
                {k.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => decide(k.id, "verified")}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(k.id, "rejected")}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!rows.length && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nothing here</p>}
      </CardContent>
    </Card>
    <KycCertificateDialog data={viewing} onClose={() => setViewing(null)} />
    </>
  );
};

const KycCertificateDialog = ({ data, onClose }: { data: any | null; onClose: () => void }) => {
  if (!data) return null;
  const verified = data.status === "verified";
  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only"><DialogTitle>e-KYC Certificate</DialogTitle></DialogHeader>
        <div className="bg-gradient-to-b from-[#0a1547] via-[#1a237e] to-[#0a1547] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">मेरा भारत दुकान</p>
              <h2 className="text-2xl font-extrabold">E-KYC प्रमाण-पत्र</h2>
              <p className="text-[11px] opacity-70 mt-0.5">Official Electronic KYC Certificate</p>
            </div>
            {verified && (
              <div className="rounded-full border-4 border-green-400 px-3 py-2 text-center rotate-[-8deg]">
                <FileCheck2 className="h-6 w-6 mx-auto text-green-400" />
                <p className="text-[10px] font-extrabold text-green-300">VERIFIED</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-start">
            {data.selfie_url ? (
              <img src={data.selfie_url} alt="user" className="h-28 w-28 rounded-lg object-cover border-2 border-primary" />
            ) : (
              <div className="h-28 w-28 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">No Photo</div>
            )}
            <div className="flex-1 space-y-1">
              <p className="text-xl font-bold">{data.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{data.relation_type === "husband" ? "W/o" : "S/D o"}: {data.relation_name || "—"}</p>
              <Badge variant={verified ? "default" : "secondary"}>{data.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Aadhaar" value={data.aadhaar_full ? String(data.aadhaar_full).replace(/(\d{4})(?=\d)/g, "$1 ") : (data.aadhaar_last4 ? `•••• •••• ${data.aadhaar_last4}` : "—")} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile" value={data.mobile || "—"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="GPS" value={data.latitude && data.longitude ? `${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}` : "—"} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Verified At" value={data.verified_at ? new Date(data.verified_at).toLocaleString() : "—"} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Valid Till" value={data.kyc_expires_at ? new Date(data.kyc_expires_at).toLocaleString() : "—"} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Re-KYC Requested" value={data.re_kyc_requested_at ? new Date(data.re_kyc_requested_at).toLocaleString() : "—"} />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Full Address</p>
            <p className="text-sm">{data.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Aadhaar Documents</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Front</p>
                {data.aadhaar_front_url
                  ? <a href={data.aadhaar_front_url} target="_blank" rel="noreferrer"><img src={data.aadhaar_front_url} className="w-full h-40 object-cover rounded border" alt="aadhaar front" /></a>
                  : <div className="h-40 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">Not uploaded</div>}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Back</p>
                {data.aadhaar_back_url
                  ? <a href={data.aadhaar_back_url} target="_blank" rel="noreferrer"><img src={data.aadhaar_back_url} className="w-full h-40 object-cover rounded border" alt="aadhaar back" /></a>
                  : <div className="h-40 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">Not uploaded</div>}
              </div>
            </div>
          </div>
          <div className="border-t pt-3 text-center text-[11px] text-muted-foreground">
            Certificate ID: {data.id} • Generated by Bharat Dukan Admin
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

export default AdminDashboard;
