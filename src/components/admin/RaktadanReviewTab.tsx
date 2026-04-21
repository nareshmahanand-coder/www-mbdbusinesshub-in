import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Droplets, CheckCircle2, XCircle, FileText, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DonationRow {
  id: string;
  donor_user_id: string;
  donor_name: string | null;
  father_name: string | null;
  blood_group: string;
  city: string | null;
  donation_date_text: string | null;
  hospital_name: string | null;
  hospital_address: string | null;
  donor_live_photo_url: string | null;
  hospital_receipt_url: string | null;
  receiver_confirmed: boolean;
  admin_verified: boolean;
  verification_status: string;
  certificate_no: string;
  donated_at: string;
  admin_notes: string | null;
  requester_id: string | null;
}

const RaktadanReviewTab = () => {
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blood_donations")
      .select("*")
      .order("donated_at", { ascending: false });
    if (error) toast.error("लोडिंग में त्रुटि: " + error.message);
    setRows((data as DonationRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const approve = async (row: DonationRow) => {
    setBusy(row.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("blood_donations")
      .update({
        admin_verified: true,
        admin_verified_at: new Date().toISOString(),
        admin_verified_by: user?.id ?? null,
        verification_status: "approved",
        admin_notes: notes[row.id] || row.admin_notes,
      })
      .eq("id", row.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ Certificate approved & released to donor");
    void load();
  };

  const reject = async (row: DonationRow) => {
    const reason = notes[row.id]?.trim();
    if (!reason) { toast.error("कारण ज़रूरी है"); return; }
    setBusy(row.id);
    const { error } = await supabase
      .from("blood_donations")
      .update({
        admin_verified: false,
        verification_status: "rejected",
        admin_notes: reason,
      })
      .eq("id", row.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.error("❌ Donation rejected");
    void load();
  };

  const pending = rows.filter(r => !r.admin_verified && r.verification_status !== "rejected");
  const approved = rows.filter(r => r.admin_verified);

  return (
    <Card>
      <CardHeader className="bg-destructive/5 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Droplets className="h-5 w-5 text-destructive" /> रक्तदान — Certificate Verification
          <Badge variant="secondary">{pending.length} Pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Loading...
          </p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">✅ कोई pending verification नहीं है।</p>
        ) : pending.map((r) => {
          const proofReady = !!r.donor_live_photo_url && !!r.hospital_receipt_url;
          return (
            <div key={r.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">
                    {r.donor_name || "—"}{" "}
                    <span className="ml-2 rounded bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                      {r.blood_group}
                    </span>
                  </p>
                  {r.father_name && <p className="text-xs text-muted-foreground">पिता/पति: {r.father_name}</p>}
                  <p className="text-xs text-muted-foreground">
                    दिनांक: {r.donation_date_text || new Date(r.donated_at).toLocaleDateString("en-IN")} • {r.city || "—"}
                  </p>
                  {r.hospital_name && (
                    <p className="text-xs text-muted-foreground">अस्पताल: {r.hospital_name}{r.hospital_address ? `, ${r.hospital_address}` : ""}</p>
                  )}
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">Cert No: {r.certificate_no}</p>
                </div>
                <Badge variant={proofReady ? "default" : "outline"} className="text-[10px]">
                  {r.verification_status}
                </Badge>
              </div>

              {/* Proof images */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold mb-1">Donor live photo</p>
                  {r.donor_live_photo_url ? (
                    <a href={r.donor_live_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={r.donor_live_photo_url} alt="donor" className="h-28 w-full rounded border object-cover" />
                    </a>
                  ) : <div className="h-28 rounded border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">Not uploaded</div>}
                </div>
                <div>
                  <p className="text-[10px] font-semibold mb-1">Hospital receipt</p>
                  {r.hospital_receipt_url ? (
                    <a href={r.hospital_receipt_url} target="_blank" rel="noopener noreferrer">
                      <img src={r.hospital_receipt_url} alt="receipt" className="h-28 w-full rounded border object-cover" />
                    </a>
                  ) : <div className="h-28 rounded border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">Not uploaded</div>}
                </div>
              </div>

              {/* Receiver confirmation */}
              <div className="flex items-center gap-2 text-xs">
                {r.receiver_confirmed ? (
                  <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Receiver Confirmed</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-400">⏳ Receiver pending "रक्त मिल गया"</Badge>
                )}
              </div>

              <Textarea
                value={notes[r.id] ?? r.admin_notes ?? ""}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                placeholder="Admin notes (call to receiver verification, observations, or rejection reason)…"
                className="min-h-[60px] text-xs"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy === r.id || !proofReady || !r.receiver_confirmed}
                  onClick={() => approve(r)}
                  className="bg-green-india hover:bg-green-india/90 text-primary-foreground"
                >
                  {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Approve & Release Signed PDF
                </Button>
                <Button size="sm" variant="destructive" disabled={busy === r.id} onClick={() => reject(r)}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                {(!proofReady || !r.receiver_confirmed) && (
                  <span className="text-[10px] text-amber-700 self-center">
                    Need: {!proofReady && "proof uploads"} {!proofReady && !r.receiver_confirmed && " + "} {!r.receiver_confirmed && "receiver confirmation"}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {approved.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-semibold text-green-india">✅ Recently Approved:</p>
            {approved.slice(0, 10).map(r => (
              <div key={r.id} className="mb-1 rounded bg-green-india/5 px-3 py-2 text-xs flex items-center justify-between">
                <span><FileText className="inline h-3 w-3 mr-1" /> {r.donor_name} — {r.blood_group} • {r.certificate_no}</span>
                <Badge className="bg-green-india text-primary-foreground text-[9px]">Released</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RaktadanReviewTab;