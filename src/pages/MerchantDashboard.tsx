import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Store, BarChart3, Package, ShoppingBag, HelpCircle, Plus, Trash2,
  Save, Eye, Phone, MapPin, Edit, Mail
} from "lucide-react";
import { toast } from "sonner";

interface MerchantProfile {
  id: string;
  shop_name: string;
  shop_name_hindi: string;
  category: string;
  description: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  is_premium: boolean;
  is_verified: boolean;
}

interface Product {
  id: string;
  name: string;
  name_hindi: string;
  price: number;
  description: string;
  in_stock: boolean;
}

interface Order {
  id: string;
  shop_name: string;
  status: string;
  message: string;
  created_at: string;
}

const MerchantDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState({ views: 0, calls: 0, directions: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({ name: "", name_hindi: "", price: "", description: "" });

  // Shop profile form
  const [shopForm, setShopForm] = useState({
    shop_name: "", shop_name_hindi: "", category: "", description: "",
    address: "", city: "", pincode: "", phone: "", whatsapp: "",
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: merchantData } = await supabase
      .from("merchant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (merchantData) {
      setProfile(merchantData as MerchantProfile);
      setShopForm({
        shop_name: merchantData.shop_name || "",
        shop_name_hindi: merchantData.shop_name_hindi || "",
        category: merchantData.category || "",
        description: merchantData.description || "",
        address: merchantData.address || "",
        city: merchantData.city || "",
        pincode: merchantData.pincode || "",
        phone: merchantData.phone || "",
        whatsapp: merchantData.whatsapp || "",
      });

      // Load products
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("merchant_id", merchantData.id)
        .order("created_at", { ascending: false });
      if (prodData) setProducts(prodData as Product[]);

      // Load orders
      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .eq("merchant_id", merchantData.id)
        .order("created_at", { ascending: false });
      if (ordData) setOrders(ordData as Order[]);

      // Load analytics
      const { data: analyticsData } = await supabase
        .from("shop_analytics")
        .select("event_type")
        .eq("merchant_id", merchantData.id);
      if (analyticsData) {
        setAnalytics({
          views: analyticsData.filter((a) => a.event_type === "view").length,
          calls: analyticsData.filter((a) => a.event_type === "call").length,
          directions: analyticsData.filter((a) => a.event_type === "direction").length,
        });
      }
    }

    setLoading(false);
  };

  const createOrUpdateShop = async () => {
    if (!user) return;
    setSaving(true);

    if (profile) {
      const { error } = await supabase
        .from("merchant_profiles")
        .update(shopForm)
        .eq("id", profile.id);
      if (error) toast.error("Failed to update shop");
      else toast.success("Shop profile updated!");
    } else {
      const { data, error } = await supabase
        .from("merchant_profiles")
        .insert({ ...shopForm, user_id: user.id })
        .select()
        .single();
      if (error) toast.error("Failed to create shop");
      else {
        setProfile(data as MerchantProfile);
        toast.success("Shop created successfully! 🎉");
      }
    }
    setSaving(false);
    await loadData();
  };

  const addProduct = async () => {
    if (!profile) return;
    if (!newProduct.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    const { error } = await supabase.from("products").insert({
      merchant_id: profile.id,
      name: newProduct.name,
      name_hindi: newProduct.name_hindi,
      price: parseFloat(newProduct.price) || 0,
      description: newProduct.description,
    });
    if (error) toast.error("Failed to add product");
    else {
      toast.success("Product added!");
      setNewProduct({ name: "", name_hindi: "", price: "", description: "" });
      await loadData();
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product removed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Merchant Dashboard</h1>
            <p className="font-hindi text-sm text-muted-foreground">व्यापारी डैशबोर्ड</p>
          </div>
          {profile && (
            <div className="flex gap-2">
              {profile.is_verified && (
                <Badge className="bg-primary text-primary-foreground">✅ Verified</Badge>
              )}
              {profile.is_premium && (
                <Badge className="bg-accent text-accent-foreground">⭐ Premium</Badge>
              )}
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="mb-6 grid gap-3 grid-cols-3">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Eye className="h-6 w-6 opacity-80" />
              <div>
                <p className="text-2xl font-extrabold">{analytics.views}</p>
                <p className="text-[10px] opacity-70">Total Views</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Phone className="h-6 w-6 opacity-80" />
              <div>
                <p className="text-2xl font-extrabold">{analytics.calls}</p>
                <p className="text-[10px] opacity-70">Call Clicks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <p className="text-2xl font-extrabold text-foreground">{analytics.directions}</p>
                <p className="text-[10px] text-muted-foreground">Directions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="w-full max-w-2xl flex-wrap">
            <TabsTrigger value="profile" className="flex-1 text-xs">
              <Store className="mr-1 h-3.5 w-3.5" /> Shop Profile
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 text-xs">
              <Package className="mr-1 h-3.5 w-3.5" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 text-xs">
              <ShoppingBag className="mr-1 h-3.5 w-3.5" /> Orders
            </TabsTrigger>
            <TabsTrigger value="help" className="flex-1 text-xs">
              <HelpCircle className="mr-1 h-3.5 w-3.5" /> Help
            </TabsTrigger>
          </TabsList>

          {/* Shop Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="h-5 w-5" /> Shop Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Shop Name (English)</label>
                    <Input
                      value={shopForm.shop_name}
                      onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                      placeholder="Your shop name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">दुकान का नाम (हिन्दी)</label>
                    <Input
                      value={shopForm.shop_name_hindi}
                      onChange={(e) => setShopForm({ ...shopForm, shop_name_hindi: e.target.value })}
                      placeholder="हिन्दी में नाम"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <Input
                      value={shopForm.category}
                      onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                      placeholder="e.g. Grocery, Electronics"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <Input
                      value={shopForm.phone}
                      onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">WhatsApp</label>
                    <Input
                      value={shopForm.whatsapp}
                      onChange={(e) => setShopForm({ ...shopForm, whatsapp: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">City</label>
                    <Input
                      value={shopForm.city}
                      onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Pincode</label>
                    <Input
                      value={shopForm.pincode}
                      onChange={(e) => setShopForm({ ...shopForm, pincode: e.target.value })}
                      placeholder="6-digit pincode"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Address</label>
                    <Input
                      value={shopForm.address}
                      onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={shopForm.description}
                    onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                    placeholder="Tell customers about your shop..."
                    rows={3}
                  />
                </div>
                <Button onClick={createOrUpdateShop} disabled={saving} className="bg-primary text-primary-foreground">
                  <Save className="mr-1.5 h-4 w-4" />
                  {saving ? "Saving..." : profile ? "Update Shop" : "Create Shop"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!profile ? (
                  <p className="text-sm text-muted-foreground">Please create your shop profile first.</p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Product Name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                      <Input
                        placeholder="उत्पाद का नाम (हिन्दी)"
                        value={newProduct.name_hindi}
                        onChange={(e) => setNewProduct({ ...newProduct, name_hindi: e.target.value })}
                      />
                      <Input
                        placeholder="Price (₹)"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                      <Input
                        placeholder="Description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={addProduct} size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Product
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Catalog ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No products added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          {p.name_hindi && <p className="font-hindi text-xs text-muted-foreground">{p.name_hindi}</p>}
                          <p className="text-sm font-bold text-accent">₹{p.price}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Inquiries & Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders or inquiries yet</p>
                    <p className="font-hindi text-sm text-muted-foreground">अभी तक कोई ऑर्डर नहीं आया</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{order.shop_name || "Customer Inquiry"}</p>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-semibold text-foreground mb-2">Contact Admin</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href="mailto:helpline.bharatdukaan@gmail.com" className="text-primary hover:underline">
                        helpline.bharatdukaan@gmail.com
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>WhatsApp: Available in Help Desk</span>
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-semibold text-foreground mb-2">FAQs</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Q:</strong> How do I get Premium status?</p>
                    <p className="font-hindi">Pay ₹99/month or ₹999/year via the Merchant Portal.</p>
                    <p><strong>Q:</strong> How do I get verified?</p>
                    <p className="font-hindi">Admin verifies your shop after reviewing your registration.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MerchantDashboard;
