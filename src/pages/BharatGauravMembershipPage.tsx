import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Loader2, Landmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import mbdLogo from "@/assets/mbd-logo.png";

const BharatGauravMembershipPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isActive, loading } = useBharatGauravMembership();

  useEffect(() => {
    if (!loading && isActive) navigate("/dashboard", { replace: true });
  }, [loading, isActive, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/40 to-emerald-50/40 px-4 py-6">
      <div className="mx-auto max-w-md">
        <Card className="border-2 border-gray-200 bg-white p-5 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-[#FF8C00] bg-white">
              <img src={mbdLogo} alt="मेरा भारत दुकान" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1a237e]">भारत गौरव मेंबरशिप</h1>
            <p className="mt-1 text-sm font-semibold text-gray-700">भारत के हर नागरिक के लिए आवश्यक है</p>

            <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="rounded-lg bg-[#FF8C00]/10 px-3 py-1 text-[11px] font-bold text-[#FF8C00]">DIGITAL INDIA</span>
              <Landmark className="h-4 w-4 text-[#1a237e]" />
              <span className="text-xs font-bold text-[#1a237e]">बैंक वेरिफिकेशन</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
            className="mt-4 w-full text-center text-xs text-gray-500 underline"
          >
            ← दूसरे अकाउंट से लॉगिन करें
          </button>

          {loading && (
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" /> सदस्यता जांच रहे हैं...
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BharatGauravMembershipPage;