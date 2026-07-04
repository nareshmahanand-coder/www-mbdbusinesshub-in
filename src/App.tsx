import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast as sonnerToast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
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

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const POST_LOGIN_PATH = "/dashboard";
const AUTH_NEXT_KEY = "mbd-auth-next";
const ONBOARDING_REQUIRED_AFTER = Date.parse("2026-06-25T00:00:00.000Z");

const clearAuthNextPath = () => {
  sessionStorage.removeItem(AUTH_NEXT_KEY);
  localStorage.removeItem(AUTH_NEXT_KEY);
};

const requiresNewUserOnboarding = (user: { created_at?: string } | null, isSuperUser: boolean) => {
  if (!user || isSuperUser) return false;
  const createdAt = Date.parse(user.created_at ?? "");
  if (!Number.isFinite(createdAt)) return true;
  return createdAt >= ONBOARDING_REQUIRED_AFTER;
};

const getPostLoginDestination = ({
  user,
  isSuperUser,
  hasKyc,
  isMember,
}: {
  user: { created_at?: string } | null;
  isSuperUser: boolean;
  hasKyc: boolean;
  isMember: boolean;
}) => {
  const onboardingRequired = requiresNewUserOnboarding(user, isSuperUser);
  if (onboardingRequired && !hasKyc) return "/ekyc";
  if (onboardingRequired && !isMember) return "/membership";
  return POST_LOGIN_PATH;
};

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

const KycRequiredRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const MerchantAccessRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AuthLandingRedirect = () => null;

const NativeAuthDeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const routeNativeUrl = (rawUrl?: string) => {
      if (!rawUrl) return;
      try {
        const url = new URL(rawUrl);
        const isCustomAuthCallback =
          url.protocol === "com.merabharatdukaan.app:" &&
          url.host === "auth" &&
          url.pathname.startsWith("/callback");
        const isHttpsAuthCallback =
          url.protocol === "https:" &&
          url.host === "shop.mbdbusinesshub.in" &&
          url.pathname.startsWith("/auth/callback");

        if (!isCustomAuthCallback && !isHttpsAuthCallback) return;

        void Browser.close().catch(() => {});
        const target = `/auth/callback${url.search}${url.hash}`;
        navigate(target, { replace: true });
      } catch {
        // Ignore malformed external URLs.
      }
    };

    window.addEventListener("mbd-native-auth-url", ((event: Event) => {
      routeNativeUrl((event as CustomEvent<string>).detail);
    }) as EventListener);

    let cleanup: (() => void) | undefined;
    void CapacitorApp.addListener("appUrlOpen", (event) => routeNativeUrl(event.url)).then((handle) => {
      cleanup = () => void handle.remove();
    });
    void CapacitorApp.getLaunchUrl().then((event) => routeNativeUrl(event?.url));

    return () => {
      window.removeEventListener("mbd-native-auth-url", ((event: Event) => {
        routeNativeUrl((event as CustomEvent<string>).detail);
      }) as EventListener);
      cleanup?.();
    };
  }, [navigate]);

  return null;
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
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/continue" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route path="/ekyc" element={<ProtectedRoute allowDuringOnboarding><EkycPage /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute allowDuringOnboarding><BharatGauravMembershipPage /></ProtectedRoute>} />
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
      <AuthLandingRedirect />
      <NativeAuthDeepLinkHandler />
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
            <AppShell />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
