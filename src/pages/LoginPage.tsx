import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.jpeg";
import { LogIn, Phone, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error("कृपया 10 अंकों का मोबाइल नंबर दर्ज करें");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    if (error) {
      toast.error(error.message || "OTP भेजने में विफल");
      setLoading(false);
      return;
    }
    setOtpSent(true);
    setLoading(false);
    toast.success(`OTP भेजा गया: +91 ${phone}`);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("कृपया 6 अंकों का OTP दर्ज करें");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: "sms",
    });
    if (error) {
      toast.error(error.message || "OTP सत्यापन विफल");
      setLoading(false);
      return;
    }
    toast.success("लॉगिन सफल!");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-saffron/10 via-background to-green-india/10">
      {/* Tricolor bar */}
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-green-india" />

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-2 border-saffron/30 shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-2">
            <img
              src={logoCircle}
              alt="Mera Bharat Dukaan"
              className="mx-auto h-24 w-24 rounded-full object-cover shadow-lg border-4 border-saffron/40"
            />
            <CardTitle className="text-2xl font-bold text-foreground">
              मेरा भारत दुकान
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Mera Bharat Dukaan — Digital India Marketplace
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Welcome message */}
            <div className="rounded-xl bg-saffron/10 border border-saffron/20 p-4 text-center">
              <p className="font-hindi text-sm leading-relaxed text-foreground">
                मेरा भारत दुकान में आपका स्वागत है! 0% कमीशन, सीधा भुगतान और
                आत्मनिर्भर भारत की दिशा में एक छोटा सा कदम। आगे बढ़ने के लिए
                कृपया लॉगिन करें।
              </p>
            </div>

            {/* Google Login */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base py-5 gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              Login with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">या / OR</span>
              </div>
            </div>

            {/* Phone Login */}
            {!otpSent ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="मोबाइल नंबर दर्ज करें"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1"
                    maxLength={10}
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5 gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
                  Login with Mobile Number
                </Button>
              </>
            ) : (
              <>
                <Input
                  type="tel"
                  placeholder="6 अंकों का OTP दर्ज करें"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-5"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Verify & Login
                </Button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  ← नंबर बदलें
                </button>
              </>
            )}

            <p className="text-center text-xs text-muted-foreground pt-2">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service & Privacy Policy
              </a>
            </p>

            <div className="text-center">
              <span className="inline-block rounded-full bg-green-india/10 px-3 py-1 text-[10px] font-semibold text-green-india">
                🇮🇳 Digital India Initiative
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
