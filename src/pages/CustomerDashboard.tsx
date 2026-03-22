import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Heart, Settings, Trash2, Save, Store, Briefcase, Tag } from "lucide-react";
import { toast } from "sonner";
import { sampleShops } from "@/data/sampleShops";

interface SavedShop {
  id: string;
  shop_id: string;
  created_at: string;
}

interface Order {
  id: string;
  shop_name: string;
  status: string;
  message: string;
  created_at: string;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "orders";

  const [savedShops, setSavedShops] = useState<SavedShop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || "");
    setPhone(user.phone || "");

    const loadData = async () => {
      const [savedRes, ordersRes, profileRes] = await Promise.all([
        supabase.from("saved_shops").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("display_name, phone").eq("id", user.id).single(),
      ]);

      if (savedRes.data) setSavedShops(savedRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name || displayName);
        setPhone(profileRes.data.phone || phone);
      }
    };

    void loadData();
  }, [user]);

  const removeSavedShop = async (id: string) => {
    const { error } = await supabase.from("saved_shops").delete().eq("id", id);
    if (!error) {
      setSavedShops((prev) => prev.filter((s) => s.id !== id));
      toast.success("Shop removed from favorites");
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  const getShopInfo = (shopId: string) =>
    sampleShops.find((s) => s.id === shopId);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="font-hindi text-sm text-muted-foreground">मेरा डैशबोर्ड</p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="orders" className="flex-1 text-xs sm:text-sm">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 text-xs sm:text-sm">
              <Heart className="mr-1.5 h-4 w-4" /> Saved
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs sm:text-sm">
              <Settings className="mr-1.5 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Orders & Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <p className="font-hindi text-sm text-muted-foreground">अभी तक कोई ऑर्डर नहीं</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-semibold text-foreground">{order.shop_name || "Shop"}</p>
                          <p className="text-xs text-muted-foreground">{order.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Shops</CardTitle>
              </CardHeader>
              <CardContent>
                {savedShops.length === 0 ? (
                  <div className="py-12 text-center">
                    <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No saved shops yet</p>
                    <p className="font-hindi text-sm text-muted-foreground">अभी तक कोई पसंदीदा दुकान नहीं</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedShops.map((saved) => {
                      const shop = getShopInfo(saved.shop_id);
                      return (
                        <div key={saved.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="font-semibold text-foreground">{shop?.name || saved.shop_id}</p>
                            {shop && <p className="text-xs text-muted-foreground">{shop.category} • {shop.city}</p>}
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => removeSavedShop(saved.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Delivery Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your delivery address" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <Button onClick={saveSettings} disabled={saving} className="bg-primary text-primary-foreground">
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;
