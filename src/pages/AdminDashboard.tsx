import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Store, Heart, CreditCard, ShieldCheck,
  MessageSquareWarning, Send, Receipt, BarChart3, Settings as SettingsIcon,
  LogOut, Search, CheckCircle2, XCircle, Eye, RefreshCw, Moon, Sun,
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
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [users, premiumMembers, merchants, premiumMerchants, payToday, payMonth, kyc, complaints] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bharat_gaurav_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("merchant_profiles").select("id", { count: "exact", head: true }),
      supabase.from("merchant_profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      supabase.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startDay),
      supabase.from("payment_orders").select("amount").eq("status", "paid").gte("updated_at", startMonth),
      supabase.from("kyc_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const sum = (r: any) => (r.data || []).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);

    setStats({
      users: users.count || 0,
      premium: premiumMembers.count || 0,
      merchants: merchants.count || 0,
      premiumMerchants: premiumMerchants.count || 0,
      freeMerchants: (merchants.count || 0) - (premiumMerchants.count || 0),
      todayEarn: sum(payToday),
      monthEarn: sum(payMonth),
      kyc: kyc.count || 0,
      complaints: complaints.count || 0,
    });
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

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data || []);
  };
  useAutoRefresh(load, 8000);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((r) =>
      !s || (r.display_name || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) || (r.phone || "").includes(s)
    );
  }, [rows, q]);

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
            <TableHead>City</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                <TableCell>{u.phone || "—"}</TableCell>
                <TableCell className="text-xs">{u.email || "—"}</TableCell>
                <TableCell>{u.city || "—"}</TableCell>
                <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => setView(u)}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
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
              <p><b>Joined:</b> {new Date(view.created_at).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ID: {view.id}</p>
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
    const { data } = await supabase.from("merchant_profiles").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useAutoRefresh(load, 8000);

  const togglePremium = async (m: any) => {
    await supabase.from("merchant_profiles").update({ is_premium: !m.is_premium }).eq("id", m.id);
    toast.success("Updated"); load();
  };
  const toggleVerified = async (m: any) => {
    await supabase.from("merchant_profiles").update({ is_verified: !m.is_verified }).eq("id", m.id);
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
    const { data } = await supabase.from("matrimony_profiles").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useAutoRefresh(load, 8000);

  const setStatus = async (id: string, moderation_status: string) => {
    await supabase.from("matrimony_profiles").update({ moderation_status, is_published: moderation_status === "approved" }).eq("id", id);
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
    const [bg, mp, mat] = await Promise.all([
      supabase.from("bharat_gaurav_memberships").select("*").order("created_at", { ascending: false }),
      supabase.from("merchant_profiles").select("user_id,shop_name,premium_plan,premium_start_date,plan_ends_at,is_premium,created_at").eq("is_premium", true).order("created_at", { ascending: false }),
      supabase.from("matrimony_profiles").select("user_id,name,subscription_plan,subscription_start,subscription_end,created_at").not("subscription_plan", "is", null).order("created_at", { ascending: false }),
    ]);
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
  const load = async () => {
    let q = supabase.from("kyc_verifications").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows(data || []);
  };
  useEffect(() => { load(); }, [filter]);

  const decide = async (id: string, status: "verified" | "rejected") => {
    await supabase.from("kyc_verifications").update({ status }).eq("id", id);
    toast.success(`Marked ${status}`); load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>KYC Verification ({rows.length})</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                <Badge variant={k.status === "verified" ? "default" : k.status === "rejected" ? "destructive" : "secondary"}>{k.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Aadhaar: •••• {k.aadhaar_last4} • {k.mobile}</p>
              <p className="text-xs">{k.address}</p>
              <div className="grid grid-cols-3 gap-2">
                {k.aadhaar_front_url && <a href={k.aadhaar_front_url} target="_blank" rel="noreferrer"><img src={k.aadhaar_front_url} className="h-20 w-full object-cover rounded border" alt="front" /></a>}
                {k.aadhaar_back_url && <a href={k.aadhaar_back_url} target="_blank" rel="noreferrer"><img src={k.aadhaar_back_url} className="h-20 w-full object-cover rounded border" alt="back" /></a>}
                {k.selfie_url && <a href={k.selfie_url} target="_blank" rel="noreferrer"><img src={k.selfie_url} className="h-20 w-full object-cover rounded border" alt="selfie" /></a>}
              </div>
              {k.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => decide(k.id, "verified")}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => decide(k.id, "rejected")}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!rows.length && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nothing here</p>}
      </CardContent>
    </Card>
  );
};

const ComplaintsSection = () => {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  const resolve = async (id: string) => {
    await supabase.from("complaints").update({ status: "resolved", is_read: true }).eq("id", id);
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
  useEffect(() => {
    (async () => {
      let q = supabase.from("payment_orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      setRows(data || []);
    })();
  }, [filter]);

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
  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [users, payments, merchants, members] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("payment_orders").select("amount,created_at,status").eq("status", "paid").gte("created_at", since.toISOString()),
        supabase.from("merchant_profiles").select("is_premium"),
        supabase.from("bharat_gaurav_memberships").select("plan,status,amount"),
      ]);
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
    })();
  }, []);

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
