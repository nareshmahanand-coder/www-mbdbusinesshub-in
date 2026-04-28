import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, ChevronLeft, ChevronRight, Star, Camera, BadgeCheck, MessageCircle, Phone } from "lucide-react";
import { NoImage } from "@/components/ImageUpload";
import type { ClassifiedAd } from "@/pages/ClassifiedsPage";

const PhotoCarousel = ({ photos, title, onOpen }: { photos: string[]; title: string; onOpen?: () => void }) => {
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) return <NoImage />;

  return (
    <button type="button" onClick={onOpen} className="relative block aspect-[4/3] w-full overflow-hidden bg-muted text-left">
      <img src={photos[idx]} alt={title} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow"
          >
            <ChevronRight className="h-3.5 w-3.5 text-foreground" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-accent" : "bg-background/60"}`} />
            ))}
          </div>
        </>
      )}
    </button>
  );
};

interface Props {
  ad: ClassifiedAd;
  isFeatured?: boolean;
  onOpen?: () => void;
  onShowNumber?: () => void;
  onChat?: () => void;
  isNumberVisible?: boolean;
}

const conditionLabel = (condition?: string) => {
  const labels: Record<string, string> = {
    new: "New",
    "like-new": "Like new",
    used: "Good condition",
    old: "Old item",
  };
  return labels[condition || ""] || condition || "Used";
};

const ClassifiedsAdCard = ({ ad, isFeatured, onOpen, onShowNumber, onChat, isNumberVisible }: Props) => (
  <Card
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={event => {
      if ((event.key === "Enter" || event.key === " ") && onOpen) onOpen();
    }}
    className="group overflow-hidden border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="relative">
      <PhotoCarousel photos={ad.photos?.filter(Boolean) || []} title={ad.title} onOpen={onOpen} />
      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
        <Camera className="h-3 w-3" /> {ad.photos?.filter(Boolean).length || 0}
      </div>
      {isFeatured && (
        <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 rounded-md shadow font-bold gap-1">
          <Star className="h-2.5 w-2.5 fill-current" /> FEATURED
        </Badge>
      )}
    </div>
    <div className="p-3 space-y-1.5">
      <p className="text-lg font-extrabold text-foreground leading-tight">
        ₹{(ad.price ?? 0).toLocaleString("en-IN")}
      </p>
      <p className="text-sm font-medium text-foreground line-clamp-2 min-h-10">{ad.title}</p>
      <div className="flex items-center gap-1 text-[11px] font-medium text-green-india">
        <BadgeCheck className="h-3 w-3" /> {conditionLabel(ad.condition)}
      </div>
      <div className="flex items-center justify-between pt-1 gap-2">
        {ad.city && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />{ad.city}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {new Date(ad.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 pt-1.5 sm:grid-cols-2">
        <Button
          size="sm"
          variant="outline"
          className="h-9 min-w-0 text-[11px] font-bold group-hover:border-accent"
          onClick={event => { event.stopPropagation(); onShowNumber?.(); }}
        >
          <Phone className="mr-1 h-3 w-3 shrink-0" />
          <span className="truncate">{isNumberVisible ? (ad.contact_phone || "Unavailable") : "Show Number"}</span>
        </Button>
        <Button
          size="sm"
          className="h-9 min-w-0 bg-accent text-[11px] font-bold text-accent-foreground hover:bg-accent/90"
          onClick={event => { event.stopPropagation(); onChat?.(); }}
        >
          <MessageCircle className="mr-1 h-3 w-3 shrink-0" />
          <span className="truncate">Chat with Seller</span>
        </Button>
      </div>
      <Button size="sm" variant="ghost" className="mt-1 h-8 w-full text-[11px]" onClick={event => { event.stopPropagation(); onOpen?.(); }}>
        <Eye className="mr-1 h-3 w-3" /> View Details
      </Button>
    </div>
  </Card>
);

export default ClassifiedsAdCard;
