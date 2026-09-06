import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Car, IdCard, ShieldCheck, User, Users, Info } from "lucide-react";
import { fuelBadgeLabel, type VehicleInfo } from "@/data/categoryFields";

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  ) : null;

const DocImage = ({ label, url }: { label: string; url?: string }) =>
  url ? (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={label} loading="lazy" className="h-24 w-full rounded-lg border border-border object-cover" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </a>
  ) : null;

/** Compact Rapido-style vehicle strip shown inside a public listing card. */
export const VehicleSummary = ({ info }: { info: VehicleInfo }) => {
  const fuel = fuelBadgeLabel(info.fuelType);
  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-3">
        {info.driverPhoto ? (
          <img src={info.driverPhoto} alt={info.driverName || "Driver"} loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full border-2 border-saffron object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-saffron bg-background">
            <User className="h-6 w-6 text-saffron" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {info.driverName ? `Driver: ${info.driverName}` : info.vehicleType || "Driver"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[info.vehicleModel, info.vehicleNumber].filter(Boolean).join(" • ") || info.vehicleType}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {fuel && <Badge className="bg-green-india text-primary-foreground text-[10px]">{fuel}</Badge>}
            {info.seatingCapacity && (
              <Badge variant="secondary" className="text-[10px]">
                <Users className="mr-1 h-3 w-3" />{info.seatingCapacity} seats
              </Badge>
            )}
          </div>
        </div>
        {info.vehiclePhoto && (
          <img src={info.vehiclePhoto} alt="Vehicle" loading="lazy"
            className="h-14 w-20 shrink-0 rounded-lg border border-border object-cover" />
        )}
      </div>
    </div>
  );
};

/** Full info modal — RC, insurance, licence, driver & vehicle photos. */
export const VehicleDetailsDialog = ({
  info, shopName, trigger,
}: { info: VehicleInfo; shopName: string; trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="flex-1">
            <Info className="mr-1 h-4 w-4" /> View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5 text-saffron" /> {shopName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <DocImage label="Driver Photo / ड्राइवर" url={info.driverPhoto} />
          <DocImage label="Vehicle Photo / गाड़ी" url={info.vehiclePhoto} />
        </div>

        <div className="rounded-lg border border-border p-3">
          <Row label="Driver / ड्राइवर" value={info.driverName} />
          <Row label="Vehicle Type" value={info.vehicleType} />
          <Row label="Model" value={info.vehicleModel} />
          <Row label="Vehicle Number" value={info.vehicleNumber} />
          <Row label="Fuel / Power" value={fuelBadgeLabel(info.fuelType) || undefined} />
          <Row label="Seating Capacity" value={info.seatingCapacity} />
          <Row label="Service Area / Route" value={info.serviceArea} />
          <Row label="Fare / किराया" value={info.fare} />
        </div>

        {(info.rcDetails || info.rcPhoto || info.insuranceDetails || info.insurancePhoto || info.licenseNumber || info.licensePhoto) && (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-green-india" /> Documents / दस्तावेज़
            </p>
            <Row label="RC Card" value={info.rcDetails} />
            <Row label="Insurance" value={info.insuranceDetails} />
            <Row label="Driving Licence" value={info.licenseNumber} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <DocImage label="RC" url={info.rcPhoto} />
              <DocImage label="Insurance" url={info.insurancePhoto} />
              <DocImage label="Licence" url={info.licensePhoto} />
            </div>
          </div>
        )}

        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <IdCard className="h-3 w-3" /> Details are provided by the driver/merchant.
        </p>
      </DialogContent>
    </Dialog>
  );
};
