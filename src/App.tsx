import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";


import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import AdminDashboard from "./pages/AdminDashboard";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import KisanRegistration from "./pages/KisanRegistration";
import LoginPage from "./pages/LoginPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import MatrimonyPage from "./pages/MatrimonyPage";
import ClassifiedsPage from "./pages/ClassifiedsPage";
import JobsPage from "./pages/JobsPage";
import ServicesPage from "./pages/ServicesPage";
import MyProfilePage from "./pages/MyProfilePage";
import ShopProfilePage from "./pages/ShopProfilePage";
import SkillDevelopmentPage from "./pages/SkillDevelopmentPage";
import EkycPage from "./pages/EkycPage";
import FamilySafetyPage from "./pages/FamilySafetyPage";
import FamilyInvitePage from "./pages/FamilyInvitePage";
import { useKycStatus } from "@/hooks/useKycStatus";
import { useLastKnownLocation } from "@/hooks/useLastKnownLocation";
import { useMembership } from "@/hooks/useMembership";
import MembershipOverlay from "@/components/MembershipOverlay";

import NotFound from "./pages/NotFound";
import BharatMitraChatbot from "./components/BharatMitraChatbot";

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Public Home: shows Index to everyone. Logged-out users see it locked —
// any click anywhere redirects to /login. Logged-in users get the normal
// KYC + membership gating flow.
const PublicHomeRoute = () => {
  const { user, loading, isSuperUser } = useAuth();
  const { status, loading: kycLoading } = useKycStatus();
  const { isActive, loading: memLoading, refresh: refreshMembership } = useMembership();

  if (loading) return <FullScreenLoader />;

  // Logged-out: show Home as a locked preview. Any click → /login.
  if (!user) {
    return (
      <div className="relative min-h-screen">
        <div aria-hidden className="pointer-events-none select-none">
          <Index />
        </div>
        <ClickLockOverlay />
      </div>
    );
  }

  // Logged-in flow (same as ProtectedRoute)
  if (isSuperUser) return <Index />;
  if (kycLoading) return <FullScreenLoader />;
  if (status === "none" || status === "rejected") return <Navigate to="/ekyc" replace />;
  if (memLoading) return <FullScreenLoader />;
  if (!isActive) {
    return (
      <>
        <div className="pointer-events-none select-none blur-xl overflow-hidden max-h-screen">
          <Index />
        </div>
        <MembershipOverlay onActivated={refreshMembership} />
      </>
    );
  }
  return <Index />;
};

const ClickLockOverlay = () => {
  const navigate = useNavigate();
  const goLogin = () => navigate("/login");
  return (
    <button
      type="button"
      onClick={goLogin}
      onTouchStart={goLogin}
      aria-label="Login to continue"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/10 backdrop-blur-[1px] cursor-pointer"
    >
      <div className="m-4 mb-8 max-w-md w-full rounded-2xl bg-primary text-primary-foreground shadow-2xl px-6 py-4 text-center pointer-events-none">
        <p className="font-bold text-base">लॉगिन करें / Tap anywhere to Login</p>
        <p className="text-xs opacity-90 mt-1">Mera Bharat Dukaan में आपका स्वागत है</p>
      </div>
    </button>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperUser } = useAuth();
  const { status, loading: kycLoading } = useKycStatus();
  const { isActive, loading: memLoading, refresh: refreshMembership } = useMembership();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  // Super User bypass: skip KYC + membership entirely
  if (isSuperUser) return <>{children}</>;

  if (kycLoading) return <FullScreenLoader />;
  if (status === "none" || status === "rejected") return <Navigate to="/ekyc" replace />;

  if (memLoading) return <FullScreenLoader />;
  if (!isActive) {
    return (
      <>
        <div className="pointer-events-none select-none blur-xl overflow-hidden max-h-screen">
          {children}
        </div>
        <MembershipOverlay onActivated={refreshMembership} />
      </>
    );
  }

  return <>{children}</>;
};

const KycRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperUser } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  // Super User skips KYC entirely — straight to home
  if (isSuperUser) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
};



const AppShell = () => {
  useLastKnownLocation();
  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute><LoginPage /></PublicLoginRoute>} />
        <Route path="/ekyc" element={<KycRoute><EkycPage /></KycRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/merchant" element={<ProtectedRoute><MerchantPortal /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/kisan" element={<ProtectedRoute><KisanRegistration /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/merchant-dashboard" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
        <Route path="/matrimony" element={<ProtectedRoute><MatrimonyPage /></ProtectedRoute>} />
        <Route path="/classifieds" element={<ProtectedRoute><ClassifiedsPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
        <Route path="/shop/:id" element={<ProtectedRoute><ShopProfilePage /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillDevelopmentPage /></ProtectedRoute>} />
        <Route path="/family-safety" element={<ProtectedRoute><FamilySafetyPage /></ProtectedRoute>} />
        <Route path="/family-invite/:token" element={<FamilyInvitePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
