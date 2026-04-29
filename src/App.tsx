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
import EkycPage from "./pages/EkycPage";
import FamilySafetyPage from "./pages/FamilySafetyPage";
import FamilyInvitePage from "./pages/FamilyInvitePage";
import { useLastKnownLocation } from "@/hooks/useLastKnownLocation";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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

const MerchantAccessRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const KycRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PublicLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || sessionStorage.getItem("mbd-auth-next") || "/dashboard";
  if (loading) return <FullScreenLoader />;
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
        <Route path="/ekyc" element={<KycRoute><EkycPage /></KycRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<LegalPage section="contact" />} />
        <Route path="/privacy-policy" element={<LegalPage section="privacy" />} />
        <Route path="/refund-policy" element={<LegalPage section="refund" />} />
        <Route path="/" element={<PublicHomeRoute />} />
        <Route path="/merchant" element={<ProtectedRoute><MerchantPortal /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Navigate to="/dashboard?tab=settings" replace /></ProtectedRoute>} />
        <Route path="/kisan" element={<ProtectedRoute><KisanRegistration /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/merchant-dashboard" element={<ProtectedRoute><MerchantAccessRoute><MerchantDashboard /></MerchantAccessRoute></ProtectedRoute>} />
        <Route path="/matrimony" element={<ProtectedRoute><MatrimonyPage /></ProtectedRoute>} />
        <Route path="/classifieds" element={<ProtectedRoute><ClassifiedsPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
        <Route path="/shop/:id" element={<ProtectedRoute><ShopProfilePage /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillDevelopmentPage /></ProtectedRoute>} />
        <Route path="/family-safety" element={<ProtectedRoute><FamilySafetyPage /></ProtectedRoute>} />
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
