import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Parametros {
  id?: string;
  confianca_minima: number;
  prioridade_risco_indeterminado: string;
  prioridade_risco_nao: string;
  prazo_complementacao_dias: number;
  lembretes_complementacao: number;
  politica_cpf: string;
  anexo_max_mb: number;
  anexo_max_qtd: number;
  anexo_tipos_permitidos: string[];
  aprovadores_encerramento: number;
  min_grupo_indicadores: number;
  retencao_denuncia_meses: number;
  retencao_cpf_hash_meses: number;
  canais_notificacao: string[];
  uf_calendario: string;
}

const PD: Record<string, string> = {
  confianca_minima: 'PD-005 · Confiança mínima da IA (%) para dispensar revisão reforçada',
  prioridade_risco_indeterminado: 'PD-004 · Prioridade quando o risco é indeterminado',
  prioridade_risco_nao: 'PD-004 · Prioridade quando não há risco imediato',
  prazo_complementacao_dias: 'PD-006 · Prazo para complementação pelo denunciante (dias)',
  lembretes_complementacao: 'PD-006 · Quantidade de lembretes de complementação',
  politica_cpf: 'PD-002 · Política de coleta de CPF',
  anexo_max_mb: 'PD-008 · Tamanho máximo por anexo (MB)',
  anexo_max_qtd: 'PD-008 · Quantidade máxima de anexos',
  anexo_tipos_permitidos: 'PD-008 · Tipos de arquivo permitidos',
  aprovadores_encerramento: 'PD-011 · Aprovadores necessários para encerrar',
  min_grupo_indicadores: 'PD-012 · Tamanho mínimo de grupo para exibir indicadores',
  retencao_denuncia_meses: 'PD-013 · Retenção da denúncia (meses)',
  retencao_cpf_hash_meses: 'PD-013 · Retenção do hash de CPF (meses)',
  canais_notificacao: 'PD-010 · Canais de notificação',
  uf_calendario: 'PD-015 · Calendário de feriados aplicado aos prazos',
};

const ParametrosCanalCard: React.FC = () => {
  const { toast } = useToast();
  const [p, setP] = useState<Parametros | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('parametros_canal').select('*').is('company_id', null).maybeSingle();
      if (data) setP(data as unknown as Parametros);
      setLoading(false);
    })();
  }, []);

  const set = (patch: Partial<Parametros>) => setP(prev => (prev ? { ...prev, ...patch } : prev));

  const salvar = async () => {
    if (!p) return;
    setSaving(true);
    const { id, ...rest } = p;
    const { error } = await supabase.from('parametros_canal').update(rest).eq('id', id!);
    setSaving(false);
    toast(error
      ? { title: 'Erro ao salvar', description: error.message, variant: 'destructive' }
      : { title: 'Parâmetros atualizados' });
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!p) return <Card><CardContent className="py-12 text-center text-muted-foreground">Parâmetros não encontrados.</CardContent></Card>;

  const num = (k: keyof Parametros, min = 0) => (
    <div>
      <Label className="text-xs">{PD[k as string]}</Label>
      <Input type="number" min={min} value={p[k] as number}
        onChange={e => set({ [k]: Number(e.target.value) } as Partial<Parametros>)} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametrização do canal (NR-1 / SST)</CardTitle>
        <CardDescription>
          Definições pendentes PD-001 a PD-015 da especificação. Valores aplicados a todas as empresas.
          Prazos normativos (2/5/3/15 dias úteis) são fixos e não configuráveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {num('confianca_minima')}
          <div>
            <Label className="text-xs">{PD.prioridade_risco_indeterminado}</Label>
            <Select value={p.prioridade_risco_indeterminado} onValueChange={v => set({ prioridade_risco_indeterminado: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['CRITICA', 'ALTA', 'MODERADA', 'BAIXA'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{PD.prioridade_risco_nao}</Label>
            <Select value={p.prioridade_risco_nao} onValueChange={v => set({ prioridade_risco_nao: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ALTA', 'MODERADA', 'BAIXA'].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">{PD.politica_cpf}</Label>
            <Select value={p.politica_cpf} onValueChange={v => set({ politica_cpf: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="opcional">Opcional (anonimato preservado)</SelectItem>
                <SelectItem value="obrigatorio">Obrigatório para abrir denúncia</SelectItem>
                <SelectItem value="desativado">Não coletar CPF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {num('prazo_complementacao_dias', 1)}
          {num('lembretes_complementacao')}
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {num('anexo_max_mb', 1)}
          {num('anexo_max_qtd', 1)}
          <div>
            <Label className="text-xs">{PD.anexo_tipos_permitidos}</Label>
            <Input value={p.anexo_tipos_permitidos.join(', ')}
              onChange={e => set({ anexo_tipos_permitidos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {num('aprovadores_encerramento', 1)}
          {num('min_grupo_indicadores', 1)}
          {num('retencao_denuncia_meses', 1)}
          {num('retencao_cpf_hash_meses', 1)}
          <div>
            <Label className="text-xs">{PD.canais_notificacao}</Label>
            <Input value={p.canais_notificacao.join(', ')}
              onChange={e => set({ canais_notificacao: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <Label className="text-xs">{PD.uf_calendario}</Label>
            <Input value={p.uf_calendario} onChange={e => set({ uf_calendario: e.target.value.toUpperCase() })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar parâmetros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParametrosCanalCard;
