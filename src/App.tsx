import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import AdminDashboard from "./pages/AdminDashboard";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import KisanRegistration from "./pages/KisanRegistration";
import NotFound from "./pages/NotFound";
import BharatMitraChatbot from "./components/BharatMitraChatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/merchant" element={<MerchantPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/kisan" element={<KisanRegistration />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BharatMitraChatbot />
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
