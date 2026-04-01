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
import MasterDashboard from "./pages/MasterDashboard";
import CompanyReport from "./pages/CompanyReport";
import PendingApproval from "./pages/PendingApproval";
import UserManagement from "./pages/UserManagement";
import ChangePassword from "./pages/ChangePassword";
import TrialSignup from "./pages/TrialSignup";
import SSTDashboard from "./pages/SSTDashboard";

const queryClient = new QueryClient();

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
              <Route path="/teste-gratis" element={<TrialSignup />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportChat />} />
              <Route path="/report-form" element={<ReportForm />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<CompanyProfile />} />
              <Route path="/master-dashboard" element={<MasterDashboard />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/company-dashboard/:id" element={<Dashboard />} />
              <Route path="/sst-dashboard" element={<SSTDashboard />} />
              <Route path="/report/:companySlug" element={<CompanyReport />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WhiteLabelProvider>
        </RealAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
