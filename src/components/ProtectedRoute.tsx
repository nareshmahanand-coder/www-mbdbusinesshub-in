import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, loading: authLoading } = useAuth();

  // 1. Wait for Supabase session hydration before deciding anything.
  if (authLoading) {
    return <FullScreenLoader label="Loading…" />;
  }

  // 2. Unauthenticated → /login?next=<current path>
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // 3. Browsing is always free — e-KYC / membership are enforced only at the
  // action level (see useMembershipGate), never as a route-level redirect.
  return <>{children}</>;
}
