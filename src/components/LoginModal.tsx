import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setOtpSent(true);
    toast.success(`OTP sent to +91 ${phone}`);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    toast.success("Login successful!");
    onOpenChange(false);
    setPhone("");
    setOtp("");
    setOtpSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <img
            src={logoCircle}
            alt="Mera Bharat Dukaan"
            className="mx-auto mb-2 h-20 w-20 rounded-full object-cover shadow-md"
          />
          <DialogTitle className="text-xl font-bold">
            {otpSent ? "Verify OTP" : "Login with Mobile OTP"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {otpSent
              ? `Enter the 6-digit OTP sent to +91 ${phone}`
              : "Enter your 10-digit mobile number to receive a verification code"}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!otpSent ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
                  +91
                </span>
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5"
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <Input
                type="tel"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={handleVerifyOtp}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5"
              >
                Verify & Login
              </Button>
              <button
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Change number
              </button>
            </>
          )}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Terms of Service & Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
