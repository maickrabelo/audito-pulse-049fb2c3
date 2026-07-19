import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Classification = '4A_sst' | '4B_out_of_scope' | '4C_mixed' | '4D_grave_immediate';

const labels: Record<Classification, string> = {
  '4A_sst': '4A — SST',
  '4B_out_of_scope': '4B — Fora de escopo',
  '4C_mixed': '4C — Misto',
  '4D_grave_immediate': '4D — Grave e iminente',
};

const badgeVariant = (c: string | null) =>
  c === '4D_grave_immediate' ? 'destructive'
    : c === '4B_out_of_scope' ? 'outline'
    : c === '4C_mixed' ? 'secondary' : 'default';

const TriagemAMO = () => {
  const { role } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { cls: Classification; notes: string }>>({});

  useEffect(() => {
    if (role && role !== 'admin') navigate('/dashboard');
  }, [role, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('id, tracking_code, title, description, ai_summary, ai_classification, ai_classification_rationale, amo_validated_classification, amo_validated_at, snapshot_unidade, snapshot_ghe, snapshot_cargo, snapshot_cbo, created_at, companies(name)')
      .is('amo_validated_at', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error) setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validate = async (id: string) => {
    const edit = edits[id];
    const report = reports.find(r => r.id === id);
    const cls = edit?.cls || report?.ai_classification;
    if (!cls) return;
    setSaving(id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reports').update({
      amo_validated_classification: cls,
      amo_validated_by: user?.id,
      amo_validated_at: new Date().toISOString(),
      amo_validation_notes: edit?.notes || null,
    }).eq('id', id);
    setSaving(null);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    if (cls === '4D_grave_immediate') {
      supabase.functions.invoke('escalate-report', { body: { report_id: id } }).catch(console.error);
    }
    toast({ title: 'Triagem validada' });
    load();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/master-dashboard')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <h1 className="text-3xl font-bold text-audit-primary">Triagem AMO</h1>
              <p className="text-muted-foreground">Validação humana da classificação de IA (4A/4B/4C/4D).</p>
            </div>
            <Button onClick={load} variant="outline">Recarregar</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : reports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-600" />
              Nenhuma denúncia aguardando triagem.
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {reports.map(r => {
                const currentCls: Classification = (edits[r.id]?.cls || r.ai_classification || '4A_sst') as Classification;
                return (
                  <Card key={r.id} className={r.ai_classification === '4D_grave_immediate' ? 'border-destructive border-2' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <CardTitle className="text-lg">{r.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {r.companies?.name} · Protocolo <b>{r.tracking_code}</b> · {new Date(r.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.ai_classification === '4D_grave_immediate' && (
                            <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> 4D</Badge>
                          )}
                          <Badge variant={badgeVariant(r.ai_classification) as any}>
                            IA: {labels[r.ai_classification as Classification] || 'pendente'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {r.ai_summary && (
                        <div className="text-sm bg-muted/40 p-3 rounded">
                          <b>Resumo:</b> {r.ai_summary}
                        </div>
                      )}
                      {r.ai_classification_rationale && (
                        <p className="text-sm text-muted-foreground">
                          <b>Justificativa IA:</b> {r.ai_classification_rationale}
                        </p>
                      )}
                      {(r.snapshot_unidade || r.snapshot_cargo) && (
                        <p className="text-xs text-muted-foreground">
                          Vínculo: {[r.snapshot_unidade, r.snapshot_cargo, r.snapshot_ghe, r.snapshot_cbo].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Classificação final</label>
                          <Select value={currentCls} onValueChange={(v) => setEdits(e => ({ ...e, [r.id]: { cls: v as Classification, notes: e[r.id]?.notes || '' } }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(labels) as Classification[]).map(k => (
                                <SelectItem key={k} value={k}>{labels[k]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Observações da triagem</label>
                          <Textarea
                            rows={2}
                            value={edits[r.id]?.notes || ''}
                            onChange={(e) => setEdits(prev => ({ ...prev, [r.id]: { cls: prev[r.id]?.cls || currentCls, notes: e.target.value } }))}
                          />
                        </div>
                      </div>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">Ver relato completo</summary>
                        <p className="whitespace-pre-wrap mt-2">{r.description}</p>
                      </details>
                      <div className="flex justify-end">
                        <Button onClick={() => validate(r.id)} disabled={saving === r.id}>
                          {saving === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Validar triagem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TriagemAMO;
