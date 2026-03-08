import { useState } from "react";
import { sampleShops, Shop, categoryIcons } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldX, Store, AlertTriangle, IndianRupee, Bell, Image } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import upiQr from "@/assets/upi-qr.jpeg";

const AdminDashboard = () => {
  const [shops, setShops] = useState<Shop[]>(sampleShops);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(1);

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
    toast.success("Shop verification status updated");
  };

  const handleApprovePayment = () => {
    setPendingPayments(0);
    toast.success("मुबारक हो! Payment approved. Premium activated.");
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
  const totalEarnings = verifiedCount * 99;

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
            <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
              <Image className="mr-1 h-4 w-4" /> QR Code
            </Button>
            <button className="relative rounded-full border p-2 hover:bg-muted" onClick={handleApprovePayment}>
              <Bell className="h-5 w-5" />
              {pendingPayments > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingPayments}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats - 4 colored cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-5 text-center">
              <p className="text-3xl font-extrabold">{shops.length}</p>
              <p className="text-sm opacity-80">Total Shops</p>
            </CardContent>
          </Card>
          <Card className="bg-green-india text-primary-foreground">
            <CardContent className="py-5 text-center">
              <p className="text-3xl font-extrabold">{verifiedCount}</p>
              <p className="text-sm opacity-80">Verified</p>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="py-5 text-center">
              <p className="text-3xl font-extrabold">{pendingCount}</p>
              <p className="text-sm opacity-80">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent">
            <CardContent className="py-5 text-center">
              <p className="text-3xl font-extrabold text-accent">₹{totalEarnings}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Shop table */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Registrations</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Shop</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{shop.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoryIcons[shop.category] || "🏪"} {shop.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{shop.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant={shop.verified ? "default" : "secondary"} className={shop.verified ? "bg-green-india text-primary-foreground" : "bg-accent/20 text-accent"}>
                        {shop.verified ? "✅ Verified" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleVerification(shop.id)}
                          className={`rounded-full p-1.5 transition-colors ${shop.verified ? "text-muted-foreground hover:text-foreground" : "text-green-india hover:bg-green-india/10"}`}
                          title={shop.verified ? "Revoke" : "Verify"}
                        >
                          <ShieldCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setShops(prev => prev.filter(s => s.id !== shop.id));
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

      {/* QR Code Dialog */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Premium Payment QR</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">₹99 Premium Subscription</p>
          <img src={upiQr} alt="UPI QR Code" className="mx-auto max-w-[280px] rounded-lg border shadow" />
          <p className="text-xs text-muted-foreground">Scan & pay using any UPI app</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
