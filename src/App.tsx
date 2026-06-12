import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast as sonnerToast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";


import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import LegalPage from "./pages/LegalPage";
import KisanRegistration from "./pages/KisanRegistration";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
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
import FamilySafetyPage from "./pages/FamilySafetyPage";
import FamilyInvitePage from "./pages/FamilyInvitePage";
import EkycPage from "./pages/EkycPage";
import BharatGauravMembershipPage from "./pages/BharatGauravMembershipPage";
import AdminDashboard from "./pages/AdminDashboard";
import { useKycStatus } from "@/hooks/useKycStatus";
import { useBharatGauravMembership } from "@/hooks/useBharatGauravMembership";
import { useLastKnownLocation } from "@/hooks/useLastKnownLocation";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useBlockedStatus } from "@/hooks/useBlockedStatus";
import BlockedScreen from "@/components/BlockedScreen";

import NotFound from "./pages/NotFound";
import BharatMitraChatbot from "./components/BharatMitraChatbot";
import InstallPromptAutoTrigger from "./components/InstallPromptAutoTrigger";

const NativePushBanner = () => {
  useEffect(() => {
    const onNativePush = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; body?: string }>).detail ?? {};
      sonnerToast(detail.title || "Mera Bharat Dukaan", {
        description: detail.body || "New admin message",
        duration: 8000,
        position: "top-center",
      });
    };
    window.addEventListener("mbd-native-push", onNativePush);
    return () => window.removeEventListener("mbd-native-push", onNativePush);
  }, []);

  return null;
};

const NativeDeepLinkRouter = () => {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      try {
        const nextUrl = new URL(url);
        const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        if (nextPath && nextPath !== `${location.pathname}${location.search}${location.hash}`) {
          void Browser.close();
          window.history.replaceState(null, document.title, nextPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch (error) {
        console.error("[auth] Native deep link handling failed", error);
      }
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      void handle?.remove();
    };
  }, [location.hash, location.pathname, location.search]);

  return null;
};

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
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const { isMember, loading: memLoading } = useBharatGauravMembership();
  const location = useLocation();
  if (authLoading || (user && (kycLoading || memLoading))) return <FullScreenLoader />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (!isSuperUser && !hasKyc) return <Navigate to="/ekyc" replace />;
  if (!isSuperUser && !isMember) return <Navigate to="/membership" replace />;
  return <>{children}</>;
};

const MerchantAccessRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PublicLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperUser } = useAuth();
  const { hasKyc, loading: kycLoading } = useKycStatus();
  const { isMember, loading: memLoading } = useBharatGauravMembership();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || sessionStorage.getItem("mbd-auth-next") || localStorage.getItem("mbd-auth-next") || "/dashboard";
  if (loading || (user && (kycLoading || memLoading))) return <FullScreenLoader />;
  if (user && !isSuperUser && !hasKyc) return <Navigate to="/ekyc" replace />;
  if (user && !isSuperUser && !isMember) return <Navigate to="/membership" replace />;
  if (user) return <Navigate to={next.startsWith("/") ? next : "/dashboard"} replace />;
  return <>{children}</>;
};



const AppShell = () => {
  useLastKnownLocation();
  const { isSuperUser, user } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { blocked, reason, loading: blockedLoading } = useBlockedStatus();

  if (settingsLoading) return <FullScreenLoader />;
  if (settings.maintenance_mode && !isSuperUser) return <MaintenanceScreen />;
  if (user && !isSuperUser && !blockedLoading && blocked) {
    return <BlockedScreen reason={reason} />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute><LoginPage /></PublicLoginRoute>} />
        <Route path="/signup" element={<PublicLoginRoute><LoginPage initialMode="signup" /></PublicLoginRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/~oauth/*" element={<AuthCallbackPage />} />
        <Route path="/ekyc" element={<EkycPage />} />
        <Route path="/membership" element={<ProtectedRoute><BharatGauravMembershipPage /></ProtectedRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<LegalPage section="contact" />} />
        <Route path="/privacy-policy" element={<LegalPage section="privacy" />} />
        <Route path="/refund-policy" element={<LegalPage section="refund" />} />
        <Route path="/" element={<PublicHomeRoute />} />
        <Route path="/merchant" element={<KycRequiredRoute><MerchantPortal /></KycRequiredRoute>} />
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BharatMitraChatbot />
      <InstallPromptAutoTrigger />
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
          <NativePushBanner />
          <BrowserRouter>
            <NativeDeepLinkRouter />
            <AppShell />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
