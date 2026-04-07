import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { NoImage } from "@/components/ImageUpload";
import type { ClassifiedAd } from "@/pages/ClassifiedsPage";

const PhotoCarousel = ({ photos }: { photos: string[] }) => {
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) return <NoImage />;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <img src={photos[idx]} alt="" className="h-full w-full object-cover" />
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
    </div>
  );
};

interface Props {
  ad: ClassifiedAd;
  isFeatured?: boolean;
}

const ClassifiedsAdCard = ({ ad, isFeatured }: Props) => (
  <Card className="overflow-hidden border-border hover:shadow-md transition-shadow">
    <div className="relative">
      <PhotoCarousel photos={ad.photos?.filter(Boolean) || []} />
      {isFeatured && (
        <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[9px] px-1.5 py-0.5 rounded-md shadow font-bold gap-1">
          <Star className="h-2.5 w-2.5 fill-current" /> FEATURED
        </Badge>
      )}
    </div>
    <div className="p-2.5 space-y-1">
      <p className="text-base font-bold text-foreground leading-tight">
        ₹{(ad.price ?? 0).toLocaleString("en-IN")}
      </p>
      <p className="text-xs text-foreground line-clamp-1">{ad.title}</p>
      <div className="flex items-center justify-between pt-1">
        {ad.city && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />{ad.city}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {new Date(ad.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>
      {ad.contact_phone && (
        <a href={`tel:${ad.contact_phone}`} className="block mt-1.5">
          <Button size="sm" variant="outline" className="w-full h-7 text-[10px]">
            <Phone className="mr-1 h-3 w-3" /> Call Seller
          </Button>
        </a>
      )}
    </div>
  </Card>
);

export default ClassifiedsAdCard;
