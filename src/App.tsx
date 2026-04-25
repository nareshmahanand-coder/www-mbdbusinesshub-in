import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";


import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import AdminDashboard from "./pages/AdminDashboard";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import LegalPage from "./pages/LegalPage";
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
import { useMerchantAccess } from "@/hooks/useMerchantAccess";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import NotFound from "./pages/NotFound";
import BharatMitraChatbot from "./components/BharatMitraChatbot";

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

// Public Home: shows Index to everyone. Logged-out users see it crystal
// clear but locked — any click anywhere redirects to /login (with a polite
// Hindi voice prompt). Logged-in users get the normal KYC + membership flow.
const PublicHomeRoute = () => {
  const { user, loading, isSuperUser } = useAuth();
  const { status, loading: kycLoading } = useKycStatus();
  const { isActive, loading: memLoading, refresh: refreshMembership } = useMembership();

  if (loading) return <FullScreenLoader />;

  // Logged-out: show Home crystal clear but locked. Any click → /login.
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

const WELCOME_TTS_KEY = "mbd-welcome-tts-played";
const WELCOME_TEXT =
  "मेरा भारत दुकान में आपका स्वागत है! कृपया आगे बढ़ने के लिए पहले लॉगिन करें।";
const LOGIN_PROMPT_TEXT = "कृपया पहले लॉगिन करें";

async function speakViaElevenLabs(text: string): Promise<HTMLAudioElement | null> {
  try {
    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: { text, voice: "aria" },
    });
    if (error || !data?.audioContent) return null;
    const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
    audio.volume = 0.95;
    await audio.play().catch(() => {
      /* autoplay may be blocked until user gesture — ignore */
    });
    return audio;
  } catch {
    return null;
  }
}

const ClickLockOverlay = () => {
  const navigate = useNavigate();
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play the welcome TTS once per browser session as soon as the locked
  // home page mounts. Browsers usually require a user gesture for autoplay,
  // so this may silently no-op until the first tap — at which point the
  // click handler will play the "कृपया पहले लॉगिन करें" prompt instead.
  useEffect(() => {
    if (sessionStorage.getItem(WELCOME_TTS_KEY)) return;
    sessionStorage.setItem(WELCOME_TTS_KEY, "1");
    speakViaElevenLabs(WELCOME_TEXT).then((a) => {
      welcomeAudioRef.current = a;
    });
    return () => {
      welcomeAudioRef.current?.pause();
    };
  }, []);

  const goLogin = async () => {
    welcomeAudioRef.current?.pause();
    // Fire-and-forget the polite prompt; navigate immediately for snappy UX.
    speakViaElevenLabs(LOGIN_PROMPT_TEXT);
    navigate("/login");
  };

  return (
    <button
      type="button"
      onClick={goLogin}
      onTouchStart={goLogin}
      aria-label="Login to continue"
      className="fixed inset-0 z-[60] cursor-pointer bg-transparent"
    />
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

const MerchantAccessRoute = ({ children }: { children: React.ReactNode }) => {
  const { state, reason } = useMerchantAccess();

  if (state === "loading") return <FullScreenLoader />;
  if (state === "suspended") {
    return <Navigate to="/merchant" replace state={{ accessMessage: reason }} />;
  }
  if (state === "expired") {
    return <Navigate to="/merchant" replace state={{ accessMessage: reason }} />;
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
  const { loading: authLoading, isSuperUser } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();

  if (authLoading || settingsLoading) return <FullScreenLoader />;
  if (settings.maintenance_mode && !isSuperUser) return <MaintenanceScreen />;

  return (
    <>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute><LoginPage /></PublicLoginRoute>} />
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
