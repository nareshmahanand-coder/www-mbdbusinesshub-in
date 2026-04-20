import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  Plus,
  Trash2,
  MessageCircle,
  Siren,
  MapPin,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildInviteMessage,
  FamilyMember,
  googleMapsLink,
  normalizePhone,
  toWhatsAppNumber,
} from "@/lib/familySafety";
import { triggerSos } from "@/lib/triggerSos";

const FamilySafetyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [pendingInvites, setPendingInvites] = useState<FamilyMember[]>([]);
  const [lastLoc, setLastLoc] = useState<{
    lat: number;
    lng: number;
    recorded_at: string;
  } | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [my, incoming, prof, loc] = await Promise.all([
      supabase
        .from("family_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("family_members")
        .select("*")
        .eq("member_user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("last_known_locations")
        .select("latitude, longitude, recorded_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setMembers((my.data as FamilyMember[]) ?? []);
    setPendingInvites((incoming.data as FamilyMember[]) ?? []);
    setOwnerName(prof.data?.display_name || user.email || "एक यूज़र");
    if (loc.data)
      setLastLoc({
        lat: loc.data.latitude,
        lng: loc.data.longitude,
        recorded_at: loc.data.recorded_at,
      });
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAdd = async () => {
    if (!user) return;
    const trimmed = name.trim();
    const ten = normalizePhone(phone);
    if (!trimmed) return toast.error("Name required");
    if (ten.length !== 10) return toast.error("Enter valid 10-digit phone");
    if (members.length >= 5)
      return toast.error("Maximum 5 family members allowed");

    setAdding(true);
    const { data, error } = await supabase
      .from("family_members")
      .insert({
        owner_id: user.id,
        member_name: trimmed,
        member_phone: ten,
        status: "pending",
      })
      .select()
      .single();
    setAdding(false);

    if (error) {
      if (error.code === "23505") toast.error("This number is already added");
      else toast.error(error.message);
      return;
    }

    toast.success(`${trimmed} added — sending WhatsApp invite`);
    setName("");
    setPhone("");
    await load();

    // Auto-open WhatsApp invite
    const msg = buildInviteMessage(ownerName, (data as FamilyMember).invite_token);
    const wa = `https://wa.me/${toWhatsAppNumber(ten)}?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");
  };

  const resendInvite = (m: FamilyMember) => {
    const msg = buildInviteMessage(ownerName, m.invite_token);
    window.open(
      `https://wa.me/${toWhatsAppNumber(m.member_phone)}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this family member?")) return;
    const { error } = await supabase.from("family_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    await load();
  };

  const acceptIncoming = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("family_members")
      .update({
        status: "accepted",
        member_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Accepted! आप अब Family Circle का हिस्सा हैं।");
    await load();
  };

  const declineIncoming = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("family_members")
      .update({ status: "declined", member_user_id: user.id })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await load();
  };

  const handleSos = async () => {
    if (!user) return;
    if (
      !confirm(
        "🚨 SOS भेजें? आपकी लोकेशन परिवार और 500m के दुकानदारों को भेजी जाएगी।"
      )
    )
      return;
    setSosLoading(true);
    try {
      const result = await triggerSos(user.id, ownerName);
      toast.success(
        `SOS भेज दिया! 👨‍👩‍👧 ${result.familyNotified} family + 🏪 ${result.merchantsNotified} दुकानदार`
      );
      // Open WhatsApp links sequentially with small delay so popup blocker is friendly
      result.whatsappLinks.slice(0, 6).forEach((url, i) => {
        setTimeout(() => window.open(url, "_blank"), i * 400);
      });
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "SOS failed");
    } finally {
      setSosLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="container mx-auto max-w-lg px-4 py-6 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* SOS button */}
        <Card className="border-2 border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="font-bold text-lg">Family Safety Circle</h2>
            <p className="text-xs text-muted-foreground">
              Emergency में एक टैप पर परिवार + नज़दीकी दुकानदार को लोकेशन भेजें।
            </p>
            <Button
              onClick={handleSos}
              disabled={sosLoading}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold py-6 text-base"
            >
              {sosLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Siren className="mr-2 h-5 w-5" />
              )}
              🚨 SOS भेजें
            </Button>
            {lastLoc && (
              <a
                href={googleMapsLink(lastLoc.lat, lastLoc.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-primary underline"
              >
                <MapPin className="h-3 w-3" />
                Last known location ({new Date(lastLoc.recorded_at).toLocaleTimeString()})
              </a>
            )}
          </CardContent>
        </Card>

        {/* Incoming invites */}
        {pendingInvites.length > 0 && (
          <Card className="border-2 border-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📩 आपको invite मिले हैं</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingInvites.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <p className="font-semibold text-sm">Owner phone: +91 {p.member_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      आपको Family Circle में जोड़ा गया है
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptIncoming(p.id)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineIncoming(p.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add member */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>परिवार जोड़ें ({members.length}/5)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Family member's name"
              />
            </div>
            <div>
              <Label>Phone (10 digits)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9XXXXXXXXX"
                inputMode="numeric"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={adding || members.length >= 5}
              className="w-full"
            >
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add & Send WhatsApp Invite
            </Button>
          </CardContent>
        </Card>

        {/* Members list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">मेरे Family Members</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                अभी कोई member नहीं। ऊपर से जोड़ें।
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{m.member_name}</p>
                      <p className="text-xs text-muted-foreground">+91 {m.member_phone}</p>
                      <Badge
                        variant={m.status === "accepted" ? "default" : "secondary"}
                        className="mt-1 text-[10px]"
                      >
                        {m.status === "accepted" ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                          </>
                        ) : m.status === "declined" ? (
                          "Declined"
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" /> Pending
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {m.status !== "accepted" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => resendInvite(m)}
                          title="Resend invite"
                        >
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMember(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          🔒 Privacy: Location सिर्फ Accept किए गए परिवार को दिखती है।
        </p>
      </div>
    </div>
  );
};

export default FamilySafetyPage;
