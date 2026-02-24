import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PartnerCommissionsProps {
  partnerId: string;
}

interface Commission {
  id: string;
  companyName: string;
  planName: string;
  amount: number;
  status: string;
  date: string;
}

const PartnerCommissions = ({ partnerId }: PartnerCommissionsProps) => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    pending: 0,
    paid: 0,
    total: 0,
  });

  useEffect(() => {
    fetchCommissions();
  }, [partnerId]);

  const fetchCommissions = async () => {
    try {
      // Fetch companies referred by this partner with their subscriptions
      const { data: companies, error } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          subscriptions (
            id,
            status,
            created_at,
            plan_id,
            subscription_plans (
              name,
              base_price_cents
            )
          )
        `)
        .eq("referred_by_partner_id", partnerId);

      if (error) throw error;

      // Calculate commissions (10% of subscription value)
      const calculatedCommissions: Commission[] = [];
      let pendingTotal = 0;
      let paidTotal = 0;

      companies?.forEach((company: any) => {
        company.subscriptions?.forEach((sub: any) => {
          const basePrice = sub.subscription_plans?.base_price_cents || 0;
          const commissionAmount = (basePrice * 0.25) / 100; // 25% commission

          const isPaid = sub.status === "active";
          if (isPaid) {
            paidTotal += commissionAmount;
          } else {
            pendingTotal += commissionAmount;
          }

          calculatedCommissions.push({
            id: sub.id,
            companyName: company.name,
            planName: sub.subscription_plans?.name || "Plano",
            amount: commissionAmount,
            status: isPaid ? "paid" : "pending",
            date: sub.created_at,
          });
        });
      });

      setCommissions(calculatedCommissions);
      setTotals({
        pending: pendingTotal,
        paid: paidTotal,
        total: pendingTotal + paidTotal,
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Comissões</h2>
        <p className="text-muted-foreground">
          Acompanhe suas comissões por indicações
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCurrency(totals.paid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? "..." : formatCurrency(totals.pending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Geral
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : formatCurrency(totals.total)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma comissão registrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Suas comissões aparecerão aqui quando empresas indicadas
                assinarem o SOIA
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.companyName}
                    </TableCell>
                    <TableCell>{commission.planName}</TableCell>
                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                    <TableCell>
                      {commission.status === "paid" ? (
                        <Badge className="bg-green-500">Pago</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(commission.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Como funcionam as comissões:</strong> Você recebe 25% do
            valor mensal de cada assinatura de empresa que indicou. As comissões
            são calculadas automaticamente e creditadas na sua conta após a
            confirmação do pagamento pela empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerCommissions;
