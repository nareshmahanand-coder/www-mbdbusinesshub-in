import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";


import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import AdminDashboard from "./pages/AdminDashboard";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import LegalPage from "./pages/LegalPage";
import KisanRegistration from "./pages/KisanRegistration";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import MatrimonyPage from "./pages/MatrimonyPage";
import ClassifiedsPage from "./pages/ClassifiedsPage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import ServicesPage from "./pages/ServicesPage";
import MyProfilePage from "./pages/MyProfilePage";
import ShopProfilePage from "./pages/ShopProfilePage";
import SkillDevelopmentPage from "./pages/SkillDevelopmentPage";
import MembershipGatePage from "./pages/MembershipGatePage";
import FamilySafetyPage from "./pages/FamilySafetyPage";
import FamilyInvitePage from "./pages/FamilyInvitePage";
import EkycPage from "./pages/EkycPage";
import { useKycStatus } from "@/hooks/useKycStatus";
import { useLastKnownLocation } from "@/hooks/useLastKnownLocation";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useMembership } from "@/hooks/useMembership";

import NotFound from "./pages/NotFound";
import BharatMitraChatbot from "./components/BharatMitraChatbot";
import AdminMessageListener from "./components/AdminMessageListener";

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const MaintenanceScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
    <div className="max-w-md space-y-3">
      <h1 className="text-3xl font-extrabold text-foreground">Coming Soon</h1>
      <p className="font-hindi text-muted-foreground">मेरा भारत दुकान अभी रखरखाव में है। कृपया थोड़ी देर बाद वापस आएं।</p>
    </div>
  </div>
);

// Razorpay review mode: Home is public and never locked behind auth/KYC/membership.
const PublicHomeRoute = () => {
  return <Index />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <>{children}</>;
};

const KycRequiredRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading, isSuperUser } = useAuth();
  const { isActive: membershipActive, loading: membershipLoading } = useMembership();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const location = useLocation();
  if (authLoading || (user && (membershipLoading || kycLoading))) return <FullScreenLoader />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (!isSuperUser && !hasKyc) return <Navigate to="/ekyc" replace />;
  if (!isSuperUser && !membershipActive) return <Navigate to="/membership" replace />;
  return <>{children}</>;
};

const MembershipRoute = () => {
  const { user, loading: authLoading, isSuperUser } = useAuth();
  const { isActive: membershipActive, loading: membershipLoading } = useMembership();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  if (authLoading || (user && (membershipLoading || kycLoading))) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login?next=/membership" replace />;
  if (!isSuperUser && !hasKyc) return <Navigate to="/ekyc" replace />;
  if (!isSuperUser && membershipActive) return <Navigate to="/dashboard" replace />;
  return <MembershipGatePage onActivated={() => { window.location.href = "/dashboard"; }} />;
};

const MerchantAccessRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PublicLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperUser } = useAuth();
  const { isActive: membershipActive, loading: membershipLoading } = useMembership();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || sessionStorage.getItem("mbd-auth-next") || "/dashboard";
  if (loading || (user && (membershipLoading || kycLoading))) return <FullScreenLoader />;
  if (user && !isSuperUser && !hasKyc) return <Navigate to="/ekyc" replace />;
  if (user && !isSuperUser && !membershipActive) return <Navigate to="/membership" replace />;
  if (user) return <Navigate to={next.startsWith("/") ? next : "/dashboard"} replace />;
  return <>{children}</>;
};



const AppShell = () => {
  useLastKnownLocation();
  const { isSuperUser } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();

  if (settingsLoading) return <FullScreenLoader />;
  if (settings.maintenance_mode && !isSuperUser) return <MaintenanceScreen />;

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute><LoginPage /></PublicLoginRoute>} />
        <Route path="/signup" element={<PublicLoginRoute><LoginPage initialMode="signup" /></PublicLoginRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/~oauth/*" element={<FullScreenLoader />} />
        <Route path="/ekyc" element={<EkycPage />} />
        <Route path="/membership" element={<MembershipRoute />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<LegalPage section="contact" />} />
        <Route path="/privacy-policy" element={<LegalPage section="privacy" />} />
        <Route path="/refund-policy" element={<LegalPage section="refund" />} />
        <Route path="/" element={<PublicHomeRoute />} />
        <Route path="/merchant" element={<KycRequiredRoute><MerchantPortal /></KycRequiredRoute>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/settings" element={<KycRequiredRoute><Navigate to="/dashboard?tab=settings" replace /></KycRequiredRoute>} />
        <Route path="/kisan" element={<KycRequiredRoute><KisanRegistration /></KycRequiredRoute>} />
        <Route path="/dashboard" element={<KycRequiredRoute><CustomerDashboard /></KycRequiredRoute>} />
        <Route path="/merchant-dashboard" element={<KycRequiredRoute><MerchantAccessRoute><MerchantDashboard /></MerchantAccessRoute></KycRequiredRoute>} />
        <Route path="/matrimony" element={<KycRequiredRoute><MatrimonyPage /></KycRequiredRoute>} />
        <Route path="/classifieds" element={<KycRequiredRoute><ClassifiedsPage /></KycRequiredRoute>} />
        <Route path="/jobs" element={<KycRequiredRoute><JobsPage /></KycRequiredRoute>} />
        <Route path="/jobs/:id" element={<KycRequiredRoute><JobDetailPage /></KycRequiredRoute>} />
        <Route path="/services" element={<KycRequiredRoute><ServicesPage /></KycRequiredRoute>} />
        <Route path="/my-profile" element={<KycRequiredRoute><MyProfilePage /></KycRequiredRoute>} />
        <Route path="/shop/:id" element={<KycRequiredRoute><ShopProfilePage /></KycRequiredRoute>} />
        <Route path="/skills" element={<KycRequiredRoute><SkillDevelopmentPage /></KycRequiredRoute>} />
        <Route path="/family-safety" element={<KycRequiredRoute><FamilySafetyPage /></KycRequiredRoute>} />
        <Route path="/family-invite/:token" element={<FamilyInvitePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AdminMessageListener />
      <BharatMitraChatbot />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
