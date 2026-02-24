import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AffiliateCommissionsProps {
  affiliateId: string;
}

interface Commission {
  companyName: string;
  planName: string;
  basePrice: number;
  commission: number;
  status: string;
  date: string;
}

export const AffiliateCommissions = ({ affiliateId }: AffiliateCommissionsProps) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ received: 0, pending: 0, total: 0 });

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name, subscription_status')
          .eq('referred_by_affiliate_id', affiliateId);

        if (!companies || companies.length === 0) {
          setLoading(false);
          return;
        }

        const companyIds = companies.map(c => c.id);
        
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('company_id, plan_id, status, created_at')
          .in('company_id', companyIds);

        if (!subscriptions) {
          setLoading(false);
          return;
        }

        const planIds = [...new Set(subscriptions.map(s => s.plan_id))];
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id, name, base_price_cents')
          .in('id', planIds);

        const commissionsList: Commission[] = subscriptions.map(sub => {
          const company = companies.find(c => c.id === sub.company_id);
          const plan = plans?.find(p => p.id === sub.plan_id);
          const basePrice = (plan?.base_price_cents || 0) / 100;
          const commission = basePrice * 0.25; // 25% commission

          return {
            companyName: company?.name || 'Empresa',
            planName: plan?.name || 'Plano',
            basePrice,
            commission,
            status: sub.status,
            date: sub.created_at,
          };
        });

        const received = commissionsList
          .filter(c => c.status === 'active')
          .reduce((sum, c) => sum + c.commission, 0);

        const pending = commissionsList
          .filter(c => c.status === 'pending' || c.status === 'trial')
          .reduce((sum, c) => sum + c.commission, 0);

        setCommissions(commissionsList);
        setTotals({ received, pending, total: received + pending });
      } catch (error) {
        console.error('Error fetching commissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [affiliateId]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Recebidas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totals.received)}</div>
            <p className="text-xs text-muted-foreground">Assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</div>
            <p className="text-xs text-muted-foreground">Aguardando ativação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
            <p className="text-xs text-muted-foreground">25% por assinatura</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma comissão ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor do Plano</TableHead>
                  <TableHead>Comissão (25%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{commission.companyName}</TableCell>
                    <TableCell>{commission.planName}</TableCell>
                    <TableCell>{formatCurrency(commission.basePrice)}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(commission.commission)}
                    </TableCell>
                    <TableCell>
                      {commission.status === 'active' ? (
                        <Badge className="bg-green-500/10 text-green-500">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(commission.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
