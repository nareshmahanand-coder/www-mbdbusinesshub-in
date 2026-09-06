import { Shop } from "@/data/sampleShops";
import { MapPin, Phone, MessageCircle, Star, ShieldCheck, Flag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useMembershipGate } from "@/hooks/useMembershipGate";
import { getVehicleInfo } from "@/data/categoryFields";
import { VehicleSummary, VehicleDetailsDialog } from "@/components/VehicleInfoCard";

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(s)}
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              s <= (hover || rating) ? "fill-saffron text-saffron" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ShopCard = ({ shop }: { shop: Shop }) => {
  const [reported, setReported] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [reviews, setReviews] = useState(shop.reviews || []);
  const { requireMembership, membershipDialog } = useMembershipGate();
  const vehicle = getVehicleInfo(shop.category, shop.categoryDetails, shop.ownerName);

  const handleWhatsApp = () => {
    requireMembership(() => {
      const message = `नमस्ते! मैं आपके पास मेरा भारत दुकान के ज़रिए आया/आई हूँ और मुझे आपकी दुकान "${shop.name}" से सामान की तलाश है। कृपया बताइए क्या उपलब्ध है।`;
      window.open(`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
    });
  };

  const handleCall = () => {
    requireMembership(() => window.open(`tel:+${shop.phone}`));
  };

  const handleReport = () => {
    setReported(true);
    toast.success("Shop reported. We will review it shortly.");
  };

  const handleSubmitReview = () => {
    if (userRating === 0) {
      toast.error("कृपया रेटिंग दें (Please select a rating)");
      return;
    }
    const trimmed = userComment.trim();
    if (!trimmed || trimmed.length > 500) {
      toast.error("कृपया समीक्षा लिखें (max 500 chars)");
      return;
    }
    const newReview = {
      id: `r-${Date.now()}`,
      userName: "You",
      rating: userRating,
      comment: trimmed,
      date: new Date().toISOString().split("T")[0],
    };
    setReviews((prev) => [newReview, ...prev]);
    setUserRating(0);
    setUserComment("");
    toast.success("आपकी समीक्षा सबमिट हो गई! (Review submitted)");
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : shop.rating.toFixed(1);
  const totalReviews = (shop.reviewCount || 0) + reviews.filter(r => r.userName === "You").length;

  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-xl ${
      shop.flagship
        ? "ring-2 ring-[hsl(45,90%,55%)] shadow-[0_0_24px_hsl(45,90%,55%,0.45)] border-[hsl(45,90%,55%)] bg-gradient-to-br from-background to-[hsl(45,80%,50%,0.06)]"
        : shop.golden
        ? "ring-2 ring-[hsl(45,90%,50%)] shadow-[0_0_18px_hsl(45,90%,50%,0.4)] border-[hsl(45,90%,50%)]"
        : shop.premium
        ? "ring-2 ring-saffron shadow-[0_0_16px_hsl(var(--saffron)/0.35)] border-saffron"
        : ""
    }`}>
      <div className="absolute right-0 top-0 h-1 w-full tiranga-stripe" />
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{shop.name}</h3>
              {shop.verified && (
                <ShieldCheck className="h-5 w-5 text-green-india" />
              )}
            </div>
            <p className="font-hindi text-sm text-muted-foreground">{shop.nameHindi}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {shop.flagship ? (
              <Badge className="bg-gradient-to-r from-[hsl(45,90%,50%)] via-[hsl(40,95%,55%)] to-[hsl(35,90%,50%)] text-[hsl(140,40%,12%)] text-[10px] font-extrabold px-3 py-0.5 shadow-lg">
                🌾 FLAGSHIP
              </Badge>
            ) : shop.golden ? (
              <Badge className="bg-gradient-to-r from-[hsl(45,95%,50%)] to-[hsl(38,92%,48%)] text-[hsl(30,60%,15%)] text-[10px] font-extrabold px-3 py-0.5 shadow-md">
                👑 Golden Merchant
              </Badge>
            ) : shop.premium ? (
              <Badge className="bg-gradient-to-r from-saffron to-[hsl(35,90%,50%)] text-primary-foreground text-[10px] font-bold px-3 py-0.5 shadow-md animate-pulse">
                ⭐ Premium ✓
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-india text-green-india text-[10px] font-bold">
                FREE
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {shop.category}
            </Badge>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-saffron" />
          <span>{shop.address}{shop.city ? `, ${shop.city}` : ""} - {shop.pincode}</span>
        </div>

        {/* Rating display */}
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="mb-4 flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
        >
          <StarRating rating={Math.round(Number(avgRating))} />
          <span className="text-sm font-semibold">{avgRating}</span>
          <span className="text-xs text-muted-foreground">({totalReviews} reviews)</span>
        </button>

        {vehicle && <VehicleSummary info={vehicle} />}

        <p className="mb-4 text-sm text-muted-foreground">{shop.description}</p>

        {/* Review section (expandable) */}
        {showReviews && (
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="mb-2 text-sm font-bold text-foreground">
              ⭐ Reviews <span className="font-hindi text-xs font-normal text-muted-foreground">• समीक्षाएं</span>
            </h4>

            {/* Existing reviews */}
            {reviews.length > 0 ? (
              <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded border border-border bg-background p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{r.userName}</span>
                      <StarRating rating={r.rating} />
                      <span className="text-[10px] text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground">No reviews yet. Be the first!</p>
            )}

            {/* Submit review */}
            <div className="space-y-2 border-t border-border pt-2">
              <p className="text-xs font-semibold text-foreground">अपनी रेटिंग दें (Rate this shop):</p>
              <StarRating rating={userRating} onRate={setUserRating} interactive />
              <Textarea
                placeholder="अपनी समीक्षा लिखें... (Write your review)"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="min-h-[60px] text-xs"
                maxLength={500}
              />
              <Button size="sm" onClick={handleSubmitReview} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="mr-1 h-3 w-3" />
                Submit Review / समीक्षा भेजें
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-india text-primary-foreground hover:bg-green-india/90 font-hindi"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            व्हाट्सएप पर ऑर्डर दें
          </Button>
          <Button
            onClick={handleCall}
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Phone className="mr-1 h-4 w-4" />
            Direct Call
          </Button>
          {vehicle && (
            <div className="w-full">
              <VehicleDetailsDialog info={vehicle} shopName={shop.name} />
            </div>
          )}
        </div>

        <button
          onClick={handleReport}
          disabled={reported}
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-destructive/70 transition-colors hover:text-destructive disabled:opacity-50"
        >
          <Flag className="h-3 w-3" />
          {reported ? "Reported" : "Report Shop"}
        </button>
      </CardContent>
      {membershipDialog}
    </Card>
  );
};

export default ShopCard;
