import { useState } from "react";
import { sampleShops, Shop } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldX, Store, Users, AlertTriangle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [shops, setShops] = useState<Shop[]>(sampleShops);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pin, setPin] = useState("");

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

  return (
    <div className="ashoka-watermark tiranga-bg min-h-screen">
      <AppHeader />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="font-hindi text-muted-foreground">प्रशासन डैशबोर्ड</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Store className="h-8 w-8 text-saffron" />
              <div>
                <p className="text-2xl font-bold">{shops.length}</p>
                <p className="text-xs text-muted-foreground">Total Shops</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <ShieldCheck className="h-8 w-8 text-green-india" />
              <div>
                <p className="text-2xl font-bold">{shops.filter((s) => s.verified).length}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-8 w-8 text-saffron" />
              <div>
                <p className="text-2xl font-bold">{shops.filter((s) => !s.verified).length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop list */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{shop.name}</p>
                    <Badge variant={shop.verified ? "default" : "secondary"}>
                      {shop.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shop.category} • {shop.address}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={shop.verified ? "outline" : "default"}
                  onClick={() => toggleVerification(shop.id)}
                >
                  {shop.verified ? (
                    <>
                      <ShieldX className="mr-1 h-4 w-4" /> Revoke
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1 h-4 w-4" /> Verify
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
