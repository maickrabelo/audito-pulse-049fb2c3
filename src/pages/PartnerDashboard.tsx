import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import PartnerSidebar from "@/components/partner-dashboard/PartnerSidebar";
import PartnerDashboardHeader from "@/components/partner-dashboard/PartnerDashboardHeader";
import ProspectsCRM from "@/components/partner-dashboard/ProspectsCRM";
import ReferredCompanies from "@/components/partner-dashboard/ReferredCompanies";
import PartnerCommissions from "@/components/partner-dashboard/PartnerCommissions";
import PartnerOverview from "@/components/partner-dashboard/PartnerOverview";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerInfo {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  referralCode: string;
  email: string;
}

const PartnerDashboard = () => {
  const { user, role, isLoading } = useRealAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || role !== "partner")) {
      navigate("/auth");
    }
  }, [user, role, isLoading, navigate]);

  useEffect(() => {
    if (user && role === "partner") {
      fetchPartnerInfo();
    }
  }, [user, role]);

  const fetchPartnerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("licensed_partners")
        .select("id, razao_social, nome_fantasia, referral_code, email")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPartnerInfo({
          id: data.id,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          referralCode: data.referral_code,
          email: data.email,
        });
      }
    } catch (error) {
      console.error("Error fetching partner info:", error);
    } finally {
      setLoadingPartner(false);
    }
  };

  if (isLoading || loadingPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partnerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Dados do parceiro não encontrados</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PartnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <PartnerDashboardHeader partnerInfo={partnerInfo} />
          <main className="flex-1 p-6 overflow-auto">
            {activeTab === "overview" && <PartnerOverview partnerInfo={partnerInfo} />}
            {activeTab === "prospects" && <ProspectsCRM partnerId={partnerInfo.id} />}
            {activeTab === "companies" && <ReferredCompanies partnerId={partnerInfo.id} />}
            {activeTab === "commissions" && <PartnerCommissions partnerId={partnerInfo.id} />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PartnerDashboard;
