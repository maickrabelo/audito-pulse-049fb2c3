import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, Link, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AffiliateOverviewProps {
  affiliateId: string;
  referralCode: string;
}

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  totalCommissions: number;
}

export const AffiliateOverview = ({ affiliateId, referralCode }: AffiliateOverviewProps) => {
  const [stats, setStats] = useState<Stats>({ totalCompanies: 0, activeCompanies: 0, totalCommissions: 0 });
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/checkout?ref=${referralCode}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, subscription_status')
          .eq('referred_by_affiliate_id', affiliateId);

        const totalCompanies = companies?.length || 0;
        const activeCompanies = companies?.filter(c => c.subscription_status === 'active').length || 0;

        // Calculate commissions (5% for affiliates)
        const activeCompanyIds = companies?.filter(c => c.subscription_status === 'active').map(c => c.id) || [];
        let totalCommissions = 0;

        if (activeCompanyIds.length > 0) {
          const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('plan_id')
            .in('company_id', activeCompanyIds)
            .eq('status', 'active');

          if (subscriptions) {
            const planIds = [...new Set(subscriptions.map(s => s.plan_id))];
            const { data: plans } = await supabase
              .from('subscription_plans')
              .select('id, base_price_cents')
              .in('id', planIds);

            subscriptions.forEach(sub => {
              const plan = plans?.find(p => p.id === sub.plan_id);
              if (plan) {
                totalCommissions += (plan.base_price_cents * 0.05) / 100; // 5% commission
              }
            });
          }
        }

        setStats({ totalCompanies, activeCompanies, totalCommissions });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [affiliateId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Indicadas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">{stats.activeCompanies} ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Mensais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">5% sobre assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link de Indicação</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]">
                {referralCode}
              </code>
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu Link de Indicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 bg-muted px-4 py-2 rounded text-sm truncate">
              {referralLink}
            </code>
            <Button onClick={copyToClipboard} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Compartilhe este link para indicar empresas e ganhar 5% de comissão sobre cada assinatura ativa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
