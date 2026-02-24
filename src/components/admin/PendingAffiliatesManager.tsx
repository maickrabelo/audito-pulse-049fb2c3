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
import { Check, X, Eye, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Affiliate {
  id: string;
  nome_completo: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string | null;
  endereco_completo: string;
  profissao: string;
  estado_civil: string;
  status: string;
  contract_signed: boolean;
  created_at: string;
}

export const PendingAffiliatesManager = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { session, role, isLoading: authLoading } = useRealAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!session || role !== 'admin') {
      setAffiliates([]);
      setLoading(false);
      return;
    }

    fetchAffiliates();
  }, [authLoading, session, role]);

  const fetchAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .in('status', ['pending_contract', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setIsViewOpen(true);
  };

  const handleApprove = async (affiliate: Affiliate) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-partner', {
        body: { partnerId: affiliate.id, action: 'approve', type: 'affiliate' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Afiliado aprovado com sucesso!');
      fetchAffiliates();
      setIsViewOpen(false);
    } catch (error: any) {
      console.error('Error approving affiliate:', error);
      toast.error(error.message || 'Erro ao aprovar afiliado');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-partner', {
        body: { 
          partnerId: selectedAffiliate.id, 
          action: 'reject', 
          type: 'affiliate',
          reason: rejectReason 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Afiliado rejeitado');
      fetchAffiliates();
      setIsRejectOpen(false);
      setIsViewOpen(false);
      setRejectReason('');
    } catch (error: any) {
      console.error('Error rejecting affiliate:', error);
      toast.error(error.message || 'Erro ao rejeitar afiliado');
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
            <User className="h-5 w-5" />
            Afiliados Pendentes ({affiliates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <User className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum afiliado pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">{affiliate.nome_completo}</TableCell>
                    <TableCell className="font-mono text-sm">{affiliate.cpf}</TableCell>
                    <TableCell>{affiliate.email}</TableCell>
                    <TableCell>{getStatusBadge(affiliate.status, affiliate.contract_signed)}</TableCell>
                    <TableCell>
                      {format(new Date(affiliate.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(affiliate)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {affiliate.contract_signed && affiliate.status === 'pending_approval' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApprove(affiliate)}
                              disabled={processing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
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

      {/* View Affiliate Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Afiliado</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{selectedAffiliate.nome_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-mono">{selectedAffiliate.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RG</p>
                  <p className="font-mono">{selectedAffiliate.rg}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedAffiliate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{selectedAffiliate.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado Civil</p>
                  <p className="capitalize">{selectedAffiliate.estado_civil}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profissão</p>
                  <p>{selectedAffiliate.profissao}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p>{selectedAffiliate.endereco_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contrato Assinado</p>
                  <p>{selectedAffiliate.contract_signed ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              {selectedAffiliate.contract_signed && selectedAffiliate.status === 'pending_approval' && (
                <DialogFooter>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsRejectOpen(true)}
                    disabled={processing}
                  >
                    Rejeitar
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedAffiliate)}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Aprovar Afiliado
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
            <DialogTitle>Rejeitar Afiliado</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O afiliado será notificado por email.
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
