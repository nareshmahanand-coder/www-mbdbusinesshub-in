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
import { ShoppingBag, Heart, Settings, Trash2, Save, Store, Briefcase, Tag, Download, FileText, Bell, CheckCircle2 } from "lucide-react";
import { downloadReceipt } from "@/lib/generateReceipt";
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

interface MyAd { id: string; title: string; price: number; is_sold: boolean; }
interface MyJob { id: string; title: string; is_active: boolean; }
interface Membership {
  id: string;
  plan: string;
  amount: number;
  transaction_id: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

interface ClassifiedContactRequest {
  id: string;
  classified_id: string;
  buyer_id: string;
  seller_id: string;
  status: "pending" | "approved" | "rejected";
  message: string;
  created_at: string;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "orders";

  const [savedShops, setSavedShops] = useState<SavedShop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myAds, setMyAds] = useState<MyAd[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [contactRequests, setContactRequests] = useState<ClassifiedContactRequest[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || "");
    setPhone(user.phone || "");

    const loadData = async () => {
      const [savedRes, ordersRes, profileRes, adsRes, jobsRes, membershipRes, requestsRes] = await Promise.all([
        supabase.from("saved_shops").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("display_name, phone").eq("id", user.id).single(),
        supabase.from("classifieds").select("id, title, price, is_sold").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("id, title, is_active").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("memberships").select("id, plan, amount, transaction_id, status, starts_at, ends_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("classified_contact_requests" as any).select("*").order("created_at", { ascending: false }),
      ]);

      if (savedRes.data) setSavedShops(savedRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (adsRes.data) setMyAds(adsRes.data as MyAd[]);
      if (jobsRes.data) setMyJobs(jobsRes.data as MyJob[]);
      if (membershipRes.data) setMemberships(membershipRes.data as Membership[]);
      if (requestsRes.data) setContactRequests(requestsRes.data as unknown as ClassifiedContactRequest[]);
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

  const updateContactRequest = async (request: ClassifiedContactRequest, status: "approved" | "rejected") => {
    const { error } = await supabase.from("classified_contact_requests" as any).update({ status }).eq("id", request.id);
    if (error) toast.error("Could not update request");
    else {
      toast.success(status === "approved" ? "Mobile number request approved" : "Request rejected");
      setContactRequests(prev => prev.map(item => item.id === request.id ? { ...item, status } : item));
    }
  };

  const sellerRequests = contactRequests.filter(request => request.seller_id === user?.id);
  const pendingSellerRequests = sellerRequests.filter(request => request.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          <p className="font-hindi text-sm text-muted-foreground">मेरा डैशबोर्ड</p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full max-w-lg flex-wrap">
            <TabsTrigger value="orders" className="flex-1 text-xs">
              <ShoppingBag className="mr-1 h-3.5 w-3.5" /> Orders
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 text-xs">
              <Heart className="mr-1 h-3.5 w-3.5" /> Saved
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex-1 text-xs">
              <Tag className="mr-1 h-3.5 w-3.5" /> My Ads
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 text-xs">
              <Briefcase className="mr-1 h-3.5 w-3.5" /> My Jobs
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex-1 text-xs">
              <FileText className="mr-1 h-3.5 w-3.5" /> Receipts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs">
              <Settings className="mr-1 h-3.5 w-3.5" /> Settings
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

          <TabsContent value="ads" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>My Classified Ads</span>
                  <Link to="/classifieds"><Button size="sm" variant="outline">Post New Ad</Button></Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sellerRequests.length > 0 && (
                  <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                      <Bell className="h-4 w-4 text-accent" /> Buyer Interest Alerts
                      {pendingSellerRequests.length > 0 && <Badge variant="secondary">{pendingSellerRequests.length} pending</Badge>}
                    </p>
                    {sellerRequests.map((request) => {
                      const ad = myAds.find((item) => item.id === request.classified_id);
                      return (
                        <div key={request.id} className="flex flex-col gap-2 rounded-md border border-border bg-card p-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{ad?.title || "Your listing"}</p>
                            <p className="text-xs text-muted-foreground">{request.message || "Buyer requested your mobile number"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>{request.status}</Badge>
                            {request.status === "pending" && <Button size="sm" onClick={() => updateContactRequest(request, "approved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve</Button>}
                            {request.status === "pending" && <Button size="sm" variant="outline" onClick={() => updateContactRequest(request, "rejected")}>Reject</Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {myAds.length === 0 ? (
                  <div className="py-12 text-center">
                    <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No ads posted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAds.map((ad) => (
                      <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-semibold text-foreground">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">₹{ad.price.toLocaleString("en-IN")}</p>
                        </div>
                        <Badge variant={ad.is_sold ? "default" : "secondary"}>{ad.is_sold ? "Sold" : "Active"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  My Job Posts
                  <Link to="/jobs"><Button size="sm" variant="outline">Post New Job</Button></Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myJobs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No job posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <p className="font-semibold text-foreground">{job.title}</p>
                        <Badge variant={job.is_active ? "secondary" : "default"}>{job.is_active ? "Active" : "Closed"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {memberships.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No payment receipts yet</p>
                    <p className="font-hindi text-sm text-muted-foreground">अभी तक कोई रसीद नहीं</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberships.map((m) => {
                      const receiptNumber = `MBD-${new Date(m.created_at).getTime().toString(36).toUpperCase()}`;
                      return (
                        <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">
                              {m.plan === "yearly" ? "Yearly Plan" : "Monthly Plan"} — ₹{m.amount}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              TXN: {m.transaction_id || "N/A"} • {new Date(m.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <Badge variant={m.status === "approved" ? "default" : "secondary"} className="mt-1 text-[10px]">
                              {m.status === "approved" ? "Approved ✓" : m.status === "pending" ? "Pending" : m.status}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 gap-1 border-accent text-accent shrink-0"
                            onClick={() =>
                              downloadReceipt({
                                userName: user?.user_metadata?.display_name || user?.email || "User",
                                userEmail: user?.email || "",
                                plan: m.plan as "monthly" | "yearly",
                                amount: m.amount,
                                transactionId: m.transaction_id || "N/A",
                                startsAt: m.starts_at,
                                endsAt: m.ends_at,
                                receiptNumber,
                              })
                            }
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
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
