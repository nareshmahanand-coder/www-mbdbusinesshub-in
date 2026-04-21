import { useEffect, useMemo, useState } from "react";
import { Phone, MessageCircle, Droplets, UserPlus, Search, CheckCircle2, Award, MapPin, Loader2, Eye, FileText, ShieldCheck, Camera, X, Download, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  generateRaktadanCertificatePDF,
  generateRaktadanCertNo,
  renderRaktadanPreviewDataUrl,
} from "@/lib/generateRaktadanCertificate";

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const FILTER_GROUPS = ["All", ...BLOOD_GROUPS];

const NGO_NAME = "लाइव शो शिक्षा एवं सामाजिक कल्याण समिति";
const NGO_NOTE =
  "लाइव शो शिक्षा एवं सामाजिक कल्याण समिति की तरफ से आपको रक्तदान करने पर विशेष प्रोत्साहन प्रमाण-पत्र (Certificate) प्रदान किया जाएगा।";

const PENDING_MSG =
  "आपका प्रमाणपत्र तभी जारी किया जाएगा जब रक्त प्राप्त करने वाला व्यक्ति पुष्टि करेगा और आपके द्वारा अपलोड की गई अस्पताल की रसीद और फोटो की जांच पूरी हो जाएगी।";

type Mode = "browse" | "register" | "request" | "certificate" | "myDonations";

interface Donor {
  id: string;
  user_id: string;
  name: string;
  age: number;
  blood_group: string;
  city: string | null;
  phone: string;
  last_donation_date: string | null;
  donation_count: number;
  is_active: boolean;
}

interface BloodRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  blood_group: string;
  city: string | null;
  status: string;
  matched_donor_id: string | null;
  created_at: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const BloodDonorTab = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("browse");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [profileCity, setProfileCity] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Sample preview dialog
  const [sampleOpen, setSampleOpen] = useState(false);
  const [samplePreviewUrl, setSamplePreviewUrl] = useState<string | null>(null);
  const [samplePreviewName, setSamplePreviewName] = useState("आपका नाम");

  // My Donations (gated PDF)
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);

  // Certificate registration form (donor-self uploads proof)
  const [cert, setCert] = useState({
    name: "",
    fatherName: "",
    bloodGroup: "O+",
    address: "",
    city: "",
    hospitalName: "",
    hospitalAddress: "",
    donationDate: todayISO(),
    livePhotoUrl: "",
    receiptUrl: "",
    livePhotoFile: null as File | null,
    receiptFile: null as File | null,
  });

  // Register form
  const [reg, setReg] = useState({
    name: "",
    age: "",
    weight_kg: "",
    height_cm: "",
    blood_group: "O+",
    aadhaar: "",
    address: "",
    city: "",
    phone: "",
  });

  // Request form
  const [req, setReq] = useState({
    requester_name: "",
    requester_phone: "",
    blood_group: "O+",
    city: "",
    message: "",
  });

  /* ------------- load profile city + donors + my requests ------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      // 1. Profile city
      let myCity = "";
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("city, display_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        myCity = prof?.city || "";
        if (!cancel) {
          setProfileCity(myCity);
          setCityFilter(myCity);
          setReg((r) => ({
            ...r,
            city: myCity,
            name: r.name || prof?.display_name || "",
            phone: r.phone || prof?.phone || "",
          }));
          setReq((r) => ({
            ...r,
            city: myCity,
            requester_name: r.requester_name || prof?.display_name || "",
            requester_phone: r.requester_phone || prof?.phone || "",
          }));
        }
      }

      // 2. Active donors
      const { data: donorRows } = await supabase
        .from("blood_donors")
        .select("id,user_id,name,age,blood_group,city,phone,last_donation_date,donation_count,is_active")
        .eq("is_active", true)
        .order("city", { ascending: true });

      // 3. My open requests (so I can mark as fulfilled)
      let mine: BloodRequest[] = [];
      if (user) {
        const { data: reqRows } = await supabase
          .from("blood_requests")
          .select("*")
          .eq("requester_id", user.id)
          .eq("status", "open")
          .order("created_at", { ascending: false });
        mine = reqRows || [];
      }

      if (!cancel) {
        setDonors((donorRows || []) as Donor[]);
        setMyRequests(mine);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  /* ------------- filtering: city-first then group ------------- */
  const filteredDonors = useMemo(() => {
    let list = donors;
    if (selectedGroup !== "All") list = list.filter((d) => d.blood_group === selectedGroup);
    if (cityFilter.trim()) {
      const c = cityFilter.trim().toLowerCase();
      list = list.filter((d) => (d.city || "").toLowerCase().includes(c));
    }
    // Local city first
    if (profileCity) {
      const pc = profileCity.toLowerCase();
      list = [...list].sort((a, b) => {
        const aLocal = (a.city || "").toLowerCase() === pc ? 0 : 1;
        const bLocal = (b.city || "").toLowerCase() === pc ? 0 : 1;
        return aLocal - bLocal;
      });
    }
    return list;
  }, [donors, selectedGroup, cityFilter, profileCity]);

  /* ------------- register donor ------------- */
  const handleRegister = async () => {
    if (!user) {
      toast({ title: "लॉगिन ज़रूरी है", description: "रजिस्टर करने के लिए पहले लॉगिन करें।", variant: "destructive" });
      return;
    }
    const age = Number(reg.age);
    const weight = Number(reg.weight_kg);
    if (!reg.name.trim() || !reg.phone.trim()) {
      toast({ title: "अधूरी जानकारी", description: "नाम और फ़ोन ज़रूरी है।", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(age) || age < 18) {
      toast({
        title: "अयोग्य",
        description: "रक्तदान के लिए न्यूनतम आयु 18 वर्ष होनी चाहिए।",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(weight) || weight < 45) {
      toast({
        title: "अयोग्य",
        description: "रक्तदान के लिए न्यूनतम वज़न 45 किग्रा होना चाहिए।",
        variant: "destructive",
      });
      return;
    }
    if (reg.aadhaar && !/^\d{12}$/.test(reg.aadhaar.replace(/\s/g, ""))) {
      toast({ title: "Aadhaar गलत", description: "12 अंकों का Aadhaar डालें।", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const aadhaarLast4 = reg.aadhaar ? reg.aadhaar.replace(/\s/g, "").slice(-4) : null;
    const { data, error } = await supabase
      .from("blood_donors")
      .upsert(
        {
          user_id: user.id,
          name: reg.name.trim(),
          age,
          weight_kg: weight,
          height_cm: reg.height_cm ? Number(reg.height_cm) : null,
          blood_group: reg.blood_group,
          aadhaar_last4: aadhaarLast4,
          address: reg.address.trim() || null,
          city: reg.city.trim() || null,
          phone: reg.phone.trim(),
          is_active: true,
          is_eligible: true,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
      return;
    }
    setDonors((prev) => {
      const without = prev.filter((p) => p.user_id !== user.id);
      return [data as Donor, ...without];
    });
    toast({
      title: "धन्यवाद बॉस! 🩸",
      description:
        "आप रक्तदाता के रूप में पंजीकृत हो गए हैं। ज़रूरतमंद आपसे जल्द संपर्क करेंगे।",
    });
    setMode("browse");
  };

  /* ------------- create blood request ------------- */
  const handleCreateRequest = async () => {
    if (!user) {
      toast({ title: "लॉगिन ज़रूरी है", variant: "destructive" });
      return;
    }
    if (!req.requester_name.trim() || !req.requester_phone.trim()) {
      toast({ title: "अधूरी जानकारी", description: "नाम और फ़ोन ज़रूरी है।", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("blood_requests")
      .insert({
        requester_id: user.id,
        requester_name: req.requester_name.trim(),
        requester_phone: req.requester_phone.trim(),
        blood_group: req.blood_group,
        city: req.city.trim() || null,
        message: req.message.trim() || null,
        status: "open",
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
      return;
    }
    setMyRequests((p) => [data as BloodRequest, ...p]);
    setSelectedGroup(req.blood_group);
    if (req.city) setCityFilter(req.city);
    toast({
      title: "रिक्वेस्ट पोस्ट हो गई 🙏",
      description: "नीचे डोनर्स की सूची से सीधे कॉल या व्हाट्सएप करें।",
    });
    setMode("browse");
  };

  /* ------------- mark request fulfilled + issue certificate ------------- */
  const handleBloodReceived = async (request: BloodRequest, donor: Donor) => {
    if (!user || user.id !== request.requester_id) return;
    setSubmitting(true);

    // 1. Update request
    const { error: updErr } = await supabase
      .from("blood_requests")
      .update({
        status: "fulfilled",
        matched_donor_id: donor.id,
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (updErr) {
      setSubmitting(false);
      toast({ title: "त्रुटि", description: updErr.message, variant: "destructive" });
      return;
    }

    // 2. Insert donation row (admin must verify before signed PDF is released)
    const { data: donation, error: donErr } = await supabase
      .from("blood_donations")
      .insert({
        donor_id: donor.id,
        donor_user_id: donor.user_id,
        request_id: request.id,
        requester_id: user.id,
        blood_group: donor.blood_group,
        city: donor.city,
        donor_name: donor.name,
        receiver_confirmed: true,
        receiver_confirmed_at: new Date().toISOString(),
        verification_status: "receiver_confirmed",
      })
      .select()
      .single();

    // 3. Bump donor counter (best-effort; only owner can update so just skip if blocked)
    await supabase
      .from("blood_donors")
      .update({
        donation_count: (donor.donation_count || 0) + 1,
        last_donation_date: todayISO(),
      })
      .eq("id", donor.id);

    setSubmitting(false);

    if (donErr) {
      toast({ title: "त्रुटि", description: donErr.message, variant: "destructive" });
      return;
    }

    // 4. Update local state
    setMyRequests((p) => p.filter((r) => r.id !== request.id));

    // 5. Thank-you + ask donor to upload proof for official certificate
    const thankMsg = encodeURIComponent(
      `🙏 धन्यवाद ${donor.name} जी!\n\nआपने एक जीवन बचाया है। ${NGO_NAME} की तरफ़ से आपको रक्तदान प्रमाण-पत्र प्रदान किया जाएगा।\n\nकृपया भारत मित्र ऐप में जाकर "मेरे रक्तदान" टैब में अपनी लाइव फोटो + अस्पताल की रसीद अपलोड करें — Admin verification के बाद आपका Official Certificate जारी होगा।\n\n— मेरा भारत दुकान | भारत मित्र AI`
    );
    const waUrl = `https://wa.me/${donor.phone.replace(/\D/g, "")}?text=${thankMsg}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    toast({
      title: "🎉 पुष्टि दर्ज कर ली गई",
      description: `डोनर को धन्यवाद नोट भेज दिया। Admin verification के बाद Certificate (Cert No: ${donation?.certificate_no}) रिलीज़ होगा।`,
    });
  };

  /* ============================================================ RENDER */

  /* ------------- My donations (donor side) ------------- */
  const loadMyDonations = async () => {
    if (!user) return;
    setDonationsLoading(true);
    const { data } = await supabase
      .from("blood_donations")
      .select("*")
      .eq("donor_user_id", user.id)
      .order("donated_at", { ascending: false });
    setMyDonations(data || []);
    setDonationsLoading(false);
  };

  /* ------------- Upload proof file to blood-proof bucket ------------- */
  const uploadProofFile = async (file: File, kind: "live" | "receipt"): Promise<string | null> => {
    if (!user) { toast({ title: "लॉगिन ज़रूरी है", variant: "destructive" }); return null; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "फ़ाइल बहुत बड़ी (5MB max)", variant: "destructive" }); return null; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blood-proof").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data: pub } = supabase.storage.from("blood-proof").getPublicUrl(path);
    return pub.publicUrl;
  };

  /* ------------- Submit certificate registration (donor self-creates pending row) ------------- */
  const handleSubmitCertificate = async () => {
    if (!user) { toast({ title: "लॉगिन ज़रूरी है", variant: "destructive" }); return; }
    if (!cert.name.trim() || !cert.bloodGroup || !cert.donationDate) {
      toast({ title: "अधूरी जानकारी", description: "नाम, ब्लड ग्रुप और तारीख ज़रूरी है।", variant: "destructive" });
      return;
    }
    if (!cert.livePhotoFile || !cert.receiptFile) {
      toast({ title: "Proof ज़रूरी है", description: "लाइव फोटो और अस्पताल रसीद दोनों अपलोड करें।", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const [livePhotoUrl, receiptUrl] = await Promise.all([
      uploadProofFile(cert.livePhotoFile, "live"),
      uploadProofFile(cert.receiptFile, "receipt"),
    ]);
    if (!livePhotoUrl || !receiptUrl) { setSubmitting(false); return; }

    const { error } = await supabase.from("blood_donations").insert({
      donor_user_id: user.id,
      requester_id: user.id, // self-issued path: donor is the requester until matched
      blood_group: cert.bloodGroup,
      city: cert.city || null,
      donor_name: cert.name.trim(),
      father_name: cert.fatherName.trim() || null,
      hospital_name: cert.hospitalName.trim() || null,
      hospital_address: cert.hospitalAddress.trim() || null,
      donation_date_text: cert.donationDate,
      donor_live_photo_url: livePhotoUrl,
      hospital_receipt_url: receiptUrl,
      verification_status: "proof_uploaded",
    });
    setSubmitting(false);
    if (error) { toast({ title: "त्रुटि", description: error.message, variant: "destructive" }); return; }
    toast({
      title: "✅ Submitted for verification",
      description: PENDING_MSG,
    });
    setMode("myDonations");
    void loadMyDonations();
  };

  /* ------------- Download OFFICIAL certificate (only if approved) ------------- */
  const handleDownloadOfficial = (d: any) => {
    if (!d.admin_verified) {
      toast({
        title: "अभी जारी नहीं हुआ",
        description: PENDING_MSG,
        variant: "destructive",
      });
      return;
    }
    const doc = generateRaktadanCertificatePDF({
      donorName: d.donor_name || "—",
      fatherName: d.father_name || undefined,
      bloodGroup: d.blood_group,
      donationDate: d.donation_date_text || new Date(d.donated_at).toLocaleDateString("en-IN"),
      hospitalName: d.hospital_name || undefined,
      hospitalAddress: d.hospital_address || undefined,
      city: d.city || undefined,
      certificateNo: d.certificate_no || generateRaktadanCertNo(),
    });
    const safe = (d.donor_name || "donor").replace(/\s+/g, "_");
    doc.save(`Raktadan-Official-${safe}.pdf`);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* NGO banner */}
      <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3">
        <h5 className="mb-1 flex items-center gap-1 text-sm font-bold text-destructive">
          <Droplets className="h-4 w-4" /> रक्तदान — भारत कवच (Bharat Mitra AI)
        </h5>
        <p className="text-[11px] font-semibold leading-snug text-foreground">
          सहयोगी NGO: <span className="text-destructive">{NGO_NAME}</span>
        </p>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{NGO_NOTE}</p>
      </div>

      {/* Sample preview CTA */}
      <button
        onClick={async () => {
          setSamplePreviewName(reg.name || "आपका नाम");
          setSampleOpen(true);
          if (!samplePreviewUrl) {
            try {
              const url = await renderRaktadanPreviewDataUrl({
                donorName: reg.name || "आपका नाम",
                bloodGroup: reg.blood_group,
                donationDate: new Date().toLocaleDateString("en-IN"),
                certificateNo: "SAMPLE-PREVIEW",
                sample: true,
              });
              setSamplePreviewUrl(url);
            } catch {
              toast({ title: "Preview load failed", variant: "destructive" });
            }
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-destructive bg-destructive/5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
      >
        <Eye className="h-4 w-4" /> View Sample Certificate (नमूना देखें)
      </button>

      {/* Mode tabs */}
      <div className="grid grid-cols-5 gap-1">
        <button
          onClick={() => setMode("browse")}
          className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[9px] font-bold transition-colors ${
            mode === "browse"
              ? "bg-destructive text-destructive-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <Search className="h-3 w-3" /> खोजें
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[9px] font-bold transition-colors ${
            mode === "register"
              ? "bg-destructive text-destructive-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <UserPlus className="h-3 w-3" /> डोनर बनें
        </button>
        <button
          onClick={() => setMode("request")}
          className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[9px] font-bold transition-colors ${
            mode === "request"
              ? "bg-destructive text-destructive-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <Droplets className="h-3 w-3" /> चाहिए
        </button>
        <button
          onClick={() => setMode("certificate")}
          className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[9px] font-bold transition-colors ${
            mode === "certificate"
              ? "bg-destructive text-destructive-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <FileText className="h-3 w-3" /> सर्टिफिकेट
        </button>
        <button
          onClick={() => { setMode("myDonations"); void loadMyDonations(); }}
          className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[9px] font-bold transition-colors ${
            mode === "myDonations"
              ? "bg-destructive text-destructive-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <ShieldCheck className="h-3 w-3" /> मेरे
        </button>
      </div>

      {/* ============================================ BROWSE */}
      {mode === "browse" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            {FILTER_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                  selectedGroup === bg
                    ? "bg-destructive text-destructive-foreground"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {bg === "All" ? "सभी" : bg}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-destructive" />
            <Input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder={profileCity ? `City (default: ${profileCity})` : "City filter"}
              className="h-8 text-xs"
            />
            {cityFilter && (
              <button
                className="text-[10px] text-muted-foreground underline"
                onClick={() => setCityFilter("")}
              >
                clear
              </button>
            )}
          </div>

          {/* Open requests by me — let me click "ब्लड मिल गया" */}
          {myRequests.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2">
              <p className="mb-1.5 text-[11px] font-bold text-amber-900">
                आपकी खुली रिक्वेस्ट — डोनर मिल गया?
              </p>
              {myRequests.map((r) => (
                <p key={r.id} className="text-[10px] text-amber-900">
                  • {r.blood_group} — {r.city || "—"} (नीचे डोनर पर "ब्लड मिल गया" दबाएँ)
                </p>
              ))}
            </div>
          )}

          {/* Donor list */}
          <div className="max-h-[320px] space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : filteredDonors.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                इस ब्लड ग्रुप / शहर का कोई डोनर अभी उपलब्ध नहीं है। आप खुद रजिस्टर करके पहले बन सकते हैं!
              </p>
            ) : (
              filteredDonors.map((d) => {
                const isLocal =
                  profileCity && (d.city || "").toLowerCase() === profileCity.toLowerCase();
                const matchingReq = myRequests.find((r) => r.blood_group === d.blood_group);
                const phoneClean = d.phone.replace(/\D/g, "");
                return (
                  <div
                    key={d.id}
                    className="rounded-lg border border-border bg-background p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.city || "—"}
                          {isLocal && (
                            <span className="ml-1 rounded bg-green-600/10 px-1 py-px text-[9px] font-bold text-green-700">
                              आपके शहर में
                            </span>
                          )}
                        </p>
                        {d.last_donation_date && (
                          <p className="text-[10px] text-muted-foreground">
                            अंतिम रक्तदान: {d.last_donation_date}
                          </p>
                        )}
                        {d.donation_count > 0 && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <Award className="h-3 w-3" /> {d.donation_count} बार रक्तदान
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                        {d.blood_group}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`tel:+${phoneClean}`}
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-blue-600 px-2 py-1.5 text-[10px] font-bold text-white"
                      >
                        <Phone className="h-3 w-3" /> कॉल करें
                      </a>
                      <a
                        href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(
                          "नमस्ते! मुझे इमरजेंसी में ब्लड की ज़रूरत है। क्या आप रक्तदान कर सकते हैं? — भारत मित्र AI"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-green-600 px-2 py-1.5 text-[10px] font-bold text-white"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    </div>
                    {matchingReq && (
                      <button
                        disabled={submitting}
                        onClick={() => handleBloodReceived(matchingReq, d)}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        ब्लड मिल गया — Certificate जारी करें
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================ REGISTER */}
      {mode === "register" && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            कृपया स्वस्थ डोनर मानदंड भरें (आयु 18+, वज़न 45kg+).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="नाम *" value={reg.name} onChange={(v) => setReg({ ...reg, name: v })} />
            <Field
              label="आयु *"
              type="number"
              value={reg.age}
              onChange={(v) => setReg({ ...reg, age: v })}
            />
            <Field
              label="वज़न (kg) *"
              type="number"
              value={reg.weight_kg}
              onChange={(v) => setReg({ ...reg, weight_kg: v })}
            />
            <Field
              label="ऊंचाई (cm)"
              type="number"
              value={reg.height_cm}
              onChange={(v) => setReg({ ...reg, height_cm: v })}
            />
            <div>
              <Label className="text-[10px]">Blood Group *</Label>
              <select
                value={reg.blood_group}
                onChange={(e) => setReg({ ...reg, blood_group: e.target.value })}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <Field label="फ़ोन *" value={reg.phone} onChange={(v) => setReg({ ...reg, phone: v })} />
            <Field
              label="शहर"
              value={reg.city}
              onChange={(v) => setReg({ ...reg, city: v })}
            />
            <Field
              label="Aadhaar (12 अंक)"
              value={reg.aadhaar}
              onChange={(v) => setReg({ ...reg, aadhaar: v })}
            />
          </div>
          <div>
            <Label className="text-[10px]">पूरा पता</Label>
            <Textarea
              value={reg.address}
              onChange={(e) => setReg({ ...reg, address: e.target.value })}
              className="min-h-[60px] text-xs"
            />
          </div>
          <Button
            onClick={handleRegister}
            disabled={submitting}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            रक्तदाता बनें
          </Button>
          <p className="text-[10px] leading-snug text-muted-foreground">{NGO_NOTE}</p>
        </div>
      )}

      {/* ============================================ REQUEST */}
      {mode === "request" && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            ज़रूरत बताएँ — हम आपके शहर के डोनर्स से जोड़ेंगे।
          </p>
          <Field
            label="आपका नाम *"
            value={req.requester_name}
            onChange={(v) => setReq({ ...req, requester_name: v })}
          />
          <Field
            label="संपर्क फ़ोन *"
            value={req.requester_phone}
            onChange={(v) => setReq({ ...req, requester_phone: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Blood Group *</Label>
              <select
                value={req.blood_group}
                onChange={(e) => setReq({ ...req, blood_group: e.target.value })}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <Field label="शहर" value={req.city} onChange={(v) => setReq({ ...req, city: v })} />
          </div>
          <div>
            <Label className="text-[10px]">अतिरिक्त संदेश</Label>
            <Textarea
              value={req.message}
              onChange={(e) => setReq({ ...req, message: e.target.value })}
              className="min-h-[60px] text-xs"
              placeholder="अस्पताल, कब चाहिए, कितना यूनिट..."
            />
          </div>
          <Button
            onClick={handleCreateRequest}
            disabled={submitting}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Droplets className="mr-2 h-4 w-4" />}
            रिक्वेस्ट पोस्ट करें
          </Button>
        </div>
      )}
    </div>
  );
};

/* tiny labelled input */
const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div>
    <Label className="text-[10px]">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-xs"
    />
  </div>
);

export default BloodDonorTab;