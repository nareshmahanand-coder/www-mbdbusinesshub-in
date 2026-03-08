import { Shop } from "@/data/sampleShops";
import { MapPin, Phone, MessageCircle, Star, ShieldCheck, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

const ShopCard = ({ shop }: { shop: Shop }) => {
  const [reported, setReported] = useState(false);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${shop.whatsapp}?text=Hi! I found your shop on Mera Bharat Dukaan.`, "_blank");
  };

  const handleCall = () => {
    window.open(`tel:+${shop.phone}`);
  };

  const handleReport = () => {
    setReported(true);
    toast.success("Shop reported. We will review it shortly.");
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-xl">
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
          <Badge variant="secondary" className="text-xs">
            {shop.category}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-saffron" />
          <span>{shop.address}{shop.city ? `, ${shop.city}` : ""} - {shop.pincode}</span>
        </div>

        <div className="mb-4 flex items-center gap-1">
          <Star className="h-4 w-4 fill-saffron text-saffron" />
          <span className="text-sm font-semibold">{shop.rating}</span>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{shop.description}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-india text-primary-foreground hover:bg-green-india/90"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            WhatsApp Order
          </Button>
          <Button
            onClick={handleCall}
            variant="outline"
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Phone className="mr-1 h-4 w-4" />
            Direct Call
          </Button>
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
    </Card>
  );
};

export default ShopCard;
