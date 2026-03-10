import { useState, useMemo } from "react";
import { sampleShops, Shop, categoryIcons } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, ShieldX, Bell, CheckCircle2, IndianRupee, Users, Clock,
  BadgeCheck, MessageCircle, Send, XCircle, AlertTriangle, Crown
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
  const [shops, setShops] = useState<Shop[]>(
    sampleShops.map((s, i) => ({
      ...s,
      premium: i < 3,
      premiumStartDate: i < 3 ? "2026-02-15" : undefined,
      premiumPlan: i < 3 ? (i === 0 ? "monthly" as const : "yearly" as const) : undefined,
    })) as (Shop & { premiumStartDate?: string; premiumPlan?: "monthly" | "yearly" })[]
  );
  const [loggedIn, setLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  const [payments, setPayments] = useState<MerchantPayment[]>([
    { shopId: "1", shopName: "Sharma General Store", plan: "monthly", amount: 99, transactionId: "TXN001234", date: "2026-03-08", approved: false, screenshotUrl: "screenshot1.png" },
    { shopId: "3", shopName: "Royal Electronics", plan: "yearly", amount: 999, transactionId: "TXN009876", date: "2026-03-09", approved: false, screenshotUrl: "screenshot2.png" },
    { shopId: "6", shopName: "Bhojanshala Restaurant", plan: "yearly", amount: 999, transactionId: "TXN005678", date: "2026-03-07", approved: true },
    { shopId: "2", shopName: "Gupta Medical", plan: "monthly", amount: 99, transactionId: "TXN004321", date: "2026-03-06", approved: true },
  ]);

  const handleLogin = () => {
    if (pin === "1947") {
      setLoggedIn(true);
      toast.success("Admin access granted");
    } else {
      toast.error("Invalid PIN");
    }
  };

  const toggleVerification = (id: string) => {
    setShops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s))
    );
    const shop = shops.find((s) => s.id === id);
    toast.success(shop && !shop.verified ? "✅ Business Verified! Blue Tick activated." : "Verification revoked.");
  };

  const approvePayment = (txnId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.transactionId === txnId ? { ...p, approved: true, rejected: false } : p))
    );
    toast.success("✅ Payment approved. Premium activated.");
  };

  const rejectPayment = (txnId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.transactionId === txnId ? { ...p, rejected: true, approved: false } : p))
    );
    toast.error("❌ Payment rejected.");
  };

  const sendPremiumOffer = (shopName: string) => {
    toast.success(`📩 Premium offer sent to ${shopName}!`);
  };

  const removeShop = (id: string) => {
    setShops((prev) => prev.filter((s) => s.id !== id));
    toast.success("Shop removed");
  };

  // Derived data
  const freeShops = useMemo(() => shops.filter((s) => !s.premium), [shops]);
  const premiumShops = useMemo(() => shops.filter((s) => s.premium), [shops]);
  const verifiedCount = shops.filter((s) => s.verified).length;
  const pendingPayments = payments.filter((p) => !p.approved && !p.rejected);

  const monthlyEarnings = payments.filter((p) => p.approved && p.plan === "monthly").reduce((sum, p) => sum + p.amount, 0);
  const yearlyEarnings = payments.filter((p) => p.approved && p.plan === "yearly").reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = monthlyEarnings + yearlyEarnings;

  // Premium expiry check
  const getPremiumDaysLeft = (shop: any) => {
    if (!shop.premiumStartDate || !shop.premiumPlan) return null;
    const start = new Date(shop.premiumStartDate);
    const duration = shop.premiumPlan === "monthly" ? 30 : 365;
    const expiry = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!loggedIn) {
    return (
      <div className="ashoka-watermark tiranga-bg min-h-screen">
        <AppHeader />
        <div className="relative z-10 flex items-center justify-center py-20">
          <Card className="mx-4 w-full max-w-sm">
            <CardHeader className="text-center">
              <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-primary" />
              <CardTitle>Admin Login</CardTitle>
              <p className="text-xs text-muted-foreground">Bharat Dukaan - Official Control Center</p>
              <p className="font-hindi text-sm text-muted-foreground">भारत दुकान - आधिकारिक नियंत्रण केंद्र</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-xs text-muted-foreground">Demo PIN: 1947</p>
              <input
                type="password"
                placeholder="Enter Admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-center text-lg tracking-widest"
                maxLength={4}
              />
              <Button onClick={handleLogin} className="w-full">Login</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bharat Dukaan - Official Control Center</h2>
            <p className="font-hindi text-muted-foreground">भारत दुकान - आधिकारिक नियंत्रण केंद्र</p>
          </div>
          <div className="relative">
            <Bell className="h-5 w-5" />
            {pendingPayments.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {pendingPayments.length}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <Users className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{shops.length}</p>
                <p className="text-xs opacity-80">Total Shops / कुल दुकानें</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-india text-primary-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <BadgeCheck className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{verifiedCount}</p>
                <p className="text-xs opacity-80">Verified / सत्यापित</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <Crown className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{premiumShops.length}</p>
                <p className="text-xs opacity-80">Premium / प्रीमियम</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent">
            <CardContent className="flex items-center gap-3 py-5">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-3xl font-extrabold text-foreground">{freeShops.length}</p>
                <p className="text-xs text-muted-foreground">Free Users / मुफ्त</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-india">
            <CardContent className="flex items-center gap-3 py-5">
              <IndianRupee className="h-8 w-8 text-green-india" />
              <div>
                <p className="text-3xl font-extrabold text-green-india">₹{totalEarnings}</p>
                <p className="text-[10px] text-muted-foreground">
                  Monthly: ₹{monthlyEarnings} | Yearly: ₹{yearlyEarnings}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Free Users / Premium Requests */}
        <Tabs defaultValue="free" className="mb-8">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="free" className="flex-1">🆓 Free Users (मुफ्त वाले)</TabsTrigger>
            <TabsTrigger value="premium" className="flex-1">⭐ Premium Requests (प्रीमियम वाले)</TabsTrigger>
          </TabsList>

          {/* Free Users Tab */}
          <TabsContent value="free">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Free Users <span className="font-hindi text-sm font-normal text-muted-foreground">• मुफ्त उपयोगकर्ता</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-semibold">Shop / दुकान</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">City</th>
                      <th className="px-4 py-3 font-semibold">Days Active</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freeShops.map((shop) => (
                      <tr key={shop.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{shop.name}</p>
                          <p className="font-hindi text-xs text-muted-foreground">{shop.nameHindi}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {categoryIcons[shop.category] || "🏪"} {shop.category}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{shop.city}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold">{getDaysActive("2026-01-15")} days</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={shop.verified ? "default" : "secondary"} className={shop.verified ? "bg-green-india text-primary-foreground" : ""}>
                            {shop.verified ? "✅ Verified" : "⏳ Pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => sendPremiumOffer(shop.name)} className="text-xs">
                              <Send className="mr-1 h-3 w-3" /> Send Premium Offer
                            </Button>
                            <Button
                              size="sm"
                              variant={shop.verified ? "outline" : "default"}
                              onClick={() => toggleVerification(shop.id)}
                              className={!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}
                            >
                              <BadgeCheck className="mr-1 h-3 w-3" />
                              {shop.verified ? "Revoke" : "Verify"}
                            </Button>
                            <button onClick={() => removeShop(shop.id)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10" title="Reject / Remove">
                              <ShieldX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {freeShops.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No free users currently.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Premium Requests Tab */}
          <TabsContent value="premium">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent" /> Payment Screenshots & Requests
                  <span className="font-hindi text-sm font-normal text-muted-foreground">• भुगतान स्क्रीनशॉट</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((p) => (
                    <div key={p.transactionId} className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <div>
                        <p className="font-semibold text-foreground">{p.shopName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.plan === "monthly" ? "मासिक प्लान ₹99" : "सालाना प्लान ₹999"} • TXN: {p.transactionId} • {p.date}
                        </p>
                        {p.screenshotUrl && (
                          <p className="mt-1 text-xs text-primary">📎 Screenshot uploaded</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approvePayment(p.transactionId)} className="bg-green-india hover:bg-green-india/90 text-primary-foreground">
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectPayment(p.transactionId)}>
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">✅ No pending payment requests.</p>
                )}
              </CardContent>
            </Card>

            {/* Active Premium Shops */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Active Premium Shops <span className="font-hindi text-sm font-normal text-muted-foreground">• सक्रिय प्रीमियम दुकानें</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-semibold">Shop / दुकान</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Days Left</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumShops.map((shop: any) => {
                      const daysLeft = getPremiumDaysLeft(shop);
                      const isExpiring = daysLeft !== null && daysLeft <= 3;
                      return (
                        <tr key={shop.id} className={`border-b last:border-0 hover:bg-muted/30 ${isExpiring ? "bg-destructive/10" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{shop.name}</p>
                            <p className="font-hindi text-xs text-muted-foreground">{shop.nameHindi}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-accent text-accent-foreground text-xs">
                              {shop.premiumPlan === "monthly" ? "₹99 Monthly" : "₹999 Yearly"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {daysLeft !== null ? (
                              <span className={`text-sm font-bold ${isExpiring ? "text-destructive" : "text-foreground"}`}>
                                {isExpiring && <AlertTriangle className="mr-1 inline h-4 w-4 text-destructive" />}
                                {daysLeft} days
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isExpiring ? (
                              <Badge variant="destructive" className="text-xs">⚠ Expiring Soon</Badge>
                            ) : (
                              <Badge className="bg-green-india text-primary-foreground text-xs">✅ Active</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant={shop.verified ? "outline" : "default"}
                                onClick={() => toggleVerification(shop.id)}
                                className={!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}
                              >
                                <BadgeCheck className="mr-1 h-3 w-3" />
                                {shop.verified ? "Revoke" : "Verify"}
                              </Button>
                              <button onClick={() => removeShop(shop.id)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10">
                                <ShieldX className="h-4 w-4" />
                              </button>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-accent" /> Bharat Mitra - FAQ Analytics
              <span className="font-hindi text-sm font-normal text-muted-foreground">• चैटबॉट रिपोर्ट</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Question / सवाल</th>
                  <th className="px-4 py-3 font-semibold">Times Asked</th>
                  <th className="px-4 py-3 font-semibold">Last Asked</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CHATBOT_LOGS
                  .sort((a, b) => b.count - a.count)
                  .map((log, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-hindi font-medium text-foreground">{log.question}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-bold">{log.count}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.lastAsked}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
