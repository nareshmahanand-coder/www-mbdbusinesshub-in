import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { useMerchantAccess } from "@/hooks/useMerchantAccess";
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
  const [open, setOpen] = useState(false);

  const hasAccess = isSuperUser || isMember || merchantState === "active";

  /** Runs `action` when the user has access, otherwise opens the ₹10 membership prompt. */
  const requireMembership = useCallback(
    (action: () => void) => {
      if (!user) {
        navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (memberLoading || merchantState === "loading") return;
      if (hasAccess) {
        action();
        return;
      }
      setOpen(true);
    },
    [user, navigate, memberLoading, merchantState, hasAccess],
  );

  const membershipDialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>भारत गौरव सदस्यता आवश्यक है</AlertDialogTitle>
          <AlertDialogDescription>
            यह सेवा इस्तेमाल करने के लिए सिर्फ ₹10/महीना (या ₹100/साल) की भारत गौरव सदस्यता चाहिए।
            देखना और ब्राउज़ करना हमेशा मुफ़्त है। ₹99 वाले मर्चेंट प्लान वालों को इसकी ज़रूरत नहीं।
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>बाद में</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate("/membership")}>₹10 सदस्यता लें</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requireMembership, membershipDialog, hasAccess };
};
