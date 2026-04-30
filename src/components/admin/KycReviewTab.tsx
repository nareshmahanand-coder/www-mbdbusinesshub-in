import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, ShieldX, Eye, Loader2, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface KycRow {
  id: string;
  user_id: string;
  aadhaar_number: string;
  selfie_url: string;
  aadhaar_front_url: string;
  aadhaar_back_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile_email?: string | null;
  profile_phone?: string | null;
  signed_selfie?: string;
  signed_front?: string;
  signed_back?: string;
}

const sign = async (path: string) => {
  if (!path || path.includes("upload_failed") || path.includes("upload_pending")) return "";
  const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
};

const KycReviewTab = () => {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [viewing, setViewing] = useState<KycRow | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kyc_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) {
      setRows([]); setLoading(false); return;
    }
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles").select("id, email, phone").in("id", userIds);
    const pmap = new Map(profiles?.map(p => [p.id, p]) ?? []);

    const enriched: KycRow[] = await Promise.all(data.map(async (r: any) => {
      const [signed_selfie, signed_front, signed_back] = await Promise.all([
        sign(r.selfie_url), sign(r.aadhaar_front_url), sign(r.aadhaar_back_url),
      ]);
      return {
        ...r,
        profile_email: pmap.get(r.user_id)?.email,
        profile_phone: pmap.get(r.user_id)?.phone,
        signed_selfie, signed_front, signed_back,
      };
    }));
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const ch = supabase.channel("admin-kyc")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "kyc_requests" }, () => {
        toast.info("🔔 नया KYC request आया है!");
        void load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const approve = async (row: KycRow) => {
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("kyc_requests").update({
      status: "approved",
      rejection_reason: null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", row.id);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ KYC Approved");
    setViewing(null);
    void load();
  };

  const reject = async () => {
    if (!rejectId) return;
    if (rejectReason.trim().length < 3) { toast.error("कारण लिखें"); return; }
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("kyc_requests").update({
      status: "rejected",
      rejection_reason: rejectReason.trim(),
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", rejectId);
    setActionLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("❌ KYC Rejected — user can re-submit");
    setRejectId(null); setRejectReason(""); setViewing(null);
    void load();
  };

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const pendingCount = rows.filter(r => r.status === "pending").length;

  const maskAadhaar = (n: string) => `XXXX XXXX ${n.slice(-4)}`;

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-india text-white">Approved</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge className="bg-orange-500 text-white">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader className="bg-navy/5 border-b">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-navy" /> E-KYC Verification
            {pendingCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                {pendingCount} pending
              </span>
            )}
          </span>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">कोई KYC request नहीं मिला</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map(row => (
              <div key={row.id} className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row gap-3">
                {row.signed_selfie ? (
                  <img
                    src={row.signed_selfie}
                    alt="selfie"
                    className="h-20 w-20 rounded-full object-cover border-2 border-navy/30 mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-destructive/40 bg-destructive/5 text-[10px] font-bold text-destructive mx-auto sm:mx-0 text-center px-2">
                    Upload Failed
                  </div>
                )}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{row.profile_email || row.profile_phone || row.user_id.slice(0, 8)}</p>
                    {statusBadge(row.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">📱 {row.profile_phone || "—"}</p>
                <p className="text-xs font-mono">🆔 {maskAadhaar(row.aadhaar_number)}</p>
                {row.rejection_reason?.startsWith("Upload issue:") && (
                  <p className="text-xs font-semibold text-destructive">⚠️ {row.rejection_reason}</p>
                )}
                  <p className="text-[10px] text-muted-foreground">{new Date(row.created_at).toLocaleString("hi-IN")}</p>
                  {row.rejection_reason && (
                    <p className="text-xs text-destructive">कारण: {row.rejection_reason}</p>
                  )}
                </div>
                <div className="flex sm:flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewing(row)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  {row.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-india hover:bg-green-india/90 text-white" onClick={() => approve(row)} disabled={actionLoading}>
                        <ShieldCheck className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setRejectId(row.id); setRejectReason(""); }}>
                        <ShieldX className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{viewing.profile_email || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{viewing.profile_phone || "—"}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">Aadhaar Number</p><p className="font-mono text-base">{viewing.aadhaar_number.replace(/(\d{4})(?=\d)/g, "$1 ")}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>{statusBadge(viewing.status)}</div>
                <div><p className="text-muted-foreground text-xs">Submitted</p><p className="text-xs">{new Date(viewing.created_at).toLocaleString("hi-IN")}</p></div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Live Selfie</p>
                {viewing.signed_selfie ? (
                  <img src={viewing.signed_selfie} alt="selfie" className="w-48 h-48 rounded-lg object-cover border-2 border-navy/30" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-sm font-semibold text-destructive">
                    Selfie upload failed or file is missing
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Aadhaar Front</p>
                  {viewing.signed_front ? <a href={viewing.signed_front} target="_blank" rel="noreferrer">
                    <img src={viewing.signed_front} alt="front" className="w-full rounded-lg border-2 border-navy/30" />
                  </a> : <div className="flex h-28 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-xs font-semibold text-destructive">Front upload missing</div>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Aadhaar Back</p>
                  {viewing.signed_back ? <a href={viewing.signed_back} target="_blank" rel="noreferrer">
                    <img src={viewing.signed_back} alt="back" className="w-full rounded-lg border-2 border-navy/30" />
                  </a> : <div className="flex h-28 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-xs font-semibold text-destructive">Back upload missing</div>}
                </div>
              </div>

              {viewing.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button className="flex-1 bg-green-india hover:bg-green-india/90 text-white" onClick={() => approve(viewing)} disabled={actionLoading}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Approve KYC
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setRejectId(viewing.id); setRejectReason(""); }}>
                    <ShieldX className="h-4 w-4 mr-1" /> Reject KYC
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC — कारण लिखें</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="उदा. आधार फोटो धुंधली है, कृपया साफ फोटो भेजें..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={reject} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KycReviewTab;
