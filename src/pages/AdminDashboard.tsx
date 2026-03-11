import { useState, useMemo } from "react";
import { sampleShops, Shop, categoryIcons } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, ShieldX, Bell, CheckCircle2, IndianRupee, Users, Clock,
  BadgeCheck, MessageCircle, Send, XCircle, AlertTriangle, Crown,
  Download, CalendarPlus, LogOut, Search
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";

interface MerchantPayment {
  shopId: string;
  shopName: string;
  plan: "monthly" | "yearly";
  amount: number;
  transactionId: string;
  date: string;
  approved: boolean;
  rejected?: boolean;
  rejectReason?: string;
  screenshotUrl?: string;
}

interface ChatbotLog {
  question: string;
  count: number;
  lastAsked: string;
}

const MOCK_CHATBOT_LOGS: ChatbotLog[] = [
  { question: "दुकान कैसे जोड़ें?", count: 142, lastAsked: "2026-03-10" },
  { question: "प्रीमियम प्लान के क्या फायदे हैं?", count: 98, lastAsked: "2026-03-10" },
  { question: "पेमेंट सुरक्षित है या नहीं?", count: 87, lastAsked: "2026-03-09" },
  { question: "क्या ग्राहक से कमीशन लिया जाता है?", count: 73, lastAsked: "2026-03-10" },
  { question: "मदद चाहिए?", count: 56, lastAsked: "2026-03-09" },
  { question: "क्या यह ऐप पैसे लेता है?", count: 121, lastAsked: "2026-03-10" },
];

const getDaysActive = (dateStr: string) => {
  const start = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const AdminDashboard = () => {
  const [shops, setShops] = useState<(Shop & { premiumStartDate?: string; premiumPlan?: "monthly" | "yearly"; joinDate?: string })[]>(
    sampleShops.map((s, i) => ({
      ...s,
      premium: i < 3,
      premiumStartDate: i < 3 ? "2026-02-15" : undefined,
      premiumPlan: i < 3 ? (i === 0 ? "monthly" as const : "yearly" as const) : undefined,
      joinDate: `2026-0${Math.min(i + 1, 3)}-${String(10 + i).padStart(2, "0")}`,
    }))
  );
  const [loggedIn, setLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const [payments, setPayments] = useState<MerchantPayment[]>([
    { shopId: "1", shopName: "Sharma General Store", plan: "monthly", amount: 99, transactionId: "TXN001234", date: "2026-03-08", approved: false, screenshotUrl: "screenshot1.png" },
    { shopId: "3", shopName: "Patel Electronics", plan: "yearly", amount: 999, transactionId: "TXN009876", date: "2026-03-09", approved: false, screenshotUrl: "screenshot2.png" },
    { shopId: "6", shopName: "Bhojanshala Restaurant", plan: "yearly", amount: 999, transactionId: "TXN005678", date: "2026-03-07", approved: true },
    { shopId: "2", shopName: "Gupta Cloth House", plan: "monthly", amount: 99, transactionId: "TXN004321", date: "2026-03-06", approved: true },
  ]);

  const handleLogin = () => {
    if (pin === "1947") {
      setLoggedIn(true);
      toast.success("Admin access granted");
    } else {
      toast.error("Invalid PIN");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setPin("");
    toast.info("Logged out successfully");
  };

  const toggleVerification = (id: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s))
    );
    const shop = shops.find((s) => s.id === id);
    toast.success(shop && !shop.verified ? "✅ Business Verified! Blue Tick & Golden Border activated." : "Verification revoked.");
  };

  const approvePayment = (txnId: string) => {
    const payment = payments.find(p => p.transactionId === txnId);
    if (payment) {
      setPayments((prev) =>
        prev.map((p) => (p.transactionId === txnId ? { ...p, approved: true, rejected: false } : p))
      );
      setShops((prev) =>
        prev.map((s) =>
          s.id === payment.shopId
            ? { ...s, verified: true, premium: true, premiumStartDate: new Date().toISOString().split("T")[0], premiumPlan: payment.plan }
            : s
        )
      );
    }
    toast.success("✅ Payment approved. Premium + Verified badge activated.");
  };

  const rejectPayment = (txnId: string) => {
    const reason = rejectReasonMap[txnId]?.trim();
    if (!reason) {
      toast.error("कृपया अस्वीकृति का कारण दें (Please provide a rejection reason)");
      setShowRejectInput(txnId);
      return;
    }
    setPayments((prev) =>
      prev.map((p) => (p.transactionId === txnId ? { ...p, rejected: true, approved: false, rejectReason: reason } : p))
    );
    setShowRejectInput(null);
    toast.error(`❌ Payment rejected: ${reason}`);
  };

  const sendPremiumOffer = (shopName: string) => {
    toast.success(`📩 Premium offer sent to ${shopName}!`);
  };

  const removeShop = (id: string) => {
    setShops((prev) => prev.filter((s) => s.id !== id));
    toast.success("Shop removed from listings");
  };

  const extendPremium = (id: string) => {
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const currentStart = s.premiumStartDate ? new Date(s.premiumStartDate) : new Date();
        const plan = s.premiumPlan || "monthly";
        const duration = plan === "monthly" ? 30 : 365;
        const currentExpiry = new Date(currentStart.getTime() + duration * 24 * 60 * 60 * 1000);
        const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
        // Shift start date so that expiry extends by 30 days
        const newStart = new Date(newExpiry.getTime() - (duration - 30) * 24 * 60 * 60 * 1000);
        return { ...s, premiumStartDate: plan === "monthly" ? new Date(newExpiry.getTime() - 30 * 24 * 60 * 60 * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : newStart.toISOString().split("T")[0] };
      })
    );
    toast.success("✅ Premium extended by 30 days!");
  };

  const downloadCSV = () => {
    const headers = ["Shop Name", "Hindi Name", "Category", "City", "Pincode", "Verified", "Premium", "Plan", "Join Date"];
    const rows = shops.map(s => [
      s.name, s.nameHindi, s.category, s.city, s.pincode,
      s.verified ? "Yes" : "No", s.premium ? "Yes" : "No",
      s.premiumPlan || "Free", s.joinDate || "N/A"
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bharat-dukaan-merchants-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("📥 Merchant list downloaded as CSV!");
  };

  // Derived data
  const freeShops = useMemo(() => {
    const list = shops.filter((s) => !s.premium);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || s.nameHindi.includes(q) || s.category.toLowerCase().includes(q));
  }, [shops, searchQuery]);

  const premiumShops = useMemo(() => {
    const list = shops.filter((s) => s.premium);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(q) || s.nameHindi.includes(q));
  }, [shops, searchQuery]);

  const verifiedCount = shops.filter((s) => s.verified).length;
  const pendingPayments = payments.filter((p) => !p.approved && !p.rejected);

  const monthlyEarnings = payments.filter((p) => p.approved && p.plan === "monthly").reduce((sum, p) => sum + p.amount, 0);
  const yearlyEarnings = payments.filter((p) => p.approved && p.plan === "yearly").reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = monthlyEarnings + yearlyEarnings;

  const getPremiumDaysLeft = (shop: any) => {
    if (!shop.premiumStartDate || !shop.premiumPlan) return null;
    const start = new Date(shop.premiumStartDate);
    const duration = shop.premiumPlan === "monthly" ? 30 : 365;
    const expiry = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ─── Login Screen ───
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-1.5 w-full bg-navy" />
        <div className="flex min-h-[calc(100vh-6px)] items-center justify-center px-4">
          <Card className="w-full max-w-sm border-2 border-border shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-navy">
                <ShieldCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Bharat Dukaan</CardTitle>
              <p className="text-xs text-muted-foreground">Management Portal - Secure Access</p>
              <p className="font-hindi text-sm text-muted-foreground">प्रबंधन पोर्टल - सुरक्षित प्रवेश</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Demo PIN: <span className="font-mono font-bold">1947</span></p>
              </div>
              <Input
                type="password"
                placeholder="Enter Admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="text-center text-lg tracking-[0.5em]"
                maxLength={4}
              />
              <Button onClick={handleLogin} className="w-full bg-navy hover:bg-navy/90 text-primary-foreground">
                <ShieldCheck className="mr-2 h-4 w-4" /> Secure Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  return (
    <div className="min-h-screen bg-background">
      {/* Navy Header Bar */}
      <div className="sticky top-0 z-30 bg-navy px-4 py-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Bharat Dukaan - Management Portal</h1>
            <p className="font-hindi text-xs text-primary-foreground/70">भारत दुकान - प्रबंधन पोर्टल</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-primary-foreground" />
              {pendingPayments.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingPayments.length}
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-5">
          <Card className="bg-navy text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-7 w-7 opacity-80" />
              <div>
                <p className="text-2xl font-extrabold">{shops.length}</p>
                <p className="text-[10px] opacity-70">Total / कुल दुकानें</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-india text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <BadgeCheck className="h-7 w-7 opacity-80" />
              <div>
                <p className="text-2xl font-extrabold">{verifiedCount}</p>
                <p className="text-[10px] opacity-70">Verified / सत्यापित</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-saffron text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Crown className="h-7 w-7 opacity-80" />
              <div>
                <p className="text-2xl font-extrabold">{premiumShops.length}</p>
                <p className="text-[10px] opacity-70">Premium / प्रीमियम</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-navy">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-7 w-7 text-muted-foreground" />
              <div>
                <p className="text-2xl font-extrabold text-foreground">{freeShops.length}</p>
                <p className="text-[10px] text-muted-foreground">Free / मुफ्त</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1 border-2 border-green-india">
            <CardContent className="flex items-center gap-3 p-4">
              <IndianRupee className="h-7 w-7 text-green-india" />
              <div>
                <p className="text-2xl font-extrabold text-green-india">₹{totalEarnings.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">
                  ₹99: ₹{monthlyEarnings} | ₹999: ₹{yearlyEarnings}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Export Bar */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shops... (दुकान खोजें)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={downloadCSV} variant="outline" size="sm" className="border-navy text-navy hover:bg-navy hover:text-primary-foreground">
            <Download className="mr-1 h-4 w-4" /> Download Merchant List (CSV)
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="free" className="mb-8">
          <TabsList className="w-full max-w-lg">
            <TabsTrigger value="free" className="flex-1 text-xs sm:text-sm">🆓 Free Listings (मुफ्त वाले)</TabsTrigger>
            <TabsTrigger value="premium" className="flex-1 text-xs sm:text-sm">⭐ Premium Approvals (प्रीमियम अनुरोध)</TabsTrigger>
          </TabsList>

          {/* ─── Free Users Tab ─── */}
          <TabsContent value="free">
            <Card>
              <CardHeader className="bg-navy/5 border-b">
                <CardTitle className="text-base">
                  Free Listings <span className="font-hindi text-sm font-normal text-muted-foreground">• मुफ्त उपयोगकर्ता</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-navy text-primary-foreground text-left">
                      <th className="px-3 py-3 text-xs font-semibold">Shop / दुकान</th>
                      <th className="px-3 py-3 text-xs font-semibold">Category</th>
                      <th className="hidden sm:table-cell px-3 py-3 text-xs font-semibold">City</th>
                      <th className="px-3 py-3 text-xs font-semibold">Joined</th>
                      <th className="px-3 py-3 text-xs font-semibold">Status</th>
                      <th className="px-3 py-3 text-xs font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freeShops.map((shop) => (
                      <tr key={shop.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <p className="font-medium text-foreground text-sm">{shop.name}</p>
                          <p className="font-hindi text-xs text-muted-foreground">{shop.nameHindi}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {categoryIcons[shop.category] || "🏪"} {shop.category}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-3 text-xs text-muted-foreground">{shop.city}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground">{shop.joinDate || "N/A"}</span>
                          <br />
                          <span className="text-[10px] text-muted-foreground/60">{getDaysActive(shop.joinDate || "2026-01-15")}d active</span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={shop.verified ? "default" : "secondary"} className={shop.verified ? "bg-green-india text-primary-foreground text-[10px]" : "text-[10px]"}>
                            {shop.verified ? "✅ Verified" : "⏳ Basic"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => sendPremiumOffer(shop.name)} className="text-[10px] h-7 px-2">
                              <Send className="mr-1 h-3 w-3" /> Premium Offer
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={shop.verified ? "outline" : "default"}
                                onClick={() => toggleVerification(shop.id)}
                                className={`h-7 px-2 text-[10px] ${!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}`}
                              >
                                <BadgeCheck className="mr-1 h-3 w-3" />
                                {shop.verified ? "Revoke" : "Verify"}
                              </Button>
                              <button onClick={() => removeShop(shop.id)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Remove">
                                <ShieldX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {freeShops.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No free users found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Premium Approvals Tab ─── */}
          <TabsContent value="premium">
            {/* Pending Payment Requests */}
            <Card className="mb-6">
              <CardHeader className="bg-saffron/10 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-saffron" /> Payment Screenshots & Requests
                  <span className="font-hindi text-sm font-normal text-muted-foreground">• भुगतान स्क्रीनशॉट</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((p) => (
                    <div key={p.transactionId} className="rounded-lg border border-saffron/30 bg-saffron/5 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{p.shopName}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.plan === "monthly" ? "मासिक प्लान ₹99" : "सालाना प्लान ₹999"} • TXN: <span className="font-mono">{p.transactionId}</span> • {p.date}
                          </p>
                          {p.screenshotUrl && (
                            <p className="mt-1 text-xs text-navy">📎 Screenshot uploaded: {p.screenshotUrl}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approvePayment(p.transactionId)} className="bg-green-india hover:bg-green-india/90 text-primary-foreground h-8">
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Verify & Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectPayment(p.transactionId)} className="h-8">
                              <XCircle className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                          {showRejectInput === p.transactionId && (
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Rejection reason / अस्वीकृति का कारण..."
                                value={rejectReasonMap[p.transactionId] || ""}
                                onChange={(e) => setRejectReasonMap(prev => ({ ...prev, [p.transactionId]: e.target.value }))}
                                className="min-h-[40px] text-xs"
                              />
                              <Button size="sm" variant="destructive" onClick={() => rejectPayment(p.transactionId)} className="h-auto shrink-0">
                                Confirm
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">✅ No pending payment requests.</p>
                )}

                {/* Rejected list */}
                {payments.filter(p => p.rejected).length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs font-semibold text-destructive">Recently Rejected:</p>
                    {payments.filter(p => p.rejected).map(p => (
                      <div key={p.transactionId} className="mb-1 rounded bg-destructive/5 px-3 py-2 text-xs">
                        <span className="font-medium">{p.shopName}</span> — {p.rejectReason || "No reason provided"} <span className="text-muted-foreground">({p.transactionId})</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Premium Shops */}
            <Card>
              <CardHeader className="bg-navy/5 border-b">
                <CardTitle className="text-base">
                  Active Premium Shops <span className="font-hindi text-sm font-normal text-muted-foreground">• सक्रिय प्रीमियम दुकानें</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-navy text-primary-foreground text-left">
                      <th className="px-3 py-3 text-xs font-semibold">Shop / दुकान</th>
                      <th className="px-3 py-3 text-xs font-semibold">Plan</th>
                      <th className="px-3 py-3 text-xs font-semibold">Days Left</th>
                      <th className="px-3 py-3 text-xs font-semibold">Status</th>
                      <th className="px-3 py-3 text-xs font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumShops.map((shop: any) => {
                      const daysLeft = getPremiumDaysLeft(shop);
                      const isExpiring = daysLeft !== null && daysLeft <= 3;
                      return (
                        <tr key={shop.id} className={`border-b last:border-0 hover:bg-muted/30 ${isExpiring ? "bg-destructive/10" : ""}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {shop.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-navy" />}
                              <div>
                                <p className="font-medium text-foreground text-sm">{shop.name}</p>
                                <p className="font-hindi text-xs text-muted-foreground">{shop.nameHindi}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <Badge className="bg-saffron text-primary-foreground text-[10px]">
                              {shop.premiumPlan === "monthly" ? "₹99/mo" : "₹999/yr"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            {daysLeft !== null ? (
                              <span className={`text-sm font-bold ${isExpiring ? "text-destructive" : "text-foreground"}`}>
                                {isExpiring && <AlertTriangle className="mr-1 inline h-4 w-4 text-destructive" />}
                                {daysLeft}d
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isExpiring ? (
                              <Badge variant="destructive" className="text-[10px]">⚠ Expiring</Badge>
                            ) : (
                              <Badge className="bg-green-india text-primary-foreground text-[10px]">✅ Active</Badge>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => extendPremium(shop.id)}
                                className="h-7 px-2 text-[10px] border-green-india text-green-india hover:bg-green-india hover:text-primary-foreground"
                              >
                                <CalendarPlus className="mr-1 h-3 w-3" /> +30 Days
                              </Button>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={shop.verified ? "outline" : "default"}
                                  onClick={() => toggleVerification(shop.id)}
                                  className={`h-7 px-2 text-[10px] ${!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}`}
                                >
                                  <BadgeCheck className="mr-1 h-3 w-3" />
                                  {shop.verified ? "Revoke" : "Verify"}
                                </Button>
                                <button onClick={() => removeShop(shop.id)} className="rounded p-1 text-destructive hover:bg-destructive/10">
                                  <ShieldX className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {premiumShops.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No premium shops yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chatbot Analytics */}
        <Card className="mb-8">
          <CardHeader className="bg-navy/5 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-saffron" /> Bharat Mitra - FAQ Analytics
              <span className="font-hindi text-sm font-normal text-muted-foreground">• चैटबॉट रिपोर्ट</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-navy text-primary-foreground text-left">
                  <th className="px-3 py-3 text-xs font-semibold">#</th>
                  <th className="px-3 py-3 text-xs font-semibold">Question / सवाल</th>
                  <th className="px-3 py-3 text-xs font-semibold">Asked</th>
                  <th className="px-3 py-3 text-xs font-semibold">Last</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CHATBOT_LOGS
                  .sort((a, b) => b.count - a.count)
                  .map((log, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-3 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-3 font-hindi font-medium text-foreground">{log.question}</td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary" className="font-bold">{log.count}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{log.lastAsked}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t pt-4 text-center">
          <p className="text-xs text-muted-foreground">Bharat Dukaan - Management Portal • Internal Use Only</p>
          <p className="font-hindi text-xs text-muted-foreground">भारत दुकान - प्रबंधन पोर्टल • केवल आंतरिक उपयोग हेतु</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
