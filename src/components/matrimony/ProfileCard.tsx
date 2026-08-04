import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, MapPin, Briefcase, GraduationCap, Ruler, Send, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MatrimonyProfile } from "@/pages/MatrimonyPage";
import { getAge } from "@/pages/MatrimonyPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMembershipGate } from "@/hooks/useMembershipGate";

interface Props {
  profile: MatrimonyProfile;
  isRecommended?: boolean;
  onRequestContact: () => void;
  userId?: string;
}

const MatrimonyProfileCard = ({ profile: p, isRecommended, userId }: Props) => {
  const [viewOpen, setViewOpen] = useState(false);
  const { requireMembership, membershipDialog } = useMembershipGate();
  const age = getAge(p.dob);
  const isOnline = Math.random() > 0.5; // Simulated — replace with real presence

  const requestContact = () => {
    requireMembership(async () => {
      if (!userId) { toast.error("Please login first"); return; }
      const { error } = await supabase.from("contact_requests").insert({ requester_id: userId, profile_id: p.id });
      if (error?.code === "23505") toast.info("Request already sent");
      else if (error) toast.error("Failed to send request");
      else toast.success("Interest sent! ✨");
    });
  };

  return (
    <>
      <Card className={`overflow-hidden bg-white border-0 shadow-sm hover:shadow-lg transition-all ${isRecommended ? "ring-1 ring-[hsl(40,90%,65%)]" : ""}`}>
        {/* Photo */}
        <div className="relative aspect-[3/4] bg-gradient-to-b from-[hsl(340,20%,90%)] to-[hsl(340,10%,95%)] overflow-hidden">
          {p.photos?.[0] ? (
            <img src={p.photos[0]} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Heart className="h-16 w-16 text-[hsl(340,30%,80%)]" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isRecommended && (
              <Badge className="bg-[hsl(40,90%,50%)] text-white text-[9px] px-1.5 py-0.5 shadow font-bold border-0">
                ⭐ RECOMMENDED
              </Badge>
            )}
          </div>

          {/* Online indicator */}
          <div className="absolute top-2 right-2">
            <span className={`flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full shadow ${isOnline ? "bg-[hsl(140,70%,40%)] text-white" : "bg-white/80 text-muted-foreground"}`}>
              <Circle className={`h-2 w-2 ${isOnline ? "fill-white text-white" : "fill-muted-foreground/50 text-muted-foreground/50"}`} />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Bottom gradient overlay with name */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-10">
            <p className="text-white font-bold text-base leading-tight">{p.name}</p>
            <div className="flex items-center gap-2 text-white/80 text-[11px] mt-0.5">
              {age && <span>{age} yrs</span>}
              {p.height && <span>• {p.height}</span>}
              {p.city && (
                <span className="flex items-center gap-0.5">
                  • <MapPin className="h-2.5 w-2.5" />{p.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {p.profession && (
              <span className="flex items-center gap-1 text-[10px] bg-[hsl(340,20%,95%)] text-[hsl(340,40%,35%)] px-2 py-0.5 rounded-full">
                <Briefcase className="h-2.5 w-2.5" /> {p.profession}
              </span>
            )}
            {p.education && (
              <span className="flex items-center gap-1 text-[10px] bg-[hsl(220,30%,95%)] text-[hsl(220,50%,35%)] px-2 py-0.5 rounded-full">
                <GraduationCap className="h-2.5 w-2.5" /> {p.education}
              </span>
            )}
          </div>

          {p.about_me && (
            <p className="text-[11px] text-muted-foreground line-clamp-2">{p.about_me}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-8 text-[11px] bg-[hsl(340,60%,25%)] hover:bg-[hsl(340,60%,30%)] text-white"
              onClick={requestContact}
            >
              <Heart className="h-3 w-3 mr-1 fill-current" /> Connect
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-[11px] border-[hsl(340,30%,80%)] text-[hsl(340,60%,30%)]"
              onClick={() => setViewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" /> View Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Full Profile Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {p.name}
            </DialogTitle>
          </DialogHeader>

          {/* Photos */}
          {p.photos && p.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {p.photos.filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt="" className="h-40 w-32 rounded-xl object-cover shrink-0 border border-border" />
              ))}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {age && <InfoItem label="Age" value={`${age} years`} />}
              {p.height && <InfoItem label="Height" value={p.height} />}
              {p.gender && <InfoItem label="Gender" value={p.gender} />}
              {p.city && <InfoItem label="City" value={p.city} />}
              {p.education && <InfoItem label="Education" value={p.education} />}
              {p.profession && <InfoItem label="Profession" value={p.profession} />}
            </div>
            {p.job_details && <DetailBlock label="Job Details" value={p.job_details} />}
            {p.about_me && <DetailBlock label="About Me" value={p.about_me} />}
            {p.family_background && <DetailBlock label="Family Background" value={p.family_background} />}
            {p.hobbies && <DetailBlock label="Hobbies" value={p.hobbies} />}
          </div>

          <Button className="w-full bg-[hsl(340,60%,25%)] text-white" onClick={requestContact}>
            <Send className="h-4 w-4 mr-1.5" /> Send Interest
          </Button>
        </DialogContent>
      </Dialog>
      {membershipDialog}
    </>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/50 rounded-lg p-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-xs font-medium text-foreground">{value}</p>
  </div>
);

const DetailBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold text-foreground mb-0.5">{label}</p>
    <p className="text-xs text-muted-foreground">{value}</p>
  </div>
);

export default MatrimonyProfileCard;
