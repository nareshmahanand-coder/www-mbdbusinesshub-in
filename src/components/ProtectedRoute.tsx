import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKycStatus } from "@/hooks/useKycStatus";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If true, skip the KYC + membership onboarding flow (used by /ekyc and /membership themselves). */
  allowDuringOnboarding?: boolean;
}

const FullScreenLoader = ({ label }: { label?: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
  </div>
);

export default function ProtectedRoute({
  children,
  allowDuringOnboarding = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, loading: authLoading, isSuperUser } = useAuth();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const { isMember, loading: memberLoading } = useBharatGauravMembership();

  // 1. Wait for Supabase session hydration before deciding anything.
  if (authLoading) {
    return <FullScreenLoader label="Loading…" />;
  }

  // 2. Unauthenticated → /login?next=<current path>
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // Admins / super-users bypass onboarding entirely.
  if (isSuperUser) {
    return <>{children}</>;
  }

  // Onboarding pages themselves should render once the user is authenticated.
  if (allowDuringOnboarding) {
    return <>{children}</>;
  }

  // 3. Wait for KYC + membership status before enforcing onboarding redirects.
  if (kycLoading || memberLoading) {
    return <FullScreenLoader label="Checking your account…" />;
  }

  // 4. New / incomplete users → /ekyc → /membership → /dashboard
  if (!hasKyc && location.pathname !== "/ekyc") {
    return <Navigate to="/ekyc" replace />;
  }
  if (hasKyc && !isMember && location.pathname !== "/membership") {
    return <Navigate to="/membership" replace />;
  }

  // 5. Fully onboarded → render the requested route.
  return <>{children}</>;
}
