import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { COMPETENCIAS, ESTADOS, PILARES, TRANSICOES, prioridadeVariant } from '@/lib/nr1';

const ESTADOS_AMO = [
  'ENCAMINHADA_AMO', 'EM_TRATATIVA_MISTA', 'AGUARDANDO_EVIDENCIAS', 'EM_ANALISE_TECNICA_AMO',
  'MEDIDAS_DEFINIDAS', 'PLANO_DE_ACAO_ABERTO', 'EM_ACOMPANHAMENTO', 'AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO', 'ENCERRADA',
];
const DESTINOS_PERMITIDOS = new Set([
  'AGUARDANDO_EVIDENCIAS', 'EM_ANALISE_TECNICA_AMO', 'MEDIDAS_DEFINIDAS', 'PLANO_DE_ACAO_ABERTO',
  'EM_ACOMPANHAMENTO', 'AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO', 'ENCERRADA',
]);

interface Caso {
  id: string; tracking_code: string; title: string; description: string; ai_summary: string | null;
  estado: string; competencia: string | null; prioridade: string | null; risco_grave_imediato: string | null;
  pilares: string[]; parte_amo: string | null; parte_empresa: string | null; created_at: string;
  snapshot_unidade: string | null; snapshot_setor: string | null; snapshot_cargo: string | null;
  companies: { name: string } | null;
}
interface Plano { id: string; acao: string; responsavel_nome: string; prazo: string; status: string; tipo: string }
interface Evid { id: string; documento: string; descricao: string | null; destinatario: string; prazo_limite: string | null; status: string }
interface Hist { id: string; created_at: string; old_status: string | null; new_status: string; notes: string | null }
interface Sub { id: string; resumo: string; concluida_em: string | null }

const TratativasAMO = () => {
  const { role, isLoading } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Caso | null>(null);
  const [filtro, setFiltro] = useState<'abertos' | 'encerrados'>('abertos');

  useEffect(() => {
    if (isLoading) return;
    if (role && role !== 'tratador_amo' && role !== 'admin') navigate('/');
  }, [role, isLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('id, tracking_code, title, description, ai_summary, estado, competencia, prioridade, risco_grave_imediato, pilares, parte_amo, parte_empresa, created_at, snapshot_unidade, snapshot_setor, snapshot_cargo, companies(name)')
      .in('competencia', ['SST_NR1', 'DENUNCIA_MISTA'])
      .in('estado', ESTADOS_AMO as never)
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    const list = (data as unknown as Caso[]) || [];
    setCasos(list);
    setSel(s => (s ? list.find(c => c.id === s.id) ?? null : null));
    setLoading(false);
  };
  useEffect(() => { if (!isLoading && role) load(); }, [isLoading, role]);

  const visiveis = casos.filter(c => filtro === 'encerrados' ? c.estado === 'ENCERRADA' : c.estado !== 'ENCERRADA');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Tratativas AMO</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Manifestações classificadas pela triagem como competência do Grupo AMO (CL-01 — SST/NR-1) e a parte AMO das manifestações mistas.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <Button size="sm" variant={filtro === 'abertos' ? 'default' : 'outline'} onClick={() => setFiltro('abertos')}>
                  Em andamento ({casos.filter(c => c.estado !== 'ENCERRADA').length})
                </Button>
                <Button size="sm" variant={filtro === 'encerrados' ? 'default' : 'outline'} onClick={() => setFiltro('encerrados')}>
                  Encerradas ({casos.filter(c => c.estado === 'ENCERRADA').length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
              ) : visiveis.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">Nenhuma manifestação.</p>
              ) : visiveis.map(c => (
                <button key={c.id} onClick={() => setSel(c)}
                  className={`w-full text-left border rounded p-3 hover:bg-muted/40 ${sel?.id === c.id ? 'border-primary bg-muted/40' : ''}`}>
                  <div className="flex gap-1 flex-wrap mb-1">
                    <Badge variant="outline" className="text-xs">{COMPETENCIAS[c.competencia as keyof typeof COMPETENCIAS]?.codigo}</Badge>
                    {c.prioridade && <Badge variant={prioridadeVariant(c.prioridade) as never} className="text-xs">{c.prioridade}</Badge>}
                    {c.risco_grave_imediato === 'SIM' && <Badge variant="destructive" className="text-xs">Risco grave</Badge>}
                  </div>
                  <div className="font-medium text-sm line-clamp-1">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.companies?.name} · {c.tracking_code}</div>
                  <div className="text-xs mt-1">{ESTADOS[c.estado] ?? c.estado}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {sel ? <Detalhe caso={sel} onChanged={load} /> : (
              <Card><CardContent className="py-20 text-center text-muted-foreground">Selecione uma manifestação para tratar.</CardContent></Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Detalhe = ({ caso, onChanged }: { caso: Caso; onChanged: () => void }) => {
  const { toast } = useToast();
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState<Hist[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [evids, setEvids] = useState<Evid[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [analiseId, setAnaliseId] = useState<string | null>(null);
  const [analise, setAnalise] = useState({
    pilares_confirmados: [] as string[], evidencias_avaliadas: '', fatores_identificados: '',
    conclusao_tecnica: '', recomendacoes: '', necessita_pgr: false, necessita_treinamento: false, necessita_monitoramento: false,
  });
  const [novoPlano, setNovoPlano] = useState({ acao: '', responsavel_nome: '', prazo: '', tipo: 'corretiva' });
  const [novaEvid, setNovaEvid] = useState({ documento: '', descricao: '', prazo_limite: '' });

  const loadAll = async () => {
    const [h, p, e, a, s] = await Promise.all([
      supabase.from('report_updates').select('id, created_at, old_status, new_status, notes').eq('report_id', caso.id).order('created_at', { ascending: false }),
      supabase.from('planos_acao').select('id, acao, responsavel_nome, prazo, status, tipo').eq('report_id', caso.id).order('created_at'),
      supabase.from('solicitacoes_evidencia').select('id, documento, descricao, destinatario, prazo_limite, status').eq('report_id', caso.id).order('created_at'),
      supabase.from('analises_tecnicas').select('*').eq('report_id', caso.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('subtratativas').select('id, resumo, concluida_em').eq('report_id', caso.id).eq('escopo', 'AMO').maybeSingle(),
    ]);
    setHist((h.data as Hist[]) || []);
    setPlanos((p.data as Plano[]) || []);
    setEvids((e.data as Evid[]) || []);
    setSub((s.data as Sub) || null);
    if (a.data) {
      const d = a.data as Record<string, unknown>;
      setAnaliseId(d.id as string);
      setAnalise({
        pilares_confirmados: (d.pilares_confirmados as string[]) || [],
        evidencias_avaliadas: (d.evidencias_avaliadas as string) || '',
        fatores_identificados: (d.fatores_identificados as string) || '',
        conclusao_tecnica: (d.conclusao_tecnica as string) || '',
        recomendacoes: (d.recomendacoes as string) || '',
        necessita_pgr: !!d.necessita_pgr, necessita_treinamento: !!d.necessita_treinamento, necessita_monitoramento: !!d.necessita_monitoramento,
      });
    } else {
      setAnaliseId(null);
      setAnalise({ pilares_confirmados: caso.pilares.filter(x => x !== 'PT-00'), evidencias_avaliadas: '', fatores_identificados: '', conclusao_tecnica: '', recomendacoes: '', necessita_pgr: false, necessita_treinamento: false, necessita_monitoramento: false });
    }
  };
  useEffect(() => { setNota(''); loadAll(); }, [caso.id]);

  const destinos = useMemo(() => (TRANSICOES[caso.estado] || []).filter(d => DESTINOS_PERMITIDOS.has(d)), [caso.estado]);

  const mover = async (destino: string) => {
    if (destino === 'ENCERRADA' && nota.trim().length < 10) {
      toast({ title: 'Justificativa obrigatória', description: 'Escreva a justificativa de encerramento (mín. 10 caracteres) no campo de observação.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('report-transition', {
      body: { report_id: caso.id, estado_destino: destino, justificativa: nota.trim() || undefined, motivo: nota.trim() || undefined },
    });
    setBusy(false);
    const err = error?.message || (data as { error?: string })?.error;
    if (err) { toast({ title: 'Não foi possível mudar a etapa', description: err, variant: 'destructive' }); return; }
    toast({ title: `Etapa: ${ESTADOS[destino]}` });
    setNota('');
    onChanged();
    loadAll();
  };

  const registrarNota = async () => {
    if (!nota.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('report_updates').insert({ report_id: caso.id, user_id: u.user?.id, old_status: caso.estado, new_status: caso.estado, notes: nota.trim() });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    setNota(''); loadAll();
    toast({ title: 'Observação registrada' });
  };

  const salvarAnalise = async () => {
    if (analise.conclusao_tecnica.trim().length < 10) {
      toast({ title: 'Conclusão técnica obrigatória', variant: 'destructive' }); return;
    }
    const { data: u } = await supabase.auth.getUser();
    const payload = { ...analise, report_id: caso.id, responsavel_id: u.user?.id } as never;
    const { error } = analiseId
      ? await supabase.from('analises_tecnicas').update(payload).eq('id', analiseId)
      : await supabase.from('analises_tecnicas').insert(payload);
    if (error) { toast({ title: 'Erro ao salvar análise', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Análise técnica salva' });
    loadAll();
  };

  const addPlano = async () => {
    if (!novoPlano.acao || !novoPlano.responsavel_nome || !novoPlano.prazo) {
      toast({ title: 'Preencha ação, responsável e prazo', variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('planos_acao').insert({ ...novoPlano, report_id: caso.id, subtratativa_id: sub?.id ?? null } as never);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    setNovoPlano({ acao: '', responsavel_nome: '', prazo: '', tipo: 'corretiva' }); loadAll();
  };
  const concluirPlano = async (p: Plano) => {
    const { error } = await supabase.from('planos_acao').update({ status: 'CONCLUIDA', concluido_em: new Date().toISOString() }).eq('id', p.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' }); else loadAll();
  };

  const addEvid = async () => {
    if (!novaEvid.documento) { toast({ title: 'Informe o documento solicitado', variant: 'destructive' }); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('solicitacoes_evidencia').insert({
      report_id: caso.id, subtratativa_id: sub?.id ?? null, documento: novaEvid.documento, descricao: novaEvid.descricao || null,
      destinatario: 'EMPRESA', solicitado_por: u.user?.id, prazo_limite: novaEvid.prazo_limite ? new Date(novaEvid.prazo_limite).toISOString() : null,
    } as never);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    setNovaEvid({ documento: '', descricao: '', prazo_limite: '' }); loadAll();
    toast({ title: 'Evidência solicitada à empresa' });
  };
  const atenderEvid = async (e: Evid) => {
    const { error } = await supabase.from('solicitacoes_evidencia').update({ status: 'atendida', atendida_em: new Date().toISOString() }).eq('id', e.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' }); else loadAll();
  };

  const concluirSub = async () => {
    if (!sub) return;
    if (analise.conclusao_tecnica.trim().length < 10) { toast({ title: 'Salve a análise técnica antes', variant: 'destructive' }); return; }
    const { error } = await supabase.from('subtratativas').update({ concluida_em: new Date().toISOString(), conclusao: analise.conclusao_tecnica, estado: 'ENCERRADA' } as never).eq('id', sub.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' }); else { toast({ title: 'Parte AMO concluída' }); loadAll(); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 flex-wrap mb-1">
          <Badge>{COMPETENCIAS[caso.competencia as keyof typeof COMPETENCIAS]?.codigo} · {COMPETENCIAS[caso.competencia as keyof typeof COMPETENCIAS]?.label}</Badge>
          <Badge variant="outline">{ESTADOS[caso.estado]}</Badge>
          {caso.risco_grave_imediato === 'SIM' && <Badge variant="destructive">Risco grave e imediato</Badge>}
        </div>
        <CardTitle className="text-xl">{caso.title}</CardTitle>
        <CardDescription>
          {caso.companies?.name} · Protocolo {caso.tracking_code} · {new Date(caso.created_at).toLocaleString('pt-BR')}
          {(caso.snapshot_unidade || caso.snapshot_setor || caso.snapshot_cargo) && ` · ${[caso.snapshot_unidade, caso.snapshot_setor, caso.snapshot_cargo].filter(Boolean).join(' / ')}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="andamento">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="andamento">Andamento</TabsTrigger>
            <TabsTrigger value="analise">Análise técnica</TabsTrigger>
            <TabsTrigger value="plano">Plano de ação ({planos.length})</TabsTrigger>
            <TabsTrigger value="evid">Evidências ({evids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="andamento" className="space-y-4">
            <div className="rounded border p-3 bg-muted/30 text-sm space-y-2">
              <p className="whitespace-pre-wrap">{caso.description}</p>
              {caso.parte_amo && <p><b>Parte de competência AMO:</b> {caso.parte_amo}</p>}
              {caso.competencia === 'DENUNCIA_MISTA' && caso.parte_empresa && <p className="text-muted-foreground"><b>Parte da empresa (tratada por ela):</b> {caso.parte_empresa}</p>}
              {caso.pilares?.length > 0 && <p className="text-xs">Pilares: {caso.pilares.map(p => `${p} ${PILARES[p as keyof typeof PILARES] ?? ''}`).join(' · ')}</p>}
            </div>

            {sub && (
              <div className="rounded border p-3 text-sm flex items-center justify-between gap-2">
                <span>Parte AMO da manifestação mista: <b>{sub.concluida_em ? 'concluída' : 'em aberto'}</b></span>
                {!sub.concluida_em && <Button size="sm" variant="outline" onClick={concluirSub}>Concluir parte AMO</Button>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observação / justificativa</Label>
              <Textarea rows={3} value={nota} onChange={e => setNota(e.target.value)} placeholder="Registre o que foi feito. Obrigatório para encerrar." />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={registrarNota} disabled={!nota.trim()}>Registrar observação</Button>
                {destinos.map(d => (
                  <Button key={d} size="sm" disabled={busy} variant={d === 'ENCERRADA' ? 'destructive' : 'default'} onClick={() => mover(d)}>
                    {busy && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Mover para: {ESTADOS[d]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Histórico</h4>
              <div className="space-y-1">
                {hist.length === 0 ? <p className="text-xs text-muted-foreground">Sem registros.</p> : hist.map(h => (
                  <div key={h.id} className="text-xs border-l-2 pl-2 py-1">
                    <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</span>{' · '}
                    {h.old_status !== h.new_status ? <b>{ESTADOS[h.old_status ?? ''] ?? h.old_status} → {ESTADOS[h.new_status] ?? h.new_status}</b> : <b>Observação</b>}
                    {h.notes && <div>{h.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analise" className="space-y-3">
            <div>
              <Label>Pilares confirmados</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {Object.entries(PILARES).filter(([k]) => k !== 'PT-00').map(([k, v]) => (
                  <label key={k} className="flex items-center gap-1 text-sm">
                    <Checkbox checked={analise.pilares_confirmados.includes(k)} onCheckedChange={(c) =>
                      setAnalise(a => ({ ...a, pilares_confirmados: c ? [...a.pilares_confirmados, k] : a.pilares_confirmados.filter(x => x !== k) }))} />
                    {k} {v}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Evidências avaliadas</Label><Textarea rows={2} value={analise.evidencias_avaliadas} onChange={e => setAnalise({ ...analise, evidencias_avaliadas: e.target.value })} /></div>
            <div><Label>Fatores identificados</Label><Textarea rows={2} value={analise.fatores_identificados} onChange={e => setAnalise({ ...analise, fatores_identificados: e.target.value })} /></div>
            <div><Label>Conclusão técnica *</Label><Textarea rows={3} value={analise.conclusao_tecnica} onChange={e => setAnalise({ ...analise, conclusao_tecnica: e.target.value })} /></div>
            <div><Label>Recomendações</Label><Textarea rows={2} value={analise.recomendacoes} onChange={e => setAnalise({ ...analise, recomendacoes: e.target.value })} /></div>
            <div className="flex flex-wrap gap-4 text-sm">
              {([['necessita_pgr', 'Revisar PGR'], ['necessita_treinamento', 'Treinamento'], ['necessita_monitoramento', 'Monitoramento']] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-1">
                  <Checkbox checked={analise[k]} onCheckedChange={(c) => setAnalise({ ...analise, [k]: !!c })} /> {l}
                </label>
              ))}
            </div>
            <Button onClick={salvarAnalise}>Salvar análise técnica</Button>
          </TabsContent>

          <TabsContent value="plano" className="space-y-3">
            {planos.map(p => (
              <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">{p.acao}</div>
                  <div className="text-xs text-muted-foreground">{p.tipo} · {p.responsavel_nome} · prazo {new Date(p.prazo + 'T00:00').toLocaleDateString('pt-BR')}</div>
                </div>
                {p.status === 'CONCLUIDA'
                  ? <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída</Badge>
                  : <Button size="sm" variant="outline" onClick={() => concluirPlano(p)}>Marcar concluída</Button>}
              </div>
            ))}
            <div className="border rounded p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="md:col-span-2"><Label>Ação</Label><Input value={novoPlano.acao} onChange={e => setNovoPlano({ ...novoPlano, acao: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={novoPlano.responsavel_nome} onChange={e => setNovoPlano({ ...novoPlano, responsavel_nome: e.target.value })} /></div>
              <div><Label>Prazo</Label><Input type="date" value={novoPlano.prazo} onChange={e => setNovoPlano({ ...novoPlano, prazo: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <select className="w-full border rounded-md h-10 px-3 bg-background text-sm" value={novoPlano.tipo} onChange={e => setNovoPlano({ ...novoPlano, tipo: e.target.value })}>
                  <option value="corretiva">Corretiva</option>
                  <option value="preventiva">Preventiva</option>
                </select>
              </div>
              <div className="flex items-end"><Button onClick={addPlano}>Adicionar ação</Button></div>
            </div>
          </TabsContent>

          <TabsContent value="evid" className="space-y-3">
            {evids.map(e => (
              <div key={e.id} className="border rounded p-3 flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">{e.documento}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.descricao}{e.prazo_limite && ` · prazo ${new Date(e.prazo_limite).toLocaleDateString('pt-BR')}`}
                  </div>
                </div>
                {e.status === 'atendida'
                  ? <Badge variant="secondary">Atendida</Badge>
                  : <Button size="sm" variant="outline" onClick={() => atenderEvid(e)}>Marcar recebida</Button>}
              </div>
            ))}
            <div className="border rounded p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="md:col-span-2"><Label>Documento / evidência solicitada à empresa</Label><Input value={novaEvid.documento} onChange={e => setNovaEvid({ ...novaEvid, documento: e.target.value })} placeholder="Ex.: PGR atualizado, escala de trabalho" /></div>
              <div className="md:col-span-2"><Label>Detalhes</Label><Textarea rows={2} value={novaEvid.descricao} onChange={e => setNovaEvid({ ...novaEvid, descricao: e.target.value })} /></div>
              <div><Label>Prazo</Label><Input type="date" value={novaEvid.prazo_limite} onChange={e => setNovaEvid({ ...novaEvid, prazo_limite: e.target.value })} /></div>
              <div className="flex items-end"><Button onClick={addEvid}>Solicitar evidência</Button></div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TratativasAMO;
