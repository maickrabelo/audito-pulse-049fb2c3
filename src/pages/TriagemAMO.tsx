import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, ShieldAlert, ArrowLeft, Bot, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  COMPETENCIAS, PILARES, PRIORIDADES, RISCOS, ESTADOS, ROTEAMENTO,
  prioridadeVariant, competenciaVariant, validarClassificacao,
  type Competencia, type Pilar, type Prioridade, type Risco,
} from '@/lib/nr1';

interface ReportRow {
  id: string; tracking_code: string; title: string; description: string; ai_summary: string | null;
  estado: string; competencia: Competencia | null; risco_grave_imediato: Risco | null;
  prioridade: Prioridade | null; pilares: Pilar[] | null; parte_amo: string | null; parte_empresa: string | null;
  confianca_ia: number | null; ia_schema_valido: boolean | null;
  dados_faltantes: string[] | null; documentos_sugeridos: string[] | null;
  trechos_relevantes: string[] | null; acao_recomendada: string[] | null;
  ai_classification_rationale: string | null; versao_classificacao: number | null;
  snapshot_unidade: string | null; snapshot_ghe: string | null; snapshot_cargo: string | null;
  created_at: string; companies: { name: string } | null;
}

interface Edicao {
  competencia?: Competencia; risco?: Risco; prioridade?: Prioridade;
  pilares: Pilar[]; parte_amo: string; parte_empresa: string; justificativa: string;
}

const FILA = ['AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'AGUARDANDO_VALIDACAO_HUMANA', 'ALERTA_CRITICO_ATIVO', 'AGUARDANDO_COMPLEMENTACAO'] as const;

const TriagemAMO = () => {
  const { role } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [confiancaMinima, setConfiancaMinima] = useState(70);
  const [filtro, setFiltro] = useState<string>('TODOS');
  const [edits, setEdits] = useState<Record<string, Edicao>>({});

  useEffect(() => {
    if (role && !['admin', 'triador_sst', 'dpo'].includes(role)) navigate('/dashboard');
  }, [role, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: par }] = await Promise.all([
      supabase.from('reports')
        .select('id, tracking_code, title, description, ai_summary, estado, competencia, risco_grave_imediato, prioridade, pilares, parte_amo, parte_empresa, confianca_ia, ia_schema_valido, dados_faltantes, documentos_sugeridos, trechos_relevantes, acao_recomendada, ai_classification_rationale, versao_classificacao, snapshot_unidade, snapshot_ghe, snapshot_cargo, created_at, companies(name)')
        .in('estado', [...FILA])
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('parametros_canal').select('confianca_minima').is('company_id', null).maybeSingle(),
    ]);
    if (par?.confianca_minima) setConfiancaMinima(par.confianca_minima);
    if (!error) setReports((data as unknown as ReportRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const edicao = (r: ReportRow): Edicao => edits[r.id] ?? {
    competencia: r.competencia ?? undefined,
    risco: r.risco_grave_imediato ?? undefined,
    prioridade: r.prioridade ?? undefined,
    pilares: r.pilares ?? [],
    parte_amo: r.parte_amo ?? '',
    parte_empresa: r.parte_empresa ?? '',
    justificativa: '',
  };

  const setEdicao = (id: string, patch: Partial<Edicao>, base: Edicao) =>
    setEdits(prev => ({ ...prev, [id]: { ...base, ...patch } }));

  const togglePilar = (r: ReportRow, p: Pilar) => {
    const e = edicao(r);
    let pilares = e.pilares.includes(p) ? e.pilares.filter(x => x !== p) : [...e.pilares, p];
    if (p === 'PT-00' && pilares.includes('PT-00')) pilares = ['PT-00'];
    else if (p !== 'PT-00') pilares = pilares.filter(x => x !== 'PT-00');
    setEdicao(r.id, { pilares }, e);
  };

  const reclassificarIA = async (r: ReportRow) => {
    setSaving(r.id);
    const { error } = await supabase.functions.invoke('classify-report-ai', { body: { report_id: r.id } });
    setSaving(null);
    if (error) toast({ title: 'Erro na triagem de IA', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Triagem de IA refeita' }); load(); }
  };

  const validar = async (r: ReportRow) => {
    const e = edicao(r);
    const erros = validarClassificacao({
      competencia: e.competencia, risco: e.risco, pilares: e.pilares,
      parte_amo: e.parte_amo, parte_empresa: e.parte_empresa, justificativa: e.justificativa,
    });
    if (erros.length) {
      toast({ title: 'Classificação inconsistente', description: erros.join(' '), variant: 'destructive' });
      return;
    }
    setSaving(r.id);
    const { data, error } = await supabase.functions.invoke('report-transition', {
      body: {
        report_id: r.id,
        estado_destino: 'CLASSIFICADA',
        justificativa: e.justificativa,
        classificacao: {
          classificacao_principal: e.competencia,
          risco_grave_imediato: e.risco,
          prioridade: e.risco === 'SIM' ? 'CRITICA' : e.prioridade,
          pilares_psicossociais: e.pilares,
          parte_competencia_amo: e.parte_amo || null,
          parte_competencia_empresa: e.parte_empresa || null,
          justificativa_classificacao: e.justificativa,
          dados_faltantes: r.dados_faltantes ?? [],
          confianca: 100,
          validacao_humana: 'OBRIGATORIA',
        },
      },
    });
    if (error || (data as { error?: string })?.error) {
      setSaving(null);
      toast({ title: 'Erro ao validar', description: (data as { error?: string })?.error || error?.message, variant: 'destructive' });
      return;
    }
    // Roteamento automático conforme a competência validada
    const destino = ROTEAMENTO[e.competencia as Competencia];
    if (destino) {
      await supabase.functions.invoke('report-transition', {
        body: { report_id: r.id, estado_destino: destino, motivo: 'Roteamento automático pós-classificação' },
      });
    }
    setSaving(null);
    toast({ title: 'Classificação validada', description: `Denúncia encaminhada: ${ESTADOS[destino] ?? destino}` });
    setEdits(prev => { const n = { ...prev }; delete n[r.id]; return n; });
    load();
  };

  const lista = useMemo(
    () => filtro === 'TODOS' ? reports : reports.filter(r => r.estado === filtro),
    [reports, filtro],
  );

  const criticos = reports.filter(r => r.risco_grave_imediato === 'SIM').length;
  const baixaConf = reports.filter(r => (r.confianca_ia ?? 0) < confiancaMinima).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/master-dashboard')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold">Triagem e validação humana</h1>
            <p className="text-sm text-muted-foreground">
              A saída da IA é sempre uma sugestão. A decisão final é sempre humana e registrada com versionamento.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os estados da fila</SelectItem>
                {FILA.map(e => <SelectItem key={e} value={e}>{ESTADOS[e]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Na fila</p><p className="text-3xl font-bold">{reports.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Risco grave e imediato</p><p className="text-3xl font-bold text-destructive">{criticos}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Confiança da IA &lt; {confiancaMinima}%</p><p className="text-3xl font-bold">{baixaConf}</p></CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : lista.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhuma denúncia pendente de triagem.</CardContent></Card>
        ) : lista.map(r => {
          const e = edicao(r);
          const baixa = (r.confianca_ia ?? 0) < confiancaMinima;
          return (
            <Card key={r.id} className={r.risco_grave_imediato === 'SIM' ? 'border-destructive' : undefined}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {r.risco_grave_imediato === 'SIM' && <ShieldAlert className="h-4 w-4 text-destructive" />}
                      {r.tracking_code} — {r.title}
                    </CardTitle>
                    <CardDescription>
                      {r.companies?.name} · {new Date(r.created_at).toLocaleString('pt-BR')} · v{r.versao_classificacao ?? 1}
                      {(r.snapshot_unidade || r.snapshot_cargo) && ` · ${[r.snapshot_unidade, r.snapshot_ghe, r.snapshot_cargo].filter(Boolean).join(' / ')}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{ESTADOS[r.estado] ?? r.estado}</Badge>
                    {r.prioridade && <Badge variant={prioridadeVariant(r.prioridade)}>{PRIORIDADES[r.prioridade]}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-sm bg-muted/40 rounded-md p-3 whitespace-pre-wrap max-h-48 overflow-auto">
                  {r.ai_summary || r.description}
                </div>

                {r.ia_schema_valido === false && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Saída da IA inconsistente</AlertTitle>
                    <AlertDescription>A sugestão automática não passou na validação de schema. Classifique manualmente.</AlertDescription>
                  </Alert>
                )}
                {baixa && r.ia_schema_valido !== false && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Confiança abaixo do mínimo ({r.confianca_ia ?? 0}%)</AlertTitle>
                    <AlertDescription>Revisão humana reforçada recomendada antes de classificar.</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* ---------------- Sugestão da IA ---------------- */}
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Bot className="h-4 w-4" /> Sugestão da IA
                      <Badge variant="secondary" className="ml-auto">Confiança {r.confianca_ia ?? 0}%</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.competencia && <Badge variant={competenciaVariant(r.competencia)}>{COMPETENCIAS[r.competencia].codigo} · {COMPETENCIAS[r.competencia].label}</Badge>}
                      {r.risco_grave_imediato && <Badge variant={r.risco_grave_imediato === 'SIM' ? 'destructive' : 'outline'}>Risco: {RISCOS[r.risco_grave_imediato]}</Badge>}
                      {(r.pilares ?? []).map(p => <Badge key={p} variant="outline">{p} {PILARES[p]}</Badge>)}
                    </div>
                    {r.ai_classification_rationale && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{r.ai_classification_rationale}</p>
                    )}
                    {r.parte_amo && <p className="text-xs"><b>Parte AMO:</b> {r.parte_amo}</p>}
                    {r.parte_empresa && <p className="text-xs"><b>Parte empresa:</b> {r.parte_empresa}</p>}
                    {!!(r.documentos_sugeridos ?? []).length && (
                      <div className="text-xs"><b>Evidências sugeridas:</b>
                        <ul className="list-disc pl-4 mt-1">{(r.documentos_sugeridos ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                      </div>
                    )}
                    {!!(r.dados_faltantes ?? []).length && (
                      <div className="text-xs"><b>Dados faltantes:</b>
                        <ul className="list-disc pl-4 mt-1">{(r.dados_faltantes ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                      </div>
                    )}
                    {!!(r.acao_recomendada ?? []).length && (
                      <div className="text-xs"><b>Ação recomendada:</b>
                        <ul className="list-disc pl-4 mt-1">{(r.acao_recomendada ?? []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => reclassificarIA(r)} disabled={saving === r.id}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Refazer triagem de IA
                    </Button>
                  </div>

                  {/* ---------------- Decisão humana ---------------- */}
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-center gap-2 font-medium text-sm"><UserCheck className="h-4 w-4" /> Decisão humana (obrigatória)</div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Competência</Label>
                        <Select value={e.competencia ?? ''} onValueChange={v => setEdicao(r.id, { competencia: v as Competencia }, e)}>
                          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(COMPETENCIAS) as Competencia[]).map(c => (
                              <SelectItem key={c} value={c}>{COMPETENCIAS[c].codigo} · {COMPETENCIAS[c].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Risco grave e imediato</Label>
                        <Select value={e.risco ?? ''} onValueChange={v => setEdicao(r.id, { risco: v as Risco, prioridade: v === 'SIM' ? 'CRITICA' : e.prioridade }, e)}>
                          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(RISCOS) as Risco[]).map(c => <SelectItem key={c} value={c}>{RISCOS[c]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Prioridade</Label>
                        <Select value={e.risco === 'SIM' ? 'CRITICA' : (e.prioridade ?? '')} disabled={e.risco === 'SIM'}
                          onValueChange={v => setEdicao(r.id, { prioridade: v as Prioridade }, e)}>
                          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(PRIORIDADES) as Prioridade[]).map(c => <SelectItem key={c} value={c}>{PRIORIDADES[c]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end text-xs text-muted-foreground">
                        {e.competencia && <span>{COMPETENCIAS[e.competencia].desc}</span>}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Pilares psicossociais</Label>
                      <div className="grid sm:grid-cols-2 gap-1 mt-1">
                        {(Object.keys(PILARES) as Pilar[]).map(p => (
                          <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox checked={e.pilares.includes(p)} onCheckedChange={() => togglePilar(r, p)} />
                            <span>{p} — {PILARES[p]}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(e.competencia === 'SST_NR1' || e.competencia === 'DENUNCIA_MISTA') && (
                      <div>
                        <Label className="text-xs">Parte de competência da AMO</Label>
                        <Textarea rows={2} value={e.parte_amo} onChange={ev => setEdicao(r.id, { parte_amo: ev.target.value }, e)} />
                      </div>
                    )}
                    {(e.competencia === 'EMPRESA_CLIENTE' || e.competencia === 'DENUNCIA_MISTA') && (
                      <div>
                        <Label className="text-xs">Parte de competência da empresa</Label>
                        <Textarea rows={2} value={e.parte_empresa} onChange={ev => setEdicao(r.id, { parte_empresa: ev.target.value }, e)} />
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Justificativa da decisão (registrada em auditoria)</Label>
                      <Textarea rows={3} value={e.justificativa} onChange={ev => setEdicao(r.id, { justificativa: ev.target.value }, e)}
                        placeholder="Fundamente a competência, o risco e os pilares considerados." />
                    </div>

                    <Separator />
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {e.competencia ? `Roteamento: ${ESTADOS[ROTEAMENTO[e.competencia]]}` : 'Selecione a competência'}
                      </span>
                      <Button onClick={() => validar(r)} disabled={saving === r.id}>
                        {saving === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Validar e encaminhar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>
      <Footer />
    </div>
  );
};

export default TriagemAMO;
