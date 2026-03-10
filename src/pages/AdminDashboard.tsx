import { useState } from "react";
import { sampleShops, Shop, categoryIcons } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldX, Bell, CheckCircle2, IndianRupee, Users, Clock, BadgeCheck } from "lucide-react";
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
}

const AdminDashboard = () => {
  const [shops, setShops] = useState<Shop[]>(sampleShops);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  const [payments, setPayments] = useState<MerchantPayment[]>([
    { shopId: "1", shopName: "Sharma General Store", plan: "monthly", amount: 99, transactionId: "TXN001234", date: "2026-03-08", approved: false },
    { shopId: "6", shopName: "Bhojanshala Restaurant", plan: "yearly", amount: 999, transactionId: "TXN005678", date: "2026-03-07", approved: true },
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
    const newStatus = shop ? !shop.verified : false;
    toast.success(
      newStatus
        ? "✅ Business Verified! Blue Tick activated."
        : "Verification revoked."
    );
  };

  const approvePayment = (txnId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.transactionId === txnId ? { ...p, approved: true } : p))
    );
    toast.success("✅ Payment approved. Premium activated.");
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
              <p className="font-hindi text-sm text-muted-foreground">प्रशासन लॉगिन</p>
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
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const verifiedCount = shops.filter((s) => s.verified).length;
  const pendingCount = shops.filter((s) => !s.verified).length;
  const pendingPaymentCount = payments.filter((p) => !p.approved).length;

  // Earnings from approved payments
  const monthlyEarnings = payments.filter((p) => p.approved && p.plan === "monthly").reduce((sum, p) => sum + p.amount, 0);
  const yearlyEarnings = payments.filter((p) => p.approved && p.plan === "yearly").reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = monthlyEarnings + yearlyEarnings;

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
            <p className="font-hindi text-muted-foreground">प्रशासन डैशबोर्ड</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5" />
              {pendingPaymentCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingPaymentCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <Users className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{shops.length}</p>
                <p className="text-sm opacity-80">Total Shops / कुल दुकानें</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-india text-primary-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <BadgeCheck className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{verifiedCount}</p>
                <p className="text-sm opacity-80">Verified / सत्यापित</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="flex items-center gap-3 py-5">
              <Clock className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-3xl font-extrabold">{pendingCount}</p>
                <p className="text-sm opacity-80">Pending / लंबित</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent">
            <CardContent className="flex items-center gap-3 py-5">
              <IndianRupee className="h-8 w-8 text-accent" />
              <div>
                <p className="text-3xl font-extrabold text-accent">₹{totalEarnings}</p>
                <p className="text-xs text-muted-foreground">
                  Monthly: ₹{monthlyEarnings} | Yearly: ₹{yearlyEarnings}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Approvals */}
        {pendingPaymentCount > 0 && (
          <Card className="mb-8 border-2 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Bell className="h-5 w-5" /> Pending Payment Approvals
                <span className="font-hindi text-sm font-normal text-muted-foreground">• भुगतान स्वीकृति</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments
                .filter((p) => !p.approved)
                .map((p) => (
                  <div key={p.transactionId} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                    <div>
                      <p className="font-semibold text-foreground">{p.shopName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.plan === "monthly" ? "मासिक प्लान ₹99" : "सालाना प्लान ₹999"} • TXN: {p.transactionId} • {p.date}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => approvePayment(p.transactionId)} className="bg-green-india hover:bg-green-india/90 text-primary-foreground">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Shop table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Shop Registrations
              <span className="font-hindi ml-2 text-sm font-normal text-muted-foreground">• दुकान पंजीकरण</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Shop / दुकान</th>
                  <th className="px-4 py-3 font-semibold">Category / श्रेणी</th>
                  <th className="px-4 py-3 font-semibold">City / शहर</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
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
                      <Badge variant={shop.verified ? "default" : "secondary"} className={shop.verified ? "bg-green-india text-primary-foreground" : "bg-accent/20 text-accent"}>
                        {shop.verified ? "✅ Verified" : "⏳ Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={shop.verified ? "outline" : "default"}
                          onClick={() => toggleVerification(shop.id)}
                          className={shop.verified ? "" : "bg-green-india hover:bg-green-india/90 text-primary-foreground"}
                          title={shop.verified ? "Revoke Verification" : "Verify Business"}
                        >
                          <BadgeCheck className="mr-1 h-4 w-4" />
                          {shop.verified ? "Revoke" : "Verify Business"}
                        </Button>
                        <button
                          onClick={() => {
                            setShops((prev) => prev.filter((s) => s.id !== shop.id));
                            toast.success("Shop removed");
                          }}
                          className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"
                          title="Remove"
                        >
                          <ShieldX className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
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
