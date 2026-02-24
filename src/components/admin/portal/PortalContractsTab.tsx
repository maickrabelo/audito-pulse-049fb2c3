import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SSTManager = {
  id: string;
  name: string;
  email: string | null;
  contract_signed_at: string | null;
  contract_expires_at: string | null;
};

type EditState = {
  [id: string]: {
    contract_signed_at: string;
    contract_expires_at: string;
  };
};

export const PortalContractsTab: React.FC = () => {
  const [managers, setManagers] = useState<SSTManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadManagers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sst_managers')
      .select('id, name, email, contract_signed_at, contract_expires_at')
      .order('name');
    if (!error && data) {
      setManagers(data);
      const initial: EditState = {};
      data.forEach(m => {
        initial[m.id] = {
          contract_signed_at: m.contract_signed_at ? format(parseISO(m.contract_signed_at), 'yyyy-MM-dd') : '',
          contract_expires_at: m.contract_expires_at ? format(parseISO(m.contract_expires_at), 'yyyy-MM-dd') : '',
        };
      });
      setEdits(initial);
    }
    setLoading(false);
  };

  useEffect(() => { loadManagers(); }, []);

  const handleChange = (id: string, field: 'contract_signed_at' | 'contract_expires_at', value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id: string) => {
    const edit = edits[id];
    if (!edit) return;

    setSavingId(id);
    try {
      const { error } = await supabase.from('sst_managers').update({
        contract_signed_at: edit.contract_signed_at || null,
        contract_expires_at: edit.contract_expires_at || null,
      }).eq('id', id);
      if (error) throw error;
      toast({ title: "Contrato atualizado" });
      loadManagers();
    } catch (err) {
      toast({ title: "Erro", description: getSafeErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const getStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = differenceInDays(parseISO(expiresAt), new Date());
    if (days < 0) return <Badge variant="destructive">Expirado</Badge>;
    if (days <= 30) return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">Expirando</Badge>;
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">Ativo</Badge>;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contratos por Gestora SST</h3>

      {loading ? <p>Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gestora SST</TableHead>
              <TableHead>Data Assinatura</TableHead>
              <TableHead>Data Expiração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={edits[m.id]?.contract_signed_at || ''}
                    onChange={e => handleChange(m.id, 'contract_signed_at', e.target.value)}
                    className="w-44"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={edits[m.id]?.contract_expires_at || ''}
                    onChange={e => handleChange(m.id, 'contract_expires_at', e.target.value)}
                    className="w-44"
                  />
                </TableCell>
                <TableCell>{getStatus(edits[m.id]?.contract_expires_at || null)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleSave(m.id)} disabled={savingId === m.id}>
                    <Save className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {managers.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma gestora SST cadastrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
