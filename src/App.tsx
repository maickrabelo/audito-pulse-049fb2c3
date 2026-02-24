import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealAuthProvider } from "./contexts/RealAuthContext";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";
import { useRealAuth } from "./contexts/RealAuthContext";
import { useAccessLogger } from "./hooks/useAccessLogger";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ReportForm from "./pages/ReportForm";
import ReportChat from "./pages/ReportChat";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import CompanyProfile from "./pages/CompanyProfile";
import SSTDashboard from "./pages/SSTDashboard";
import MasterDashboard from "./pages/MasterDashboard";
import CompanyReport from "./pages/CompanyReport";
import PendingApproval from "./pages/PendingApproval";
import UserManagement from "./pages/UserManagement";
import ClimateSurvey from "./pages/ClimateSurvey";
import ClimateSurveyDashboard from "./pages/ClimateSurveyDashboard";
import ClimateSurveyManagement from "./pages/ClimateSurveyManagement";
import CommercialPresentation from "./pages/CommercialPresentation";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCanceled from "./pages/CheckoutCanceled";
import PartnerRegistration from "./pages/PartnerRegistration";
import AffiliateRegistration from "./pages/AffiliateRegistration";
import PartnerDashboard from "./pages/PartnerDashboard";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import HSEITDashboard from "./pages/HSEITDashboard";
import HSEITManagement from "./pages/HSEITManagement";
import HSEITForm from "./pages/HSEITForm";
import HSEITResults from "./pages/HSEITResults";
import BurnoutDashboard from "./pages/BurnoutDashboard";
import BurnoutManagement from "./pages/BurnoutManagement";
import BurnoutForm from "./pages/BurnoutForm";
import BurnoutResults from "./pages/BurnoutResults";
import ChangePassword from "./pages/ChangePassword";
import SSTLandingPage from "./pages/SSTLandingPage";
import SSTPortal from "./pages/SSTPortal";
import TrialSignup from "./pages/TrialSignup";
import SSTTrialSignup from "./pages/SSTTrialSignup";
import RelatorioDemo from "./pages/RelatorioDemo";

const queryClient = new QueryClient();

// Inner component so it has access to auth context and router (for useLocation)
const AppContent = () => {
  const { user, profile, role } = useRealAuth();
  useAccessLogger(user?.id, user?.email, role);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RealAuthProvider>
          <WhiteLabelProvider>
            <AppContent />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sst/:sstSlug" element={<SSTLandingPage />} />
              <Route path="/teste-gratis" element={<TrialSignup />} />
              <Route path="/teste-gratis-sst" element={<SSTTrialSignup />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportChat />} />
              <Route path="/report-form" element={<ReportForm />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<CompanyProfile />} />
              <Route path="/sst-dashboard" element={<SSTDashboard />} />
              <Route path="/sst-portal" element={<SSTPortal />} />
              <Route path="/master-dashboard" element={<MasterDashboard />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/company-dashboard/:id" element={<Dashboard />} />
              <Route path="/report/:companySlug" element={<CompanyReport />} />
              <Route path="/pesquisa/:companySlug" element={<ClimateSurvey />} />
              <Route path="/pesquisa/:companySlug/:surveyId" element={<ClimateSurvey />} />
              <Route path="/climate-dashboard" element={<ClimateSurveyDashboard />} />
              <Route path="/climate-survey/new" element={<ClimateSurveyManagement />} />
              <Route path="/climate-survey/:id" element={<ClimateSurveyManagement />} />
              <Route path="/apresentacao" element={<CommercialPresentation />} />
              <Route path="/contratar" element={<Checkout />} />
              <Route path="/checkout/sucesso" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancelado" element={<CheckoutCanceled />} />
              <Route path="/parceiro/cadastro" element={<PartnerRegistration />} />
              <Route path="/parceiro/dashboard" element={<PartnerDashboard />} />
              <Route path="/afiliado/cadastro" element={<AffiliateRegistration />} />
              <Route path="/afiliado/dashboard" element={<AffiliateDashboard />} />
              {/* HSE-IT Routes */}
              <Route path="/hseit-dashboard" element={<HSEITDashboard />} />
              <Route path="/hseit/new" element={<HSEITManagement />} />
              <Route path="/hseit/:id" element={<HSEITManagement />} />
              <Route path="/hseit/:companySlug/:assessmentId" element={<HSEITForm />} />
              <Route path="/hseit/results/:id" element={<HSEITResults />} />
              {/* Burnout Routes */}
              <Route path="/burnout-dashboard" element={<BurnoutDashboard />} />
              <Route path="/burnout/new" element={<BurnoutManagement />} />
              <Route path="/burnout/:id" element={<BurnoutManagement />} />
              <Route path="/burnout/:companySlug/:assessmentId" element={<BurnoutForm />} />
              <Route path="/burnout/results/:id" element={<BurnoutResults />} />
              <Route path="/relatoriodemo" element={<RelatorioDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WhiteLabelProvider>
        </RealAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
