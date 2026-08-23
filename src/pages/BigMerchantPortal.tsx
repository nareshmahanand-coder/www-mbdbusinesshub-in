import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKycStatus } from "@/hooks/useKycStatus";
import { startBigMerchantPayment } from "@/lib/razorpayPayments";
import { shopCategories } from "@/data/sampleShops";
import {
  Crown, Loader2, ShieldCheck, Store, Users, FileText, BadgeCheck,
  IndianRupee, Image as ImageIcon, Copy, LayoutDashboard,
} from "lucide-react";

type BigMerchantRow = {
  id: string;
  user_id: string;
  big_merchant_id: string;
  coordinator_id: string | null;
  registration_type: string;
  shop_name: string;
  owner_name: string;
  category: string;
  mobile: string;
  email: string | null;
  city: string | null;
  address: string | null;
  pincode: string | null;
  gst_number: string;
  gst_certificate_url: string | null;
  food_license_number: string | null;
  food_license_url: string | null;
  aadhaar_number: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_number: string | null;
  pan_url: string | null;
  photos: string[] | null;
  video_ad_url?: string | null;

  status: string;
  subscription_status: string;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  admin_notes: string;
  created_at: string;
};

const DEVICE_ID_KEY = "mbd-big-merchant-id";
const DRAFT_KEY_PREFIX = "mbd-big-merchant-draft-";

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const FOOD_CATEGORY_PATTERN =
  /grocery|general store|kirana|food|vegetable|fruit|dairy|milk|bakery|sweet|mithai|snack|chaat|momo|restaurant|hotel|tea|juice|meat|fish|chicken|dhaba|cafe|canteen|catering|masala|oil|agro|farm/i;

export const isFoodCategory = (category: string) => FOOD_CATEGORY_PATTERN.test(category || "");

const isSubscriptionActive = (row: BigMerchantRow | null) =>
  !!row &&
  row.subscription_status === "active" &&
  (!row.subscription_expires_at || new Date(row.subscription_expires_at).getTime() > Date.now());

const emptyForm = {
  shopName: "",
  ownerName: "",
  category: "",
  mobile: "",
  email: "",
  city: "",
  address: "",
  pincode: "",
  gstNumber: "",
  foodLicenseNumber: "",
  aadhaarNumber: "",
  panNumber: "",
  coordinatorCode: "",
  description: "",
};

const BigMerchantPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"choose" | "merchant" | "coordinator">("choose");
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<BigMerchantRow | null>(null);
  const [savedId, setSavedId] = useState<string>(() => localStorage.getItem(DEVICE_ID_KEY) || "");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [uploading, setUploading] = useState("");

  const [form, setForm] = useState({ ...emptyForm });
  const [gstUrl, setGstUrl] = useState("");
  const [foodUrl, setFoodUrl] = useState("");
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState("");
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [coordinatorInfo, setCoordinatorInfo] = useState<{ id: string; name: string } | null>(null);


  // Coordinator view state
  const [coordinatorSelf, setCoordinatorSelf] = useState<{ id: string; coordinator_code: string; status: string } | null>(null);
  const [teamBigMerchants, setTeamBigMerchants] = useState<BigMerchantRow[]>([]);

  const gstRef = useRef<HTMLInputElement>(null);
  const foodRef = useRef<HTMLInputElement>(null);
  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);



  const draftKey = user ? `${DRAFT_KEY_PREFIX}${user.id}` : "";
  const foodRequired = useMemo(() => isFoodCategory(form.category), [form.category]);

  const load = async () => {
    if (!user) { setRecord(null); setLoading(false); return; }
    const { data } = await supabase.from("big_merchants").select("*").eq("user_id", user.id).maybeSingle();
    const row = (data as BigMerchantRow) ?? null;
    setRecord(row);
    if (row?.big_merchant_id) {
      localStorage.setItem(DEVICE_ID_KEY, row.big_merchant_id);
      setSavedId(row.big_merchant_id);
    }

    const { data: coord } = await supabase
      .from("coordinators")
      .select("id, coordinator_code, status")
      .eq("user_id", user.id)
      .maybeSingle();
    setCoordinatorSelf((coord as { id: string; coordinator_code: string; status: string }) ?? null);
    if (coord?.id) {
      const { data: team } = await supabase
        .from("big_merchants")
        .select("*")
        .eq("coordinator_id", coord.id)
        .order("created_at", { ascending: false });
      setTeamBigMerchants((team as BigMerchantRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // Restore an unfinished registration draft.
  useEffect(() => {
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setForm((prev) => ({ ...prev, ...(draft.form || {}) }));
      setGstUrl(draft.gstUrl || "");
      setFoodUrl(draft.foodUrl || "");
      setAadhaarFrontUrl(draft.aadhaarFrontUrl || "");
      setAadhaarBackUrl(draft.aadhaarBackUrl || "");
      setPanUrl(draft.panUrl || "");
      setVideoUrl(draft.videoUrl || "");
      setPhotos(draft.photos || []);

    } catch {
      /* ignore malformed drafts */
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || record) return;
    localStorage.setItem(
      draftKey,
      JSON.stringify({ form, gstUrl, foodUrl, aadhaarFrontUrl, aadhaarBackUrl, panUrl, videoUrl, photos }),
    );
  }, [draftKey, record, form, gstUrl, foodUrl, aadhaarFrontUrl, aadhaarBackUrl, panUrl, videoUrl, photos]);


  // Live updates on approval / subscription activation.
  useEffect(() => {
    if (!record?.id) return;
    const channel = supabase
      .channel(`big-merchant-${record.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "big_merchants", filter: `id=eq.${record.id}` },
        (payload) => setRecord((prev) => (prev ? { ...prev, ...(payload.new as BigMerchantRow) } : prev)))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [record?.id]);

  const upload = async (file: File, folder: string, setter: (url: string) => void) => {
    if (!user) return;
    setUploading(folder);
    const ext = file.name.split(".").pop();
    const path = `big-merchants/${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(""); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setter(data.publicUrl);
    setUploading("");
    toast.success("Uploaded");
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>, folder: string, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) void upload(file, folder, setter);
    e.target.value = "";
  };

  const verifyCoordinator = async () => {
    const code = form.coordinatorCode.trim();
    if (!code) { setCoordinatorInfo(null); return; }
    const { data, error } = await supabase.rpc("lookup_coordinator_by_code", { p_code: code });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setCoordinatorInfo(null);
      toast.error("यह Coordinator ID मान्य नहीं है");
      return;
    }
    setCoordinatorInfo({ id: row.id, name: row.name });
    toast.success(`Coordinator verified: ${row.name}`);
  };

  const submit = async () => {
    if (!user) { navigate("/login?next=/big-merchant"); return; }
    if (!hasKyc) { navigate("/ekyc?mode=upload&next=%2Fbig-merchant"); return; }

    const shopName = form.shopName.trim();
    const ownerName = form.ownerName.trim();
    const mobile = form.mobile.replace(/\D/g, "");
    const gst = form.gstNumber.trim().toUpperCase();

    if (!shopName || !ownerName || !form.category) { toast.error("दुकान का नाम, मालिक का नाम और कैटेगरी अनिवार्य है"); return; }
    if (mobile.length !== 10) { toast.error("10 अंकों का मोबाइल नंबर डालें"); return; }
    if (!GST_REGEX.test(gst)) { toast.error("वैध GST नंबर अनिवार्य है (उदा. 09ABCDE1234F1Z5)"); return; }
    if (!gstUrl) { toast.error("GST सर्टिफिकेट अपलोड करना अनिवार्य है"); return; }
    if (foodRequired && (!form.foodLicenseNumber.trim() || !foodUrl)) {
      toast.error("खाद्य श्रेणी के लिए FSSAI नंबर और लाइसेंस अपलोड अनिवार्य है");
      return;
    }

    setSubmitting(true);
    const payload = {
      user_id: user.id,
      coordinator_id: coordinatorInfo?.id ?? null,
      registration_type: coordinatorInfo ? "coordinator" : "self",
      shop_name: shopName,
      owner_name: ownerName,
      category: form.category,
      mobile,
      email: form.email.trim() || user.email || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      pincode: form.pincode.trim() || null,
      gst_number: gst,
      gst_certificate_url: gstUrl,
      food_license_number: form.foodLicenseNumber.trim() || null,
      food_license_url: foodUrl || null,
      aadhaar_number: form.aadhaarNumber.trim() || null,
      aadhaar_front_url: aadhaarFrontUrl || null,
      aadhaar_back_url: aadhaarBackUrl || null,
      pan_number: form.panNumber.trim().toUpperCase() || null,
      pan_url: panUrl || null,
      video_ad_url: videoUrl || null,
      photos,

    };

    const { data, error } = await supabase.from("big_merchants").insert(payload).select("*").maybeSingle();
    if (error) {
      setSubmitting(false);
      toast.error(error.message || "रजिस्ट्रेशन विफल रहा");
      return;
    }

    const row = data as BigMerchantRow;
    localStorage.setItem(DEVICE_ID_KEY, row.big_merchant_id);
    setSavedId(row.big_merchant_id);
    if (draftKey) localStorage.removeItem(draftKey);

    // Mirror the shop into merchant_profiles so it appears in listings.
    const { data: existing } = await supabase
      .from("merchant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const shopPayload = {
      user_id: user.id,
      shop_name: shopName,
      owner_name: ownerName,
      category: form.category,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      pincode: form.pincode.trim() || null,
      phone: mobile,
      whatsapp: mobile,
      description: form.description.trim() || null,
      photos,
      gst_certificate_url: gstUrl,
      food_license_url: foodUrl || null,
      big_merchant_id: row.big_merchant_id,
    };
    if (existing?.id) {
      await supabase.from("merchant_profiles").update(shopPayload).eq("id", existing.id);
    } else {
      await supabase.from("merchant_profiles").insert(shopPayload);
    }

    setRecord(row);
    setSubmitting(false);
    toast.success(`रजिस्ट्रेशन पूरा! आपकी Big Merchant ID: ${row.big_merchant_id}`);
  };

  const pay = async (plan: "monthly" | "yearly") => {
    setPaying(true);
    try {
      await startBigMerchantPayment({
        plan,
        onSuccess: () => { toast.success("Big Merchant Plus सक्रिय हो गया!"); void load(); },
        onFailure: () => toast.error("भुगतान पूरा नहीं हो सका"),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not start");
    } finally {
      setPaying(false);
    }
  };

  const UploadTile = ({ label, url, folder, inputRef, required }: {
    label: string; url: string; folder: string; inputRef: React.RefObject<HTMLInputElement>; required?: boolean;
  }) => (
    <div className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 text-xs">
      <div className="flex h-16 w-16 items-center justify-center">
        {url ? <img src={url} alt={label} className="h-16 w-16 rounded-md object-cover" />
          : uploading === folder ? <Loader2 className="h-5 w-5 animate-spin" />
          : <FileText className="h-5 w-5 text-muted-foreground" />}
      </div>
      <span className="text-center font-medium">{label}{required ? " *" : ""}</span>
      <Button type="button" size="sm" variant="outline" className="h-7 w-full text-[11px]" onClick={() => inputRef.current?.click()}>
        फ़ाइल चुनें
      </Button>
    </div>
  );

  if (authLoading || loading || kycLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const active = isSubscriptionActive(record);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-transparent p-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Crown className="h-7 w-7 text-amber-500" /> Big Merchant Plus
          </h1>
          <p className="font-hindi text-sm text-muted-foreground">
            ₹1600 मासिक प्लान — सबसे ऊपर लिस्टिंग, वेरिफाइड बैज, वीडियो विज्ञापन और प्रीमियम बिज़नेस डैशबोर्ड।
          </p>
        </header>

        {!user && (
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="font-hindi text-sm">Big Merchant Plus के लिए पहले लॉगिन करें।</p>
              <Button onClick={() => navigate("/login?next=/big-merchant")}>Login / Register</Button>
            </CardContent>
          </Card>
        )}

        {/* ---------- Dual login interface ---------- */}
        {user && mode === "choose" && !record && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-amber-500/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-amber-600" /> Authorized Coordinator Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-hindi text-sm text-muted-foreground">
                  कोऑर्डिनेटर के रूप में लॉगिन करें और अपने द्वारा जोड़े गए Big Merchants देखें।
                </p>
                <Button className="w-full" onClick={() => setMode("coordinator")}>Coordinator के रूप में जारी रखें</Button>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Store className="h-5 w-5 text-primary" /> Merchant / Vendor ID Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-hindi text-sm text-muted-foreground">
                  नया Big Merchant रजिस्ट्रेशन करें या अपनी मौजूदा Big Merchant ID से डैशबोर्ड खोलें।
                </p>
                {savedId ? (
                  <p className="rounded-md bg-muted p-2 text-xs">इस डिवाइस पर सेव ID: <span className="font-mono font-semibold">{savedId}</span></p>
                ) : null}
                <Button className="w-full" variant="secondary" onClick={() => setMode("merchant")}>Merchant के रूप में जारी रखें</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------- Coordinator view ---------- */}
        {user && mode === "coordinator" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5" /> My Big Merchants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!coordinatorSelf ? (
                <>
                  <p className="font-hindi text-sm text-muted-foreground">आप अभी कोऑर्डिनेटर के रूप में रजिस्टर्ड नहीं हैं।</p>
                  <Button onClick={() => navigate("/coordinator")}>Coordinator Portal खोलें</Button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-hindi">आपकी Coordinator ID:</span>
                    <span className="font-mono font-bold">{coordinatorSelf.coordinator_code}</span>
                    <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(coordinatorSelf.coordinator_code); toast.success("Copied"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Badge variant="secondary">{coordinatorSelf.status}</Badge>
                  </div>
                  <p className="font-hindi text-xs text-muted-foreground">
                    मर्चेंट को रजिस्ट्रेशन फ़ॉर्म में यह Coordinator ID डालने को कहें — वे स्वतः आपकी टीम से मैप हो जाएँगे।
                  </p>
                  {teamBigMerchants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">अभी कोई Big Merchant मैप नहीं है।</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-muted-foreground">
                          <tr><th className="p-2">Big Merchant ID</th><th className="p-2">Shop</th><th className="p-2">City</th><th className="p-2">Status</th><th className="p-2">Subscription</th></tr>
                        </thead>
                        <tbody>
                          {teamBigMerchants.map((b) => (
                            <tr key={b.id} className="border-t">
                              <td className="p-2 font-mono text-xs">{b.big_merchant_id}</td>
                              <td className="p-2">{b.shop_name}</td>
                              <td className="p-2">{b.city || "—"}</td>
                              <td className="p-2"><Badge variant="outline">{b.status}</Badge></td>
                              <td className="p-2"><Badge variant={b.subscription_status === "active" ? "default" : "secondary"}>{b.subscription_status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" onClick={() => setMode("choose")}>← वापस</Button>
            </CardContent>
          </Card>
        )}

        {/* ---------- e-KYC gate ---------- */}
        {user && mode === "merchant" && !record && !hasKyc && (
          <Card className="border-2 border-amber-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-amber-600" /> e-KYC अनिवार्य</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-hindi text-sm text-muted-foreground">Big Merchant Plus रजिस्ट्रेशन से पहले e-KYC पूरा करें।</p>
              <Button onClick={() => navigate("/ekyc?mode=upload&next=%2Fbig-merchant")}>
                <ShieldCheck className="mr-2 h-4 w-4" /> e-KYC शुरू करें
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---------- Registration form ---------- */}
        {user && mode === "merchant" && !record && hasKyc && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Store className="h-5 w-5" /> Big Merchant Plus रजिस्ट्रेशन (₹1600/माह)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                  <Crown className="h-4 w-4" /> ₹1600 प्लान में क्या-क्या मिलेगा
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Top-priority store ranking</li>
                  <li>• Verified GST/FSSAI badge</li>
                  <li>• Premium vendor dashboard access</li>
                  <li>• In-app Video Advertisement support</li>
                  <li>• Professional CA Support & MSME Bank Loan Guidance/Advisory sessions</li>
                </ul>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>दुकान/बिज़नेस का नाम *</Label><Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></div>
                <div><Label>मालिक का नाम *</Label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
                <div>
                  <Label>कैटेगरी *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="चुनें" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {shopCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>मोबाइल नंबर *</Label><Input inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} /></div>
                <div><Label>ईमेल</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>शहर</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>पिनकोड</Label><Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} /></div>
                <div><Label>GST नंबर *</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} placeholder="09ABCDE1234F1Z5" /></div>
                <div className="md:col-span-2"><Label>पता</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>बिज़नेस विवरण</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                {foodRequired && (
                  <div className="md:col-span-2">
                    <Label>FSSAI / खाद्य लाइसेंस नंबर * (खाद्य श्रेणी के लिए अनिवार्य)</Label>
                    <Input value={form.foodLicenseNumber} onChange={(e) => setForm({ ...form, foodLicenseNumber: e.target.value })} />
                  </div>
                )}
                <div><Label>आधार नंबर</Label><Input value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} /></div>
                <div><Label>PAN नंबर</Label><Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} /></div>
              </div>

              <div className="space-y-2 rounded-xl border p-3">
                <Label className="font-hindi text-sm">Coordinator ID (यदि किसी कोऑर्डिनेटर के माध्यम से जुड़ रहे हैं)</Label>
                <div className="flex gap-2">
                  <Input value={form.coordinatorCode} onChange={(e) => { setForm({ ...form, coordinatorCode: e.target.value.toUpperCase() }); setCoordinatorInfo(null); }} placeholder="COXXXXXX" />
                  <Button type="button" variant="outline" onClick={() => void verifyCoordinator()}>Verify</Button>
                </div>
                {coordinatorInfo && <p className="text-xs text-green-600">✓ {coordinatorInfo.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <UploadTile label="GST सर्टिफिकेट" url={gstUrl} folder="gst" inputRef={gstRef} required />
                {foodRequired && <UploadTile label="FSSAI लाइसेंस" url={foodUrl} folder="fssai" inputRef={foodRef} required />}
                <UploadTile label="आधार (आगे)" url={aadhaarFrontUrl} folder="aadhaar-front" inputRef={aadhaarFrontRef} />
                <UploadTile label="आधार (पीछे)" url={aadhaarBackUrl} folder="aadhaar-back" inputRef={aadhaarBackRef} />
                <UploadTile label="PAN कार्ड" url={panUrl} folder="pan" inputRef={panRef} />
                <div className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 text-xs">
                  <div className="flex h-16 w-16 items-center justify-center">
                    {photos[0] ? <img src={photos[0]} alt="shop" className="h-16 w-16 rounded-md object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <span className="text-center font-medium">दुकान की फ़ोटो ({photos.length})</span>
                  <Button type="button" size="sm" variant="outline" className="h-7 w-full text-[11px]" onClick={() => photoRef.current?.click()}>फ़ाइल चुनें</Button>
                </div>
              </div>

              <input ref={gstRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e, "gst", setGstUrl)} />
              <input ref={foodRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e, "fssai", setFoodUrl)} />
              <input ref={aadhaarFrontRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "aadhaar-front", setAadhaarFrontUrl)} />
              <input ref={aadhaarBackRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "aadhaar-back", setAadhaarBackUrl)} />
              <input ref={panRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "pan", setPanUrl)} />
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e, "shop-photo", (url) => setPhotos((p) => [...p, url]))} />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void submit()} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                  रजिस्ट्रेशन जमा करें
                </Button>
                <Button variant="ghost" onClick={() => setMode("choose")}>← वापस</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------- Merchant dashboard ---------- */}
        {user && record && (
          <div className="space-y-4">
            <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Big Merchant ID</p>
                  <p className="font-mono text-xl font-bold">{record.big_merchant_id}</p>
                  <p className="font-hindi text-sm">{record.shop_name} · {record.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={active ? "default" : "secondary"}>
                    {active ? "Active Subscription" : record.subscription_status}
                  </Badge>
                  <Badge variant="outline">{record.status}</Badge>
                  {record.subscription_expires_at && (
                    <span className="text-xs text-muted-foreground">
                      वैध: {new Date(record.subscription_expires_at).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {!active && (
              <Card className="border-2 border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><IndianRupee className="h-5 w-5" /> सब्सक्रिप्शन सक्रिय करें</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-hindi text-sm text-muted-foreground">
                    ₹1500 मासिक भुगतान के बाद आपकी दुकान सबसे ऊपर दिखेगी और प्रीमियम डैशबोर्ड अनलॉक होगा।
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="lg" disabled={paying} onClick={() => void pay("monthly")}>
                      {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                      ₹1500 / माह भुगतान करें
                    </Button>
                    <Button size="lg" variant="outline" disabled={paying} onClick={() => void pay("yearly")}>
                      ₹15000 / वर्ष
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {active && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><LayoutDashboard className="h-5 w-5" /> Premium Business Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Listing Priority</p>
                      <p className="text-lg font-bold text-amber-600">#1 Top Rank</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Plan</p>
                      <p className="text-lg font-bold">{record.subscription_plan === "yearly" ? "₹15000 / वर्ष" : "₹1500 / माह"}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">GST</p>
                      <p className="font-mono text-sm font-semibold">{record.gst_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate("/merchant-dashboard")}><Store className="mr-2 h-4 w-4" /> प्रोडक्ट व ऑर्डर मैनेज करें</Button>
                    <Button variant="outline" onClick={() => navigate("/merchant")}>दुकान की जानकारी अपडेट करें</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {record.admin_notes ? (
              <Card><CardContent className="p-4 text-sm"><span className="font-semibold">Admin note: </span>{record.admin_notes}</CardContent></Card>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

export default BigMerchantPortal;
