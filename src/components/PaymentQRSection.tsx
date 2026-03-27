import { Button } from "@/components/ui/button";
import upiQr from "@/assets/upi-qr.jpeg";

const UPI_ID = "Nmahanand1@ybl";
const UPI_BASE = `upi://pay?pa=${UPI_ID}&pn=MeraBharatDukaan&cu=INR`;

interface PaymentQRSectionProps {
  amount: number;
  label?: string;
}

const PaymentQRSection = ({ amount, label }: PaymentQRSectionProps) => {
  const upiLink = `${UPI_BASE}&am=${amount}`;

  return (
    <div className="space-y-3">
      {/* QR Code */}
      <div className="flex justify-center">
        <img
          src={upiQr}
          alt="Scan QR to Pay"
          className="h-36 w-36 rounded-xl border-2 border-accent/30 shadow-md"
        />
      </div>

      {/* UPI Buttons */}
      <a href={upiLink} className="block">
        <Button className="w-full bg-[hsl(265,80%,45%)] hover:bg-[hsl(265,80%,40%)] text-primary-foreground font-bold text-base py-5 gap-2 shadow-lg">
          📱 Pay {label || `₹${amount}`} via UPI
        </Button>
      </a>
      <div className="flex gap-2">
        <a href={upiLink} className="flex-1">
          <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">PhonePe</Button>
        </a>
        <a href={upiLink} className="flex-1">
          <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">GPay</Button>
        </a>
        <a href={upiLink} className="flex-1">
          <Button variant="outline" className="w-full border-[hsl(265,80%,45%)] text-[hsl(265,80%,45%)] font-semibold text-xs">Paytm</Button>
        </a>
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        UPI ID: <span className="font-mono font-bold text-foreground">{UPI_ID}</span>
      </p>
    </div>
  );
};

export default PaymentQRSection;
