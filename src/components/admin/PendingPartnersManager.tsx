import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { toast } from 'sonner';
import { Check, X, Eye, Building2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Partner {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  phone: string | null;
  endereco_completo: string;
  status: string;
  contract_signed: boolean;
  created_at: string;
}

interface Representative {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  is_primary: boolean;
}

export const PendingPartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { session, role, isLoading: authLoading } = useRealAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!session || role !== 'admin') {
      setPartners([]);
      setLoading(false);
      return;
    }

    fetchPartners();
  }, [authLoading, session, role]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('licensed_partners')
        .select('*')
        .in('status', ['pending_contract', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepresentatives = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('partner_representatives')
        .select('*')
        .eq('partner_id', partnerId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setRepresentatives(data || []);
    } catch (error) {
      console.error('Error fetching representatives:', error);
    }
  };

  const handleView = async (partner: Partner) => {
    setSelectedPartner(partner);
    await fetchRepresentatives(partner.id);
    setIsViewOpen(true);
  };

  const handleApprove = async (partner: Partner) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-partner', {
        body: { partnerId: partner.id, action: 'approve', type: 'partner' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Parceiro aprovado com sucesso!');
      fetchPartners();
      setIsViewOpen(false);
    } catch (error: any) {
      console.error('Error approving partner:', error);
      toast.error(error.message || 'Erro ao aprovar parceiro');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPartner || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-partner', {
        body: { 
          partnerId: selectedPartner.id, 
          action: 'reject', 
          type: 'partner',
          reason: rejectReason 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Parceiro rejeitado');
      fetchPartners();
      setIsRejectOpen(false);
      setIsViewOpen(false);
      setRejectReason('');
    } catch (error: any) {
      console.error('Error rejecting partner:', error);
      toast.error(error.message || 'Erro ao rejeitar parceiro');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string, contractSigned: boolean) => {
    if (status === 'pending_contract' || !contractSigned) {
      return <Badge variant="outline">Aguardando Contrato</Badge>;
    }
    if (status === 'pending_approval') {
      return <Badge className="bg-yellow-500/10 text-yellow-500">Aguardando Aprovação</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Parceiros Pendentes ({partners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum parceiro pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.nome_fantasia}</p>
                        <p className="text-sm text-muted-foreground">{partner.razao_social}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{partner.cnpj}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{getStatusBadge(partner.status, partner.contract_signed)}</TableCell>
                    <TableCell>
                      {format(new Date(partner.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(partner)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {partner.contract_signed && partner.status === 'pending_approval' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApprove(partner)}
                              disabled={processing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setIsRejectOpen(true);
                              }}
                              disabled={processing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Partner Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Parceiro</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{selectedPartner.razao_social}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{selectedPartner.nome_fantasia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-mono">{selectedPartner.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{selectedPartner.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contrato Assinado</p>
                  <p>{selectedPartner.contract_signed ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p>{selectedPartner.endereco_completo}</p>
              </div>

              {representatives.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Representantes Legais</p>
                  <div className="space-y-2">
                    {representatives.map((rep) => (
                      <div key={rep.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{rep.nome}</p>
                          {rep.is_primary && (
                            <Badge variant="outline" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          CPF: {rep.cpf} | RG: {rep.rg}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPartner.contract_signed && selectedPartner.status === 'pending_approval' && (
                <DialogFooter>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsRejectOpen(true)}
                    disabled={processing}
                  >
                    Rejeitar
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedPartner)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Aprovar Parceiro
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Parceiro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O parceiro será notificado por email.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
