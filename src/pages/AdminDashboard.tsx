/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { sampleShops, Shop, categoryIcons } from "@/data/sampleShops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheck, ShieldX, Bell, CheckCircle2, IndianRupee, Users, Clock,
  BadgeCheck, MessageCircle, Send, XCircle, AlertTriangle, Crown,
  Download, CalendarPlus, LogOut, Search, Heart, Eye, FileText, ZoomIn, Trash2,
  Phone, MapPin, Siren, Store, BriefcaseBusiness, GraduationCap, Package, Settings, LockKeyhole, Brain, ShoppingBag, Home, UserCheck, ShieldAlert
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { bookCategories } from "@/data/skillBooks";
import RaktadanReviewTab from "@/components/admin/RaktadanReviewTab";

const ADMIN_PIN = "02032026";
const ADMIN_PIN_SESSION_KEY = "mbd-admin-pin-ok";

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

interface ComplaintRecord {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  complaint_text: string;
  status: string;
  is_read: boolean;
  created_at: string;
}

interface CustomerRecord {
  id: string;
  email: string | null;
  phone: string | null;
  provider: string | null;
  created_at: string;
  display_name?: string | null;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
}

interface SosAlertRecord {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  message: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  user_name?: string | null;
  user_phone?: string | null;
  user_email?: string | null;
}

interface MatrimonyRecord {
  id: string;
  user_id: string;
  name: string;
  gender: string;
  city: string;
  subscription_plan: string | null;
  is_published: boolean;
  photos: string[];
  created_at: string;
  profile_email?: string | null;
  profile_phone?: string | null;
}

interface MerchantRecord {
  id: string;
  user_id: string;
  shop_name: string;
  category: string | null;
  city: string | null;
  is_verified: boolean | null;
  owner_name: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  aadhaar_last4: string | null;
  access_status: string;
  suspension_reason: string | null;
  plan_override: string | null;
  plan_ends_at: string | null;
  created_at: string;
  profile_email?: string | null;
  profile_phone?: string | null;
  profile_name?: string | null;
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

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const AdminDashboard = () => {
  const { settings, refresh: refreshSettings } = useSiteSettings();
  const { user } = useAuth();
  const [shops, setShops] = useState<(Shop & { premiumStartDate?: string; premiumPlan?: "monthly" | "yearly"; joinDate?: string })[]>(
    sampleShops.map((s, i) => ({
      ...s,
      premium: i < 3,
      premiumStartDate: i < 3 ? "2026-02-15" : undefined,
      premiumPlan: i < 3 ? (i === 0 ? "monthly" as const : "yearly" as const) : undefined,
      joinDate: `2026-0${Math.min(i + 1, 3)}-${String(10 + i).padStart(2, "0")}`,
    }))
  );
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem(ADMIN_PIN_SESSION_KEY) === "true");
  const [pin, setPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTarget, setMessageTarget] = useState("all");
  const [messageRecipientId, setMessageRecipientId] = useState("");
  const [messageTitle, setMessageTitle] = useState("Important update from MBD Business Hub");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [sosAlerts, setSosAlerts] = useState<SosAlertRecord[]>([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [classifieds, setClassifieds] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [skillAdmissions, setSkillAdmissions] = useState<any[]>([]);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("दुकानदार अपनी बिक्री कैसे बढ़ा सकता है?");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Matrimony states
  const [matrimonyProfiles, setMatrimonyProfiles] = useState<MatrimonyRecord[]>([]);
  const [matrimonyLoading, setMatrimonyLoading] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notificationsClearedAt, setNotificationsClearedAt] = useState<string | null>(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const [payments, setPayments] = useState<MerchantPayment[]>([
    { shopId: "1", shopName: "Sharma General Store", plan: "monthly", amount: 1, transactionId: "TXN001234", date: "2026-03-08", approved: false, screenshotUrl: "screenshot1.png" },
    { shopId: "3", shopName: "Patel Electronics", plan: "yearly", amount: 12, transactionId: "TXN009876", date: "2026-03-09", approved: false, screenshotUrl: "screenshot2.png" },
    { shopId: "6", shopName: "Bhojanshala Restaurant", plan: "yearly", amount: 12, transactionId: "TXN005678", date: "2026-03-07", approved: true },
    { shopId: "2", shopName: "Gupta Cloth House", plan: "monthly", amount: 1, transactionId: "TXN004321", date: "2026-03-06", approved: true },
  ]);

  useEffect(() => {
    if (!loggedIn) return;

    const loadCustomers = async () => {
      setCustomersLoading(true);
      // Only show users with a verified, paid membership in the admin directory
      const today = new Date().toISOString().split("T")[0];
      const { data: paidMemberships } = await supabase
        .from("memberships")
        .select("user_id, transaction_id, amount, status, ends_at")
        .in("status", ["approved", "active"])
        .gte("ends_at", today);
      const paidUserIds = Array.from(
        new Set(
          (paidMemberships ?? [])
            .filter((m) => typeof m.transaction_id === "string" && m.transaction_id.trim().length > 0 && Number(m.amount) >= 10)
            .map((m) => m.user_id),
        ),
      );
      if (paidUserIds.length === 0) {
        setCustomers([]);
        setCustomersLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, phone, provider, created_at, display_name, phone_verified, phone_verified_at")
        .in("id", paidUserIds)
        .order("created_at", { ascending: false });
      if (error) { toast.error("Customer Directory लोड नहीं हो सका"); setCustomers([]); }
      else setCustomers(data ?? []);
      setCustomersLoading(false);
    };

    const loadSos = async () => {
      setSosLoading(true);
      const { data } = await supabase
        .from("sos_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) {
        const userIds = [...new Set(data.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, phone, display_name")
          .in("id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        setSosAlerts(data.map((s: any) => ({
          ...s,
          user_name: profileMap.get(s.user_id)?.display_name,
          user_phone: profileMap.get(s.user_id)?.phone,
          user_email: profileMap.get(s.user_id)?.email,
        })));
      }
      setSosLoading(false);
    };

    const loadMatrimony = async () => {
      setMatrimonyLoading(true);
      const { data } = await supabase
        .from("matrimony_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, phone")
          .in("id", userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        setMatrimonyProfiles(data.map(m => ({
          ...m,
          photos: (m.photos ?? []) as string[],
          profile_email: profileMap.get(m.user_id)?.email,
          profile_phone: profileMap.get(m.user_id)?.phone,
        })) as MatrimonyRecord[]);
      }
      setMatrimonyLoading(false);
    };

    const loadComplaints = async () => {
      setComplaintsLoading(true);
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { toast.error("Complaints load failed"); setComplaints([]); }
      else setComplaints((data ?? []) as ComplaintRecord[]);
      setComplaintsLoading(false);
    };

    const loadMerchants = async () => {
      setMerchantsLoading(true);
      const { data } = await supabase
        .from("merchant_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, phone, display_name")
          .in("id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        setMerchants(data.map(m => ({
          ...m,
          profile_email: profileMap.get(m.user_id)?.email,
          profile_phone: profileMap.get(m.user_id)?.phone,
          profile_name: profileMap.get(m.user_id)?.display_name,
        })) as MerchantRecord[]);
      }
      setMerchantsLoading(false);
    };

    void loadCustomers();
    void loadMatrimony();
    void loadComplaints();
    void loadMerchants();
    const loadCommandCenter = async () => {
      setModuleLoading(true);
      const [classifiedsRes, jobsRes, applicationsRes, productsRes, familyRes, skillRes, contactsRes] = await Promise.all([
        (supabase as any).from("classifieds").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("jobs").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("job_applications").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("products").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("family_members").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("skill_admissions").select("*").order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("contact_requests").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      setClassifieds(classifiedsRes.data ?? []);
      setJobs(jobsRes.data ?? []);
      setJobApplications(applicationsRes.data ?? []);
      setProducts(productsRes.data ?? []);
      setFamilyMembers(familyRes.data ?? []);
      setSkillAdmissions(skillRes.data ?? []);
      setContactRequests(contactsRes.data ?? []);
      setModuleLoading(false);
    };

    void loadSos();
    void loadCommandCenter();

    // Realtime subscription for new payments & merchant submissions
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'merchant_profiles' },
        () => {
          toast.info("🔔 नया दुकान रजिस्ट्रेशन आया है!", { duration: 8000 });
          void loadMerchants();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matrimony_profiles' },
        () => {
          toast.info("🔔 नया जीवनसाथी प्रोफ़ाइल आया है!", { duration: 8000 });
          void loadMatrimony();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        async (payload) => {
          const newAlert = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, phone, email")
            .eq("id", newAlert.user_id)
            .maybeSingle();
          const enriched: SosAlertRecord = {
            ...newAlert,
            user_name: profile?.display_name,
            user_phone: profile?.phone,
            user_email: profile?.email,
          };
          setSosAlerts(prev => [enriched, ...prev]);
          toast.error(
            `🚨 SOS! ${profile?.display_name || profile?.phone || "User"} ने मदद माँगी है!`,
            { duration: 15000 }
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as any;
          setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const newUser = payload.new as CustomerRecord;
          setCustomers(prev => [newUser, ...prev.filter(c => c.id !== newUser.id)]);
          toast.info(`👤 नया यूज़र साइनअप: ${newUser.email || newUser.phone || "Unknown"}`, { duration: 6000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'merchant_profiles' },
        (payload) => {
          const updated = payload.new as any;
          setMerchants(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaints' },
        (payload) => {
          const newComplaint = payload.new as ComplaintRecord;
          setComplaints(prev => [newComplaint, ...prev]);
          toast.warning(`📣 नई शिकायत: ${newComplaint.user_name || "Anonymous"}`, { duration: 8000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'complaints' },
        (payload) => {
          const updated = payload.new as ComplaintRecord;
          setComplaints(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classifieds' }, () => void loadCommandCenter())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => void loadCommandCenter())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void loadCommandCenter())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, () => void loadCommandCenter())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skill_admissions' }, () => void loadCommandCenter())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loggedIn]);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, "true");
      setLoggedIn(true);
      toast.success("Admin access granted");
    }
    else toast.error("Invalid PIN");
  };

  const handleLogout = () => { sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY); setLoggedIn(false); setPin(""); toast.info("Logged out successfully"); };

  const toggleVerification = (id: string) => {
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s)));
    const shop = shops.find((s) => s.id === id);
    toast.success(shop && !shop.verified ? "✅ Business Verified!" : "Verification revoked.");
  };

  const approvePayment = (txnId: string) => {
    const payment = payments.find((p) => p.transactionId === txnId);
    if (payment) {
      setPayments((prev) => prev.map((p) => (p.transactionId === txnId ? { ...p, approved: true, rejected: false } : p)));
      setShops((prev) => prev.map((s) => s.id === payment.shopId ? { ...s, verified: true, premium: true, premiumStartDate: new Date().toISOString().split("T")[0], premiumPlan: payment.plan } : s));
    }
    toast.success("✅ Payment approved. Premium + Verified badge activated.");
  };

  const rejectPayment = (txnId: string) => {
    const reason = rejectReasonMap[txnId]?.trim();
    if (!reason) { toast.error("कृपया अस्वीकृति का कारण दें"); setShowRejectInput(txnId); return; }
    setPayments((prev) => prev.map((p) => (p.transactionId === txnId ? { ...p, rejected: true, approved: false, rejectReason: reason } : p)));
    setShowRejectInput(null);
    toast.error(`❌ Payment rejected: ${reason}`);
  };

  const sendPremiumOffer = (shopName: string) => toast.success(`📩 Premium offer sent to ${shopName}!`);
  const removeShop = (id: string) => { setShops((prev) => prev.filter((s) => s.id !== id)); toast.success("Shop removed"); };

  const extendPremium = (id: string) => {
    setShops((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const currentStart = s.premiumStartDate ? new Date(s.premiumStartDate) : new Date();
      const plan = s.premiumPlan || "monthly";
      const duration = plan === "monthly" ? 30 : 365;
      const currentExpiry = new Date(currentStart.getTime() + duration * 24 * 60 * 60 * 1000);
      const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
      const newStart = new Date(newExpiry.getTime() - (duration - 30) * 24 * 60 * 60 * 1000);
      return { ...s, premiumStartDate: plan === "monthly" ? new Date(newExpiry.getTime()).toISOString().split("T")[0] : newStart.toISOString().split("T")[0] };
    }));
    toast.success("✅ Premium extended by 30 days!");
  };

  // Verify & Publish Matrimony Profile
  const publishMatrimony = async (profileId: string) => {
    const { error } = await supabase
      .from("matrimony_profiles")
      .update({ is_published: true })
      .eq("id", profileId);
    
    if (error) { toast.error("Publish failed"); return; }
    
    setMatrimonyProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_published: true } : p));
    toast.success("✅ Matrimony profile published!");
  };

  const updateMerchant = async (merchantId: string, patch: Partial<MerchantRecord>) => {
    const { error } = await supabase.from("merchant_profiles").update(patch).eq("id", merchantId);
    if (error) { toast.error("Merchant update failed"); return; }
    setMerchants(prev => prev.map(m => m.id === merchantId ? { ...m, ...patch } : m));
    toast.success("Merchant control updated");
  };

  const setMerchantSubscription = async (merchantId: string, plan: "monthly" | "yearly" | "none") => {
    await updateMerchant(merchantId, {
      is_premium: plan !== "none",
      premium_plan: plan === "none" ? null : plan,
      premium_start_date: plan === "none" ? null : new Date().toISOString(),
      plan_override: plan === "none" ? "" : plan,
      plan_ends_at: plan === "yearly" ? new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] : plan === "monthly" ? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] : null,
    } as any);
  };

  const updateMatrimonyStatus = async (profileId: string, moderation_status: string, is_published: boolean) => {
    const { error } = await (supabase as any).from("matrimony_profiles").update({ moderation_status, is_published }).eq("id", profileId);
    if (error) { toast.error("Matrimony update failed"); return; }
    setMatrimonyProfiles(prev => prev.map(p => p.id === profileId ? { ...p, moderation_status, is_published } as any : p));
    toast.success(`Matrimony profile ${moderation_status}`);
  };

  const updateFamilyStatus = async (memberId: string, admin_status: string) => {
    const { error } = await (supabase as any).from("family_members").update({ admin_status }).eq("id", memberId);
    if (error) { toast.error("Bharat Kavach update failed"); return; }
    setFamilyMembers(prev => prev.map(f => f.id === memberId ? { ...f, admin_status } : f));
    toast.success(`Family member ${admin_status}`);
  };

  const sendAdminMessage = async () => {
    if (!user?.id) { toast.error("Please sign in before sending admin messages"); return; }
    if (!messageTitle.trim() || !messageBody.trim()) { toast.error("Message title and body are required"); return; }
    if (messageTarget === "specific" && !messageRecipientId) { toast.error("Select a specific user first"); return; }
    setMessageSending(true);
    const { error } = await (supabase as any).from("admin_messages").insert({
      sender_id: user?.id,
      recipient_user_id: messageTarget === "specific" ? messageRecipientId : null,
      recipient_group: messageTarget,
      title: messageTitle.trim(),
      message: messageBody.trim(),
      severity: "info",
    });
    setMessageSending(false);
    if (error) { toast.error("Message could not be sent"); return; }
    setMessageBody("");
    toast.success("Admin message sent live");
  };

  const updateSiteSettings = async (patch: Partial<typeof settings>) => {
    if (!settings.id) return;
    const { error } = await supabase.from("site_settings").update(patch).eq("id", settings.id);
    if (error) { toast.error("Settings update failed"); return; }
    await refreshSettings();
    toast.success("Admin Portal settings updated");
  };

  const downloadCSV = () => {
    const headers = ["Shop Name", "Owner", "Category", "City", "Phone", "Verified", "Access", "Plan", "Plan Ends"];
    const rows = filteredMerchants.map((s) => [s.shop_name, s.owner_name || s.profile_name || "", s.category || "", s.city || "", s.phone || s.whatsapp || s.profile_phone || "", s.is_verified ? "Yes" : "No", s.access_status, s.plan_override || "Free", s.plan_ends_at || "N/A"]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `bharat-dukaan-merchants-${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("📥 CSV downloaded!");
  };

  const freeShops = useMemo(() => {
    const list = shops.filter((s) => !s.premium);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q) || s.nameHindi.includes(q) || s.category.toLowerCase().includes(q));
  }, [shops, searchQuery]);

  const premiumShops = useMemo(() => {
    const list = shops.filter((s) => s.premium);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q) || s.nameHindi.includes(q));
  }, [shops, searchQuery]);

  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return merchants;
    const q = searchQuery.toLowerCase();
    return merchants.filter((m) => [m.shop_name, m.owner_name, m.profile_name, m.category, m.city, m.phone, m.whatsapp, m.profile_email].some((v) => (v || "").toLowerCase().includes(q)));
  }, [merchants, searchQuery]);

  const verifiedCount = merchants.filter((s) => s.is_verified).length;
  const premiumMerchantCount = merchants.filter((s) => s.plan_override || (s as any).is_premium).length;
  const pendingPayments = payments.filter((p) => !p.approved && !p.rejected);
  const monthlyEarnings = payments.filter((p) => p.approved && p.plan === "monthly").reduce((sum, p) => sum + p.amount, 0);
  const yearlyEarnings = payments.filter((p) => p.approved && p.plan === "yearly").reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = monthlyEarnings + yearlyEarnings;
  const unpublishedMatrimony = matrimonyProfiles.filter(p => !p.is_published);
  const unreadComplaints = complaints.filter(c => !c.is_read);

  const toggleComplaintRead = async (complaintId: string, currentRead: boolean) => {
    const { error } = await supabase
      .from("complaints")
      .update({ is_read: !currentRead } as any)
      .eq("id", complaintId);
    if (error) { toast.error("Update failed"); return; }
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, is_read: !currentRead } : c));
    toast.success(!currentRead ? "✅ पढ़ा गया" : "🔴 अपठित");
  };

  const verifyUserPhone = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) { toast.error("Verification failed"); return; }
    setCustomers(prev => prev.map(c => c.id === userId ? { ...c, phone_verified: true, phone_verified_at: new Date().toISOString() } : c));
    toast.success("✅ User WhatsApp/Phone verified!");
  };

  const unverifyUserPhone = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ phone_verified: false, phone_verified_at: null })
      .eq("id", userId);
    if (error) { toast.error("Update failed"); return; }
    setCustomers(prev => prev.map(c => c.id === userId ? { ...c, phone_verified: false, phone_verified_at: null } : c));
    toast.info("Verification revoked.");
  };

  const resolveSosAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("sos_alerts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", alertId);
    if (error) { toast.error("Could not resolve"); return; }
    setSosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "resolved", resolved_at: new Date().toISOString() } : a));
    toast.success("✅ SOS marked as resolved.");
  };


  const updateModeration = async (table: "classifieds" | "jobs" | "products", id: string, moderation_status: string) => {
    const { error } = await (supabase as any).from(table).update({ moderation_status }).eq("id", id);
    if (error) { toast.error("Control update failed"); return; }
    const updater = (row: any) => row.id === id ? { ...row, moderation_status } : row;
    if (table === "classifieds") setClassifieds(prev => prev.map(updater));
    if (table === "jobs") setJobs(prev => prev.map(updater));
    if (table === "products") setProducts(prev => prev.map(updater));
    toast.success(`${moderation_status === "approved" ? "Approved" : "Suspended"} successfully`);
  };

  const updateApplication = async (table: "job_applications" | "skill_admissions", id: string, status: string) => {
    const { error } = await (supabase as any).from(table).update({ status }).eq("id", id);
    if (error) { toast.error("Status update failed"); return; }
    if (table === "job_applications") setJobApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (table === "skill_admissions") setSkillAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Status changed to ${status}`);
  };

  const testBharatMitra = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    const { data, error } = await supabase.functions.invoke("bharat-mitra-chat", {
      body: { message: aiQuestion, history: [], stream: false },
    });
    if (error) toast.error("Bharat Mitra AI test failed");
    else setAiAnswer(data?.reply || data?.response || "AI response received, but no text body was returned.");
    setAiLoading(false);
  };

  const navItems = [
    { id: "overview", label: "Command Center", icon: Home, count: customers.length },
    { id: "control", label: "Shops & Users", icon: Users, count: merchants.length },
    { id: "preview", label: "System Preview", icon: Eye, count: classifieds.length + jobs.length + products.length },
    { id: "classifieds-preview", label: "पुराने सामान", icon: ShoppingBag, count: classifieds.length },
    { id: "matrimony", label: "मैरिज ब्यूरो", icon: Heart, count: matrimonyProfiles.length },
    { id: "jobs-preview", label: "नौकरी / Jobs", icon: BriefcaseBusiness, count: jobs.length },
    { id: "hyperlocal-preview", label: "नजदीकी दुकान", icon: Store, count: merchants.length },
    { id: "skill-preview", label: "कौशल विकास", icon: GraduationCap, count: skillAdmissions.length },
    { id: "family-preview", label: "भारत कवच", icon: ShieldAlert, count: familyMembers.length },
    { id: "inventory-preview", label: "मशाल Inventory", icon: Package, count: products.length },
    { id: "ai-preview", label: "भारत मित्र AI", icon: Brain, count: MOCK_CHATBOT_LOGS.length },
    { id: "messages", label: "Messages", icon: MessageCircle, count: 0 },
    { id: "settings", label: "Settings", icon: Settings, count: 0 },
  ];

  const getPremiumDaysLeft = (shop: Shop & { premiumStartDate?: string; premiumPlan?: "monthly" | "yearly" }) => {
    if (!shop.premiumStartDate || !shop.premiumPlan) return null;
    const start = new Date(shop.premiumStartDate);
    const duration = shop.premiumPlan === "monthly" ? 30 : 365;
    const expiry = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-primary/30 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><LockKeyhole className="h-6 w-6" /></div>
            <CardTitle>Staff System PIN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter secure PIN" autoFocus />
            <Button className="w-full" onClick={handleLogin}>Unlock Admin Portal</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-navy px-4 py-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">Bharat Dukaan - Management Portal</h1>
            <p className="font-hindi text-xs text-primary-foreground/70">भारत दुकान - प्रबंधन पोर्टल</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu open={notifDropdownOpen} onOpenChange={setNotifDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className="relative focus:outline-none">
                  <Bell className="h-5 w-5 text-primary-foreground" />
                  {(() => {
                    const cutoff = notificationsClearedAt;
                    const visibleCount =
                      pendingPayments.filter(p => !cutoff || p.date > cutoff).length +
                      pendingMemberships.filter(m => !cutoff || m.created_at > cutoff).length +
                      unpublishedMatrimony.filter(p => !cutoff || p.created_at > cutoff).length +
                      unreadComplaints.filter(c => !cutoff || c.created_at > cutoff).length +
                      merchants.filter(m => !m.is_verified && (!cutoff || m.created_at > cutoff)).length;
                    return visibleCount > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {visibleCount}
                      </span>
                    ) : null;
                  })()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>🔔 Notifications</span>
                  <button onClick={(e) => { e.stopPropagation(); setNotificationsClearedAt(new Date().toISOString()); toast.success("सभी नोटिफिकेशन साफ़ हो गई"); }} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                    <Trash2 className="h-3 w-3" /> Clear All
                  </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pendingMemberships.length > 0 && (
                  <DropdownMenuItem onClick={() => { setActiveTab("memberships"); setNotifDropdownOpen(false); }}>
                    <Crown className="mr-2 h-4 w-4 text-saffron" />
                    <span className="text-xs">{pendingMemberships.length} pending membership(s)</span>
                  </DropdownMenuItem>
                )}
                {merchants.filter(m => !m.is_verified).length > 0 && (
                  <DropdownMenuItem onClick={() => { setActiveTab("merchants"); setNotifDropdownOpen(false); }}>
                    <FileText className="mr-2 h-4 w-4 text-navy" />
                    <span className="text-xs">{merchants.filter(m => !m.is_verified).length} merchant KYC pending</span>
                  </DropdownMenuItem>
                )}
                {unpublishedMatrimony.length > 0 && (
                  <DropdownMenuItem onClick={() => { setActiveTab("matrimony"); setNotifDropdownOpen(false); }}>
                    <Heart className="mr-2 h-4 w-4 text-[hsl(340,80%,50%)]" />
                    <span className="text-xs">{unpublishedMatrimony.length} matrimony profile(s) pending</span>
                  </DropdownMenuItem>
                )}
                {unreadComplaints.length > 0 && (
                  <DropdownMenuItem onClick={() => { setActiveTab("complaints"); setNotifDropdownOpen(false); }}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                    <span className="text-xs">{unreadComplaints.length} unread complaint(s)</span>
                  </DropdownMenuItem>
                )}
                {pendingPayments.length > 0 && (
                  <DropdownMenuItem onClick={() => { setActiveTab("premium"); setNotifDropdownOpen(false); }}>
                    <IndianRupee className="mr-2 h-4 w-4 text-green-india" />
                    <span className="text-xs">{pendingPayments.length} payment(s) pending</span>
                  </DropdownMenuItem>
                )}
                {(pendingPayments.length + pendingMemberships.length + unpublishedMatrimony.length + unreadComplaints.length + merchants.filter(m => !m.is_verified).length) === 0 && (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">No new notifications</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="sticky top-[64px] hidden h-[calc(100vh-64px)] w-72 shrink-0 overflow-y-auto border-r bg-card p-3 lg:block">
          <div className="mb-3 px-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Admin Portal</p>
            <p className="font-hindi text-sm font-semibold text-foreground">Full Command Center</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count > 0 && <Badge variant={active ? "secondary" : "outline"} className="ml-2 text-[10px]">{item.count}</Badge>}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-6">
          <Card className="bg-navy text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-7 w-7 opacity-80" />
              <div><p className="text-2xl font-extrabold">{merchants.length}</p><p className="text-[10px] opacity-70">Total / कुल दुकानें</p></div>
            </CardContent>
          </Card>
          <Card className="bg-green-india text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <BadgeCheck className="h-7 w-7 opacity-80" />
              <div><p className="text-2xl font-extrabold">{verifiedCount}</p><p className="text-[10px] opacity-70">Verified / सत्यापित</p></div>
            </CardContent>
          </Card>
          <Card className="bg-saffron text-primary-foreground">
            <CardContent className="flex items-center gap-3 p-4">
              <Crown className="h-7 w-7 opacity-80" />
              <div><p className="text-2xl font-extrabold">{premiumMerchantCount}</p><p className="text-[10px] opacity-70">Premium / प्रीमियम</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent">
            <CardContent className="flex items-center gap-3 p-4">
              <Bell className="h-7 w-7 text-accent" />
              <div><p className="text-2xl font-extrabold text-accent">{pendingMemberships.length}</p><p className="text-[10px] text-muted-foreground">Membership Pending</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[hsl(340,80%,50%)]">
            <CardContent className="flex items-center gap-3 p-4">
              <Heart className="h-7 w-7 text-[hsl(340,80%,50%)]" />
              <div><p className="text-2xl font-extrabold text-[hsl(340,80%,50%)]">{unpublishedMatrimony.length}</p><p className="text-[10px] text-muted-foreground">Matrimony Pending</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-india">
            <CardContent className="flex items-center gap-3 p-4">
              <IndianRupee className="h-7 w-7 text-green-india" />
              <div><p className="text-2xl font-extrabold text-green-india">₹{totalEarnings.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Merchant Earnings</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search shops... (दुकान खोजें)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={downloadCSV} variant="outline" size="sm" className="border-navy text-navy hover:bg-navy hover:text-primary-foreground">
            <Download className="mr-1 h-4 w-4" /> Download CSV
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4 w-full flex-wrap h-auto gap-1 lg:hidden">
            <TabsTrigger value="overview" className="text-xs">🏠 Overview</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">👁️ Preview</TabsTrigger>
            <TabsTrigger value="classifieds-preview" className="text-xs">पुराने सामान</TabsTrigger>
            <TabsTrigger value="jobs-preview" className="text-xs">Jobs</TabsTrigger>
            <TabsTrigger value="hyperlocal-preview" className="text-xs">Shops</TabsTrigger>
            <TabsTrigger value="skill-preview" className="text-xs">Skill</TabsTrigger>
            <TabsTrigger value="family-preview" className="text-xs">कवच</TabsTrigger>
            <TabsTrigger value="inventory-preview" className="text-xs">Inventory</TabsTrigger>
            <TabsTrigger value="ai-preview" className="text-xs">AI</TabsTrigger>
            <TabsTrigger value="memberships" className="text-xs">🏅 भारत गौरव ({pendingMemberships.length})</TabsTrigger>
            <TabsTrigger value="matrimony" className="text-xs">💕 जीवनसाथी ({unpublishedMatrimony.length})</TabsTrigger>
            <TabsTrigger value="merchants" className="text-xs relative">
              🏪 Merchants
              {merchants.filter(m => !m.is_verified).length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {merchants.filter(m => !m.is_verified).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="free" className="text-xs">🆓 Free Shops</TabsTrigger>
            <TabsTrigger value="premium" className="text-xs">⭐ Premium</TabsTrigger>
            <TabsTrigger value="complaints" className="text-xs relative">
              📢 शिकायतें
              {unreadComplaints.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadComplaints.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="raktadan" className="text-xs">🩸 रक्तदान</TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs relative">
              📱 WhatsApp
              {customers.filter(c => !c.phone_verified && c.phone).length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {customers.filter(c => !c.phone_verified && c.phone).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sos" className="text-xs relative">
              🚨 SOS
              {sosAlerts.filter(a => a.status === "active").length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                  {sosAlerts.filter(a => a.status === "active").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs">💬 Messages</TabsTrigger>
            <TabsTrigger value="slider" className="text-xs">🎠 Slider</TabsTrigger>
            <TabsTrigger value="control" className="text-xs">🛂 Shops & Users</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">👁️ System Preview</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="bg-primary/5 border-b"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Live Command Center</CardTitle></CardHeader>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[{ label: "Total families in Kavach", value: familyMembers.length, icon: ShieldAlert }, { label: "Active Jobs", value: jobs.filter(j => j.is_active !== false && j.moderation_status !== "suspended").length, icon: BriefcaseBusiness }, { label: "New Skill Admissions", value: skillAdmissions.filter(a => a.status === "pending").length, icon: GraduationCap }, { label: "Merchant Products", value: products.length, icon: Package }, { label: "Second-hand Listings", value: classifieds.length, icon: ShoppingBag }, { label: "Local Shops", value: merchants.length, icon: Store }].map((stat) => {
                    const Icon = stat.icon;
                    return <div key={stat.label} className="rounded-lg border bg-card p-4"><Icon className="mb-2 h-5 w-5 text-primary" /><p className="text-2xl font-extrabold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>;
                  })}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="bg-destructive/5 border-b"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Quality Queue</CardTitle></CardHeader>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex justify-between"><span>Pending memberships</span><Badge>{pendingMemberships.length}</Badge></div>
                  <div className="flex justify-between"><span>Unpublished profiles</span><Badge>{unpublishedMatrimony.length}</Badge></div>
                  <div className="flex justify-between"><span>Merchant KYC pending</span><Badge>{merchants.filter(m => !m.is_verified).length}</Badge></div>
                  <div className="flex justify-between"><span>Unread complaints</span><Badge variant="destructive">{unreadComplaints.length}</Badge></div>
                  <div className="flex justify-between"><span>Active SOS alerts</span><Badge variant="destructive">{sosAlerts.filter(a => a.status === "active").length}</Badge></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="control">
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Shops & Users Control Center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {merchantsLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p> : filteredMerchants.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-4">
                    <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr] lg:items-center">
                      <div>
                        <p className="font-semibold text-foreground">{m.shop_name || "Unnamed shop"}</p>
                        <p className="text-xs text-muted-foreground">Owner: {m.owner_name || m.profile_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Contact: {m.phone || m.whatsapp || m.profile_phone || m.profile_email || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Aadhaar last-4: {m.aadhaar_last4 || "N/A"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => updateMerchant(m.id, { is_verified: true, access_status: "active", admin_notes: "Approved by Admin Portal" } as any)}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => updateMerchant(m.id, { is_verified: false, access_status: "rejected", admin_notes: "Rejected by Admin Portal" } as any)}>Reject</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateMerchant(m.id, { access_status: "suspended", suspension_reason: "Suspended by Admin Portal" })}>Suspend</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateMerchant(m.id, { access_status: "cancelled", is_verified: false, is_premium: false, premium_plan: null, plan_override: "", plan_ends_at: null } as any)}>Cancel</Button>
                        <Switch checked={m.access_status !== "suspended"} onCheckedChange={(checked) => updateMerchant(m.id, { access_status: checked ? "active" : "suspended", suspension_reason: checked ? "" : "Suspended by Admin Portal" })} />
                        <Badge variant={["suspended", "rejected", "cancelled"].includes(m.access_status) ? "destructive" : "secondary"}>{m.access_status || "active"}</Badge>
                      </div>
                      <Select value={m.plan_override || "none"} onValueChange={(value) => setMerchantSubscription(m.id, value as "monthly" | "yearly" | "none")}>
                        <SelectTrigger><SelectValue placeholder="Set plan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No override</SelectItem>
                          <SelectItem value="monthly">Premium Monthly ₹99</SelectItem>
                          <SelectItem value="yearly">Premium Yearly ₹999</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader className="bg-accent/5 border-b"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-5 w-5 text-accent" /> System Preview — Live Inspection</CardTitle></CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                {navItems.filter(i => i.id.endsWith("preview") || i.id === "ai-preview").map((item) => {
                  const Icon = item.icon;
                  return <button key={item.id} onClick={() => setActiveTab(item.id)} className="rounded-lg border bg-card p-4 text-left hover:bg-muted/50"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="font-semibold text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.count} live records</p></button>;
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classifieds-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> पुराने सामान — Buy/Sell Listings</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Listing</TableHead><TableHead>City</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Controls</TableHead></TableRow></TableHeader><TableBody>{moduleLoading ? <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow> : classifieds.map((c) => <TableRow key={c.id}><TableCell><p className="font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{c.category} • {c.condition}</p></TableCell><TableCell>{c.city || "—"}</TableCell><TableCell>₹{Number(c.price || 0).toLocaleString()}</TableCell><TableCell><Badge variant={["suspended", "rejected", "cancelled"].includes(c.moderation_status) ? "destructive" : "secondary"}>{c.moderation_status}</Badge></TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="outline" onClick={() => updateModeration("classifieds", c.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateModeration("classifieds", c.id, "rejected")}>Reject</Button><Button size="sm" variant="destructive" onClick={() => updateModeration("classifieds", c.id, "suspended")}>Suspend</Button><Button size="sm" variant="secondary" onClick={() => updateModeration("classifieds", c.id, "cancelled")}>Cancel</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </TabsContent>

          <TabsContent value="jobs-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-primary" /> नौकरी / Jobs — Posts & Applicants</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><div className="grid gap-3 lg:grid-cols-2">{jobs.map((j) => <div key={j.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><div><p className="font-semibold">{j.title}</p><p className="text-xs text-muted-foreground">{j.company_name} • {j.city} • {j.salary_range}</p></div><Badge variant={["suspended", "rejected", "cancelled"].includes(j.moderation_status) ? "destructive" : "secondary"}>{j.moderation_status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateModeration("jobs", j.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateModeration("jobs", j.id, "rejected")}>Reject</Button><Button size="sm" variant="destructive" onClick={() => updateModeration("jobs", j.id, "suspended")}>Suspend</Button><Button size="sm" variant="secondary" onClick={() => updateModeration("jobs", j.id, "cancelled")}>Cancel</Button></div></div>)}</div><div className="border-t pt-3"><p className="mb-2 text-sm font-semibold">Applicant Data</p>{jobApplications.length === 0 ? <p className="text-sm text-muted-foreground">No applicants yet.</p> : jobApplications.map((a) => <div key={a.id} className="mb-2 flex items-center justify-between rounded border p-2 text-sm"><span>{a.applicant_name || "Applicant"} • {a.applicant_phone || "No phone"}</span><span><Button size="sm" variant="outline" onClick={() => updateApplication("job_applications", a.id, "approved")}>Approve</Button><Button size="sm" variant="destructive" className="ml-1" onClick={() => updateApplication("job_applications", a.id, "rejected")}>Reject</Button></span></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="hyperlocal-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> नजदीकी दुकान — Live Shops</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 lg:grid-cols-2">{filteredMerchants.map((m) => <div key={m.id} className="rounded-lg border p-3"><div className="flex items-start justify-between"><div><p className="font-semibold">{m.shop_name}</p><p className="text-xs text-muted-foreground">{m.category} • {m.city || "No city"} • {m.address || "No address"}</p></div><Badge variant={["suspended", "rejected", "cancelled"].includes(m.access_status) ? "destructive" : "secondary"}>{m.access_status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateMerchant(m.id, { is_verified: true, access_status: "active" })}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateMerchant(m.id, { is_verified: false, access_status: "rejected" } as any)}>Reject</Button><Button size="sm" variant="destructive" onClick={() => updateMerchant(m.id, { access_status: "suspended", suspension_reason: "Quality control suspension" })}>Suspend</Button><Button size="sm" variant="secondary" onClick={() => updateMerchant(m.id, { access_status: "cancelled", is_verified: false } as any)}>Cancel</Button></div></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="skill-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> कौशल विकास — Admissions & Courses</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{bookCategories.slice(0, 8).map(c => <div key={c.id} className="rounded border p-3"><p className="font-semibold text-sm">{c.icon} {c.title}</p><p className="text-xs text-muted-foreground">{c.pdfLibrary.length} course PDFs</p></div>)}</div><div className="border-t pt-3">{skillAdmissions.length === 0 ? <p className="text-sm text-muted-foreground">No admissions yet.</p> : skillAdmissions.map((a) => <div key={a.id} className="mb-2 flex items-center justify-between rounded border p-2 text-sm"><span>{a.student_name} • {a.course_name} • {a.city}</span><span><Button size="sm" onClick={() => updateApplication("skill_admissions", a.id, "approved")}>Approve</Button><Button size="sm" variant="destructive" className="ml-1" onClick={() => updateApplication("skill_admissions", a.id, "rejected")}>Reject</Button></span></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="family-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> भारत कवच — Family Security</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Controls</TableHead></TableRow></TableHeader><TableBody>{familyMembers.map((f) => <TableRow key={f.id}><TableCell>{f.member_name}</TableCell><TableCell>{f.member_phone}</TableCell><TableCell><Badge variant={["suspended", "rejected", "cancelled"].includes(f.admin_status) ? "destructive" : "secondary"}>{f.admin_status || f.status}</Badge></TableCell><TableCell>{formatDateTime(f.created_at)}</TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1"><Button size="sm" onClick={() => updateFamilyStatus(f.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateFamilyStatus(f.id, "rejected")}>Reject</Button><Button size="sm" variant="destructive" onClick={() => updateFamilyStatus(f.id, "suspended")}>Suspend</Button><Button size="sm" variant="secondary" onClick={() => updateFamilyStatus(f.id, "cancelled")}>Cancel</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </TabsContent>

          <TabsContent value="inventory-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> मशाल पोर्टल — Merchant Inventory</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 lg:grid-cols-2">{products.map((prod) => { const merchant = merchants.find(m => m.id === prod.merchant_id); return <div key={prod.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><div><p className="font-semibold">{prod.name}</p><p className="text-xs text-muted-foreground">{merchant?.shop_name || prod.merchant_id} • ₹{Number(prod.price || 0).toLocaleString()} • {prod.in_stock ? "In stock" : "Out of stock"}</p></div><Badge variant={["suspended", "rejected", "cancelled"].includes(prod.moderation_status) ? "destructive" : "secondary"}>{prod.moderation_status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateModeration("products", prod.id, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => updateModeration("products", prod.id, "rejected")}>Reject</Button><Button size="sm" variant="destructive" onClick={() => updateModeration("products", prod.id, "suspended")}>Suspend</Button><Button size="sm" variant="secondary" onClick={() => updateModeration("products", prod.id, "cancelled")}>Cancel</Button></div></div>; })}</CardContent></Card>
          </TabsContent>

          <TabsContent value="ai-preview">
            <Card><CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> भारत मित्र AI — Response Test Window</CardTitle></CardHeader><CardContent className="space-y-3 p-4"><Textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} className="min-h-24" /><Button onClick={testBharatMitra} disabled={aiLoading}>{aiLoading ? "Testing..." : "Test AI Response"}</Button>{aiAnswer && <div className="rounded-lg border bg-muted/40 p-4 font-hindi text-sm leading-relaxed">{aiAnswer}</div>}<div className="border-t pt-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">FAQ Analytics</p>{MOCK_CHATBOT_LOGS.map((log, i) => <div key={i} className="mb-1 flex justify-between rounded border px-3 py-2 text-xs"><span>{log.question}</span><Badge variant="secondary">{log.count}</Badge></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Admin Communication System</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={messageTarget} onValueChange={setMessageTarget}>
                    <SelectTrigger><SelectValue placeholder="Choose recipients" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="merchants">Merchant vendors</SelectItem>
                      <SelectItem value="customers">General public users</SelectItem>
                      <SelectItem value="specific">Specific user</SelectItem>
                    </SelectContent>
                  </Select>
                  {messageTarget === "specific" && (
                    <Select value={messageRecipientId} onValueChange={setMessageRecipientId}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {[...customers, ...merchants.map(m => ({ id: m.user_id, display_name: m.owner_name || m.shop_name, email: m.profile_email, phone: m.profile_phone || m.phone, provider: "merchant", created_at: m.created_at }))].map((u) => (
                          <SelectItem key={`${u.id}-${u.provider}`} value={u.id}>{u.display_name || u.email || u.phone || u.id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Input value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="Message title" />
                <Textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Write notification or alert..." className="min-h-28" />
                <Button onClick={sendAdminMessage} disabled={messageSending}>
                  <Send className="mr-2 h-4 w-4" /> {messageSending ? "Sending..." : "Send Live Message"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader className="bg-muted/40 border-b"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Global Site Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between rounded-lg border p-3"><span className="font-medium">Maintenance Mode</span><Switch checked={settings.maintenance_mode} onCheckedChange={(v) => updateSiteSettings({ maintenance_mode: v })} /></div>
                <div className="flex items-center justify-between rounded-lg border p-3"><span className="font-medium">New Merchant Registrations</span><Switch checked={settings.merchant_registrations_enabled} onCheckedChange={(v) => updateSiteSettings({ merchant_registrations_enabled: v })} /></div>
                <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Razorpay key reference" value={settings.razorpay_key_reference || ""} onChange={(e) => updateSiteSettings({ razorpay_key_reference: e.target.value })} /><Input placeholder="AI key reference" value={settings.ai_key_reference || ""} onChange={(e) => updateSiteSettings({ ai_key_reference: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2"><Input value={settings.merchant_area_label} onChange={(e) => updateSiteSettings({ merchant_area_label: e.target.value })} /><Input value={settings.admin_area_label} onChange={(e) => updateSiteSettings({ admin_area_label: e.target.value })} /></div>
                <Button variant="outline" onClick={() => updateSiteSettings({ admin_security_updated_at: new Date().toISOString() })}>Mark Admin Password / PIN Changed</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raktadan">
            <RaktadanReviewTab />
          </TabsContent>

          {/* BHARAT GAURAV MEMBERSHIP SECTION */}
          <TabsContent value="memberships">
            <Card>
              <CardHeader className="bg-accent/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" /> भारत गौरव मेंबरशिप Verification
                  <Badge variant="secondary">{pendingMemberships.length} Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {membershipsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : pendingMemberships.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">✅ No pending membership requests.</p>
                ) : (
                  pendingMemberships.map((m) => (
                    <div key={m.id} className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{m.profile_email || m.profile_phone || m.user_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.plan === "monthly" ? "₹10 मासिक" : "₹100 वार्षिक"} • TXN: <span className="font-mono">{m.transaction_id || "N/A"}</span> • {formatDateTime(m.created_at)}
                          </p>
                          {m.screenshot_url && (
                            <a href={m.screenshot_url} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-primary underline">
                              📎 View Screenshot
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveMembership(m.id)} className="bg-green-india hover:bg-green-india/90 text-primary-foreground h-8">
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectMembership(m.id)} className="h-8">
                            <XCircle className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Approved memberships */}
                {memberships.filter(m => m.status === "approved").length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs font-semibold text-green-india">✅ Recently Approved:</p>
                    {memberships.filter(m => m.status === "approved").slice(0, 10).map((m) => (
                      <div key={m.id} className="mb-1 rounded bg-green-india/5 px-3 py-2 text-xs flex items-center justify-between">
                        <span><span className="font-medium">{m.profile_email || m.profile_phone || "User"}</span> — {m.plan} plan • {formatDateTime(m.created_at)}</span>
                        <Badge className="bg-green-india text-primary-foreground text-[9px]">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MATRIMONY VERIFICATION SECTION */}
          <TabsContent value="matrimony">
            <Card>
              <CardHeader className="bg-[hsl(340,80%,50%)]/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[hsl(340,80%,50%)]" /> मेरा जीवनसाथी — Profile Verification
                  <Badge variant="secondary">{unpublishedMatrimony.length} Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {matrimonyLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : unpublishedMatrimony.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">✅ No pending matrimony profiles.</p>
                ) : (
                  unpublishedMatrimony.map((p) => (
                    <div key={p.id} className="rounded-lg border border-[hsl(340,80%,50%)]/30 bg-[hsl(340,80%,50%)]/5 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {p.photos?.[0] ? (
                              <img src={p.photos[0]} alt={p.name} className="h-12 w-12 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Heart className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{p.name} <Badge variant="secondary" className="text-[9px] ml-1">{p.gender}</Badge></p>
                              <p className="text-xs text-muted-foreground">{p.city} • {p.profile_email || p.profile_phone || "Contact N/A"}</p>
                              <p className="text-xs text-muted-foreground">Plan: {p.subscription_plan || "Not paid"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => updateMatrimonyStatus(p.id, "approved", true)} className="h-8">
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateMatrimonyStatus(p.id, "rejected", false)} className="h-8">Reject</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateMatrimonyStatus(p.id, "suspended", false)} className="h-8">Suspend</Button>
                            <Button size="sm" variant="secondary" onClick={() => updateMatrimonyStatus(p.id, "cancelled", false)} className="h-8">Cancel</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Published profiles */}
                {matrimonyProfiles.filter(p => p.is_published).length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs font-semibold text-green-india">✅ Published Profiles:</p>
                    {matrimonyProfiles.filter(p => p.is_published).slice(0, 10).map((p) => (
                      <div key={p.id} className="mb-1 rounded bg-green-india/5 px-3 py-2 text-xs flex items-center justify-between">
                        <span><span className="font-medium">{p.name}</span> — {p.gender}, {p.city}</span>
                        <Badge className="bg-green-india text-primary-foreground text-[9px]">Published</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MERCHANTS KYC VERIFICATION */}
          <TabsContent value="merchants">
            <Card>
              <CardHeader className="bg-saffron/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-saffron" /> Merchant KYC Verification
                  <Badge variant="secondary">{merchants.filter(m => !m.is_verified).length} Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {merchantsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : merchants.filter(m => !m.is_verified).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">✅ No pending merchant verifications.</p>
                ) : (
                  merchants.filter(m => !m.is_verified).map((m) => (
                    <div key={m.id} className="rounded-lg border border-saffron/30 bg-saffron/5 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{m.shop_name}</p>
                          <p className="text-xs text-muted-foreground">{m.category} • {m.city} • {m.profile_email || m.profile_phone || "Contact N/A"}</p>
                          <p className="text-[11px] text-muted-foreground">🕐 {formatDateTime(m.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Verified merchants */}
                {merchants.filter(m => m.is_verified).length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-xs font-semibold text-green-india">✅ Verified Merchants:</p>
                    {merchants.filter(m => m.is_verified).slice(0, 10).map((m) => (
                      <div key={m.id} className="mb-1 rounded bg-green-india/5 px-3 py-2 text-xs flex items-center justify-between">
                        <span><span className="font-medium">{m.shop_name}</span> — {m.category}, {m.city}</span>
                        <Badge className="bg-green-india text-primary-foreground text-[9px]">Verified</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FREE SHOPS */}
          <TabsContent value="free">
            <Card>
              <CardHeader className="bg-navy/5 border-b">
                <CardTitle className="text-base">Free Listings <span className="font-hindi text-sm font-normal text-muted-foreground">• मुफ्त उपयोगकर्ता</span></CardTitle>
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
                        <td className="px-3 py-3 text-xs text-muted-foreground">{categoryIcons[shop.category] || "🏪"} {shop.category}</td>
                        <td className="hidden sm:table-cell px-3 py-3 text-xs text-muted-foreground">{shop.city}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground">{shop.joinDate || "N/A"}</span>
                          <br /><span className="text-[10px] text-muted-foreground/60">{getDaysActive(shop.joinDate || "2026-01-15")}d active</span>
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
                              <Button size="sm" variant={shop.verified ? "outline" : "default"} onClick={() => toggleVerification(shop.id)}
                                className={`h-7 px-2 text-[10px] ${!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}`}>
                                <BadgeCheck className="mr-1 h-3 w-3" /> {shop.verified ? "Revoke" : "Verify"}
                              </Button>
                              <button onClick={() => removeShop(shop.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><ShieldX className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {freeShops.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No free users found.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREMIUM SHOPS */}
          <TabsContent value="premium">
            <Card className="mb-6">
              <CardHeader className="bg-saffron/10 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5 text-saffron" /> Payment Screenshots & Requests
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
                            {p.plan === "monthly" ? "₹99/mo" : "₹999/yr"} • TXN: <span className="font-mono">{p.transactionId}</span> • {p.date}
                          </p>
                          {p.screenshotUrl && <p className="mt-1 text-xs text-navy">📎 Screenshot: {p.screenshotUrl}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approvePayment(p.transactionId)} className="bg-green-india hover:bg-green-india/90 text-primary-foreground h-8">
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectPayment(p.transactionId)} className="h-8">
                              <XCircle className="mr-1 h-4 w-4" /> Reject
                            </Button>
                          </div>
                          {showRejectInput === p.transactionId && (
                            <div className="flex gap-2">
                              <Textarea placeholder="Rejection reason..." value={rejectReasonMap[p.transactionId] || ""}
                                onChange={(e) => setRejectReasonMap((prev) => ({ ...prev, [p.transactionId]: e.target.value }))} className="min-h-[40px] text-xs" />
                              <Button size="sm" variant="destructive" onClick={() => rejectPayment(p.transactionId)} className="h-auto shrink-0">Confirm</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : <p className="text-sm text-muted-foreground">✅ No pending payment requests.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-navy/5 border-b">
                <CardTitle className="text-base">Active Premium Shops</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-navy text-primary-foreground text-left">
                      <th className="px-3 py-3 text-xs font-semibold">Shop</th>
                      <th className="px-3 py-3 text-xs font-semibold">Plan</th>
                      <th className="px-3 py-3 text-xs font-semibold">Days Left</th>
                      <th className="px-3 py-3 text-xs font-semibold">Status</th>
                      <th className="px-3 py-3 text-xs font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumShops.map((shop) => {
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
                          <td className="px-3 py-3"><Badge className="bg-saffron text-primary-foreground text-[10px]">{shop.premiumPlan === "monthly" ? "₹99/mo" : "₹999/yr"}</Badge></td>
                          <td className="px-3 py-3">
                            {daysLeft !== null ? (
                              <span className={`text-sm font-bold ${isExpiring ? "text-destructive" : "text-foreground"}`}>
                                {isExpiring && <AlertTriangle className="mr-1 inline h-4 w-4 text-destructive" />}{daysLeft}d
                              </span>
                            ) : <span className="text-xs text-muted-foreground">N/A</span>}
                          </td>
                          <td className="px-3 py-3">
                            {isExpiring ? <Badge variant="destructive" className="text-[10px]">⚠ Expiring</Badge> : <Badge className="bg-green-india text-primary-foreground text-[10px]">✅ Active</Badge>}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => extendPremium(shop.id)} className="h-7 px-2 text-[10px] border-green-india text-green-india hover:bg-green-india hover:text-primary-foreground">
                                <CalendarPlus className="mr-1 h-3 w-3" /> +30 Days
                              </Button>
                              <div className="flex gap-1">
                                <Button size="sm" variant={shop.verified ? "outline" : "default"} onClick={() => toggleVerification(shop.id)}
                                  className={`h-7 px-2 text-[10px] ${!shop.verified ? "bg-green-india hover:bg-green-india/90 text-primary-foreground" : ""}`}>
                                  <BadgeCheck className="mr-1 h-3 w-3" /> {shop.verified ? "Revoke" : "Verify"}
                                </Button>
                                <button onClick={() => removeShop(shop.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><ShieldX className="h-4 w-4" /></button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {premiumShops.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No premium shops yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPLAINTS SECTION */}
          <TabsContent value="complaints">
            <Card>
              <CardHeader className="bg-destructive/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> शिकायतें / Complaints
                  {unreadComplaints.length > 0 && (
                    <Badge variant="destructive">{unreadComplaints.length} Unread</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {complaintsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : complaints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">✅ No complaints yet.</p>
                ) : (
                  <div className="divide-y">
                    {complaints.map((c) => (
                      <div key={c.id} className={`p-4 ${!c.is_read ? 'bg-destructive/5' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!c.is_read && <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />}
                              <p className="font-semibold text-sm text-foreground truncate">
                                {c.user_name || "Unknown User"}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {c.user_phone || "No phone"}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 mb-1">{c.complaint_text}</p>
                            <p className="text-[11px] text-muted-foreground">
                              🕐 {formatDateTime(c.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={c.is_read ? "outline" : "default"}
                            onClick={() => toggleComplaintRead(c.id, c.is_read)}
                            className="shrink-0 h-8 text-xs"
                          >
                            {c.is_read ? <Eye className="mr-1 h-3 w-3" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                            {c.is_read ? "Mark Unread" : "Mark Read"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WHATSAPP VERIFICATION */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader className="bg-green-india/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-india" /> WhatsApp / Phone Verification
                  <Badge variant="secondary">
                    {customers.filter(c => !c.phone_verified && c.phone).length} Pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {customersLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : customers.filter(c => c.phone).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No phone numbers registered yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...customers]
                        .filter(c => c.phone)
                        .sort((a, b) => Number(a.phone_verified) - Number(b.phone_verified))
                        .map((c) => (
                          <TableRow key={c.id} className={!c.phone_verified ? "bg-destructive/5" : ""}>
                            <TableCell className="font-medium">
                              {c.display_name || c.email?.split("@")[0] || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                            <TableCell>
                              {c.phone_verified ? (
                                <Badge className="bg-green-india text-primary-foreground text-[10px]">
                                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px]">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.phone_verified ? (
                                <Button size="sm" variant="outline" onClick={() => unverifyUserPhone(c.id)} className="h-8 text-xs">
                                  <XCircle className="mr-1 h-3 w-3" /> Revoke
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => verifyUserPhone(c.id)} className="h-8 text-xs bg-green-india hover:bg-green-india/90 text-primary-foreground">
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Verify
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SOS & EMERGENCY */}
          <TabsContent value="sos">
            <Card>
              <CardHeader className="bg-destructive/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Siren className="h-5 w-5 text-destructive" /> SOS & Emergency Help Requests
                  {sosAlerts.filter(a => a.status === "active").length > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                      {sosAlerts.filter(a => a.status === "active").length} ACTIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {sosLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
                ) : sosAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">✅ No SOS alerts yet.</p>
                ) : (
                  sosAlerts.map((a) => {
                    const isActive = a.status === "active";
                    const mapsUrl = `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;
                    return (
                      <div
                        key={a.id}
                        className={`rounded-lg border-2 p-4 ${
                          isActive
                            ? "border-destructive bg-destructive/10 animate-pulse-slow shadow-lg shadow-destructive/20"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isActive ? (
                                <Badge variant="destructive" className="text-[10px]">🚨 RED ALERT</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">✅ Resolved</Badge>
                              )}
                              <p className="font-bold text-sm text-foreground">
                                {a.user_name || a.user_email || "Unknown User"}
                              </p>
                              {a.user_phone && (
                                <a
                                  href={`tel:${a.user_phone}`}
                                  className="text-xs font-mono text-primary underline"
                                >
                                  {a.user_phone}
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-foreground/90">
                              💬 <span className="italic">{a.message || "No message provided"}</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDateTime(a.created_at)}
                              {a.accuracy && <span>• Accuracy: ±{Math.round(a.accuracy)}m</span>}
                            </p>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                            >
                              <MapPin className="h-3 w-3" /> Open Live Location in Google Maps
                            </a>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {a.user_phone && (
                              <Button
                                size="sm"
                                asChild
                                className="h-8 text-xs bg-green-india hover:bg-green-india/90 text-primary-foreground"
                              >
                                <a href={`tel:${a.user_phone}`}>
                                  <Phone className="mr-1 h-3 w-3" /> Call Now
                                </a>
                              </Button>
                            )}
                            {isActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveSosAlert(a.id)}
                                className="h-8 text-xs"
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Resolved
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SLIDER MANAGEMENT */}
          <TabsContent value="slider">
            <Card>
              <CardHeader className="bg-accent/5 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  🎠 Premium Slider Management — प्रीमियम स्लाइडर प्रबंधन
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  नजदीकी दुकान section में सबसे ऊपर Auto-Rotating Premium Slider दिखता है।
                  केवल <strong>Verified + Premium</strong> दुकानें slider में दिखती हैं।
                </p>
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <h4 className="font-semibold text-foreground mb-2">कौन-सी दुकानें slider में हैं?</h4>
                  {merchantsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    (() => {
                      const sliderShops = merchants.filter(m => m.is_verified);
                      return sliderShops.length === 0 ? (
                        <p className="text-sm text-muted-foreground">कोई Premium + Verified दुकान नहीं है।</p>
                      ) : (
                        <div className="space-y-2">
                          {sliderShops.map(m => (
                            <div key={m.id} className="flex items-center justify-between rounded bg-background border p-3">
                              <div>
                                <p className="font-semibold text-foreground text-sm">{m.shop_name}</p>
                                <p className="text-xs text-muted-foreground">{m.category} • {m.city}</p>
                              </div>
                              <Badge className="bg-accent text-accent-foreground text-[10px]">In Slider</Badge>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-foreground mb-1">Slider Speed</h4>
                  <p className="text-xs text-muted-foreground mb-2">Default: हर 5 सेकंड में slide बदलती है। Premium merchants को Verified करके slider में जोड़ें।</p>
                  <p className="text-xs text-muted-foreground">💡 Tip: किसी दुकान को slider में जोड़ने के लिए Merchants tab में उसे <strong>Verify ✓</strong> करें और Premium status दें।</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Customer Directory */}
        <Card className="mb-8">
          <CardHeader className="bg-green-india/5 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-green-india" /> Customer Directory
              <span className="rounded-full bg-green-india/10 px-2 py-0.5 text-xs font-semibold text-green-india">{customers.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="new" className="text-xs">🆕 New Users ({customers.filter(c => getDaysActive(c.created_at) <= 7).length})</TabsTrigger>
                <TabsTrigger value="old" className="text-xs">👤 Old Users ({customers.filter(c => getDaysActive(c.created_at) > 7).length})</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">📋 All ({customers.length})</TabsTrigger>
              </TabsList>
              {["new", "old", "all"].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>First Login</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customersLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                      ) : customers
                          .filter(c => tab === "all" ? true : tab === "new" ? getDaysActive(c.created_at) <= 7 : getDaysActive(c.created_at) > 7)
                          .length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No users found.</TableCell></TableRow>
                      ) : (
                        customers
                          .filter(c => tab === "all" ? true : tab === "new" ? getDaysActive(c.created_at) <= 7 : getDaysActive(c.created_at) > 7)
                          .map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium text-foreground">{c.email || c.phone || "N/A"}</TableCell>
                              <TableCell><Badge variant="secondary" className="capitalize">{c.provider || (c.phone ? "phone" : "google")}</Badge></TableCell>
                              <TableCell className="text-muted-foreground">{formatDateTime(c.created_at)}</TableCell>
                              <TableCell>
                                {getDaysActive(c.created_at) <= 7 ? (
                                  <Badge className="bg-green-india text-primary-foreground text-[9px]">🆕 New</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[9px]">👤 Regular</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Chatbot Logs */}
        <Card className="mb-8">
          <CardHeader className="bg-navy/5 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-saffron" /> Bharat Mitra - FAQ Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-navy text-primary-foreground text-left">
                  <th className="px-3 py-3 text-xs font-semibold">#</th>
                  <th className="px-3 py-3 text-xs font-semibold">Question</th>
                  <th className="px-3 py-3 text-xs font-semibold">Asked</th>
                  <th className="px-3 py-3 text-xs font-semibold">Last</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CHATBOT_LOGS.sort((a, b) => b.count - a.count).map((log, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-3 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-3 font-hindi font-medium text-foreground">{log.question}</td>
                    <td className="px-3 py-3"><Badge variant="secondary" className="font-bold">{log.count}</Badge></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{log.lastAsked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="border-t pt-4 text-center">
          <p className="text-xs text-muted-foreground">Bharat Dukaan - Management Portal • Internal Use Only</p>
          <p className="font-hindi text-xs text-muted-foreground">भारत दुकान - प्रबंधन पोर्टल • केवल आंतरिक उपयोग हेतु</p>
        </div>
        </main>
      </div>

      {/* Full-size image overlay */}
      {fullImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setFullImageUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img src={fullImageUrl} alt="Document" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
            <button onClick={() => setFullImageUrl(null)}
              className="absolute -top-3 -right-3 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-lg">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
