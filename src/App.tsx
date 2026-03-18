import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient as QC, QueryClientProvider } from "@tanstack/react-query";
// @ts-ignore - QueryClient export exists at runtime
const QueryClient = QC;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import MerchantPortal from "./pages/MerchantPortal";
import AdminDashboard from "./pages/AdminDashboard";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BharatMitraChatbot />
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
