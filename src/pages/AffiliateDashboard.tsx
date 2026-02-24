import { useState, useEffect } from 'react';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AffiliateSidebar } from '@/components/affiliate-dashboard/AffiliateSidebar';
import { AffiliateDashboardHeader } from '@/components/affiliate-dashboard/AffiliateDashboardHeader';
import { AffiliateOverview } from '@/components/affiliate-dashboard/AffiliateOverview';
import { AffiliateReferredCompanies } from '@/components/affiliate-dashboard/AffiliateReferredCompanies';
import { AffiliateCommissions } from '@/components/affiliate-dashboard/AffiliateCommissions';
import { Loader2 } from 'lucide-react';

interface AffiliateInfo {
  id: string;
  nome_completo: string;
  email: string;
  referral_code: string;
  status: string;
}

const AffiliateDashboard = () => {
  const { user } = useRealAuth();
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAffiliateInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('id, nome_completo, email, referral_code, status')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setAffiliate(data);
      } catch (error) {
        console.error('Error fetching affiliate info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateInfo();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Afiliado não encontrado</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AffiliateSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 p-6">
          <AffiliateDashboardHeader affiliate={affiliate} />
          
          <div className="mt-6">
            {activeTab === 'overview' && (
              <AffiliateOverview affiliateId={affiliate.id} referralCode={affiliate.referral_code} />
            )}
            {activeTab === 'companies' && (
              <AffiliateReferredCompanies affiliateId={affiliate.id} />
            )}
            {activeTab === 'commissions' && (
              <AffiliateCommissions affiliateId={affiliate.id} />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AffiliateDashboard;
