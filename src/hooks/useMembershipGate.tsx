import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { useMerchantAccess } from "@/hooks/useMerchantAccess";
import { useKycStatus } from "@/hooks/useKycStatus";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Action-level paywall.
 *
 * Browsing every module (Jobs, Marriage Bureau, Old Goods, Nearby Shops, Skills,
 * Bharat Kavach) and Bharat Mitra AI stay completely free. Only a real service
 * action (revealing a contact number, chatting, sending interest) asks for the
 * ₹10 Bharat Gaurav Membership.
 *
 * Merchants on the ₹99 monthly plan are exempt.
 */
export const useMembershipGate = () => {
  const navigate = useNavigate();
  const { user, isSuperUser } = useAuth();
  const { isMember, loading: memberLoading } = useBharatGauravMembership();
  const { state: merchantState } = useMerchantAccess();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const [isAgent, setIsAgent] = useState(false);
  const [agentLoading, setAgentLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsAgent(false); setAgentLoading(false); return; }
    setAgentLoading(true);
    (async () => {
      const { data } = await supabase
        .from("agents")
        .select("id,status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setIsAgent(!!data && ["approved", "pending"].includes(String(data.status)));
      setAgentLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Merchants who only registered for free (no active ₹99 plan) are NOT exempt.
  const hasAccess =
    isSuperUser || isAgent || merchantState === "active" || (isMember && hasKyc);

  /** Runs `action` when the user has access, otherwise opens the ₹10 membership prompt. */
  const requireMembership = useCallback(
    (action: () => void) => {
      if (!user) {
        navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (memberLoading || kycLoading || agentLoading || merchantState === "loading") return;
      if (hasAccess) {
        action();
        return;
      }
      setOpen(true);
    },
    [user, navigate, memberLoading, kycLoading, agentLoading, merchantState, hasAccess],
  );

  const membershipDialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-hindi">e-KYC आवश्यक है</AlertDialogTitle>
          <AlertDialogDescription className="font-hindi">
            कृपया इस सेवा का लाभ उठाने के लिए अपनी e-KYC पूरी करें।
            {" "}इसके बाद ₹10 की भारत गौरव सदस्यता के साथ सभी सुविधाएँ हमेशा के लिए अनलॉक हो जाएँगी।
            देखना और ब्राउज़ करना हमेशा मुफ़्त है।
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-hindi">बाद में</AlertDialogCancel>
          <AlertDialogAction className="font-hindi" onClick={() => navigate(hasKyc ? "/membership" : "/ekyc?next=/membership")}>
            OK / आगे बढ़ें
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requireMembership, membershipDialog, hasAccess };
};
