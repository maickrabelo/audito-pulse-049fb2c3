import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { Search, Users, Building2, DollarSign, TrendingUp, Eye, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface ActivePartner {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  email: string;
  phone: string | null;
  referral_code: string;
  approved_at: string | null;
  leadsCount: number;
  activeLeadsCount: number;
  convertedCompaniesCount: number;
  projectedRevenue: number;
}

interface PartnerProspect {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

export const ActivePartnersManager: React.FC = () => {
  const [partners, setPartners] = useState<ActivePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ActivePartner | null>(null);
  const [partnerProspects, setPartnerProspects] = useState<PartnerProspect[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const { toast } = useToast();
  const { session, role, isLoading: authLoading } = useRealAuth();

  const MONTHLY_SUBSCRIPTION_VALUE = 199; // Valor médio da assinatura mensal

  useEffect(() => {
    if (authLoading) return;
    if (session && role === 'admin') {
      fetchActivePartners();
    }
  }, [authLoading, session, role]);

  const fetchActivePartners = async () => {
    setLoading(true);
    try {
      // Buscar parceiros aprovados
      const { data: partnersData, error: partnersError } = await supabase
        .from('licensed_partners')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (partnersError) throw partnersError;

      // Para cada parceiro, buscar estatísticas
      const partnersWithStats = await Promise.all(
        (partnersData || []).map(async (partner) => {
          // Buscar prospects (leads)
          const { data: prospects, error: prospectsError } = await supabase
            .from('partner_prospects')
            .select('id, status')
            .eq('partner_id', partner.id);

          if (prospectsError) {
            console.error('Error fetching prospects:', prospectsError);
          }

          // Buscar empresas convertidas (referidas pelo parceiro)
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id')
            .eq('referred_by_partner_id', partner.id);

          if (companiesError) {
            console.error('Error fetching companies:', companiesError);
          }

          const leadsCount = prospects?.length || 0;
          const activeLeadsCount = prospects?.filter(p => 
            p.status === 'lead' || p.status === 'em_negociacao' || p.status === 'proposta_enviada'
          ).length || 0;
          const convertedCompaniesCount = companies?.length || 0;
          const projectedRevenue = convertedCompaniesCount * MONTHLY_SUBSCRIPTION_VALUE;

          return {
            id: partner.id,
            nome_fantasia: partner.nome_fantasia,
            razao_social: partner.razao_social,
            cnpj: partner.cnpj,
            email: partner.email,
            phone: partner.phone,
            referral_code: partner.referral_code,
            approved_at: partner.approved_at,
            leadsCount,
            activeLeadsCount,
            convertedCompaniesCount,
            projectedRevenue
          };
        })
      );

      setPartners(partnersWithStats);
    } catch (error) {
      toast({
        title: "Erro ao carregar parceiros",
        description: getSafeErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerProspects = async (partnerId: string) => {
    setLoadingProspects(true);
    try {
      const { data, error } = await supabase
        .from('partner_prospects')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPartnerProspects(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar leads",
        description: getSafeErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setLoadingProspects(false);
    }
  };

  const handleViewPartner = async (partner: ActivePartner) => {
    setSelectedPartner(partner);
    await fetchPartnerProspects(partner.id);
  };

  const filteredPartners = partners.filter(partner => 
    partner.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.cnpj.includes(searchTerm)
  );

  const totalLeads = partners.reduce((sum, p) => sum + p.leadsCount, 0);
  const totalActiveLeads = partners.reduce((sum, p) => sum + p.activeLeadsCount, 0);
  const totalConverted = partners.reduce((sum, p) => sum + p.convertedCompaniesCount, 0);
  const totalProjectedRevenue = partners.reduce((sum, p) => sum + p.projectedRevenue, 0);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      lead: { label: "Lead", variant: "secondary" },
      em_negociacao: { label: "Em Negociação", variant: "default" },
      proposta_enviada: { label: "Proposta Enviada", variant: "default" },
      convertido: { label: "Convertido", variant: "default" },
      perdido: { label: "Perdido", variant: "destructive" }
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Parceiros Ativos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{partners.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Total de Leads</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLeads}</p>
            <p className="text-sm text-muted-foreground">{totalActiveLeads} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Empresas Convertidas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalConverted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Faturamento Projetado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProjectedRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parceiros Ativos</CardTitle>
              <CardDescription>Lista de todos os parceiros licenciados aprovados</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar parceiro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchActivePartners}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum parceiro encontrado com esse termo" : "Nenhum parceiro ativo encontrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Ativos</TableHead>
                  <TableHead className="text-center">Convertidos</TableHead>
                  <TableHead className="text-right">Faturamento Proj.</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.nome_fantasia}</p>
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{partner.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{partner.referral_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{partner.leadsCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={partner.activeLeadsCount > 0 ? "default" : "secondary"}>
                        {partner.activeLeadsCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={partner.convertedCompaniesCount > 0 ? "default" : "outline"} className={partner.convertedCompaniesCount > 0 ? "bg-green-600" : ""}>
                        {partner.convertedCompaniesCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partner.projectedRevenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleViewPartner(partner)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Partner Details Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPartner?.nome_fantasia}</DialogTitle>
            <DialogDescription>
              Detalhes do parceiro e seus leads
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-6">
              {/* Partner Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{selectedPartner.razao_social}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium font-mono">{selectedPartner.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedPartner.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código de Indicação</p>
                  <Badge variant="outline" className="font-mono">{selectedPartner.referral_code}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado em</p>
                  <p className="font-medium">
                    {selectedPartner.approved_at 
                      ? new Date(selectedPartner.approved_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedPartner.leadsCount}</p>
                    <p className="text-sm text-muted-foreground">Total de Leads</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedPartner.activeLeadsCount}</p>
                    <p className="text-sm text-muted-foreground">Leads Ativos</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">{selectedPartner.convertedCompaniesCount}</p>
                    <p className="text-sm text-muted-foreground">Convertidos</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPartner.projectedRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Faturamento/mês</p>
                  </CardContent>
                </Card>
              </div>

              {/* Leads Table */}
              <div>
                <h3 className="font-semibold mb-4">Leads ({partnerProspects.length})</h3>
                {loadingProspects ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : partnerProspects.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Nenhum lead cadastrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnerProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell className="font-medium">{prospect.company_name}</TableCell>
                          <TableCell>{prospect.contact_name || '-'}</TableCell>
                          <TableCell>{prospect.email || '-'}</TableCell>
                          <TableCell>{getStatusBadge(prospect.status)}</TableCell>
                          <TableCell>
                            {new Date(prospect.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
