import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import TriagemAMO from './TriagemAMO';

interface ReportRow {
  id: string;
  tracking_code: string;
  title: string;
  status: string;
  created_at: string;
  ai_classification: string | null;
  amo_validated_classification: string | null;
  ai_classification_rationale: string | null;
  risco_grave_imediato: string | null;
  companies: { name: string } | null;
}

const LABELS: Record<string, string> = {
  '4A_sst': '4A SST',
  '4B_out_of_scope': '4B Fora de escopo',
  '4C_mixed': '4C Misto',
  pending_ai: 'Pendente IA',
};

const TriadorDashboard = () => {
  const { role, isLoading } = useRealAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('reports-cat');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('all');

  useEffect(() => {
    if (isLoading) return;
    if (role && role !== 'triador_sst') {
      if (role === 'admin') navigate('/master-dashboard');
      else navigate('/');
    }
  }, [role, isLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('id, tracking_code, title, status, created_at, ai_classification, amo_validated_classification, ai_classification_rationale, risco_grave_imediato, companies(name)')
      .order('created_at', { ascending: false })
      .limit(300);
    setReports((data as unknown as ReportRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'reports-cat') load(); }, [tab]);

  const filtradas = reports.filter(r =>
    filtro === 'all'
      ? true
      : filtro === 'risco_grave'
        ? r.risco_grave_imediato === 'SIM'
        : (r.amo_validated_classification || r.ai_classification || 'pending_ai') === filtro,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Painel de Tratamento</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Análise e validação humana das manifestações do canal.
        </p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="reports-cat">Manifestações por Categoria</TabsTrigger>
            <TabsTrigger value="triagem">Triagem AMO</TabsTrigger>
          </TabsList>

          <TabsContent value="reports-cat">
            <Card>
              <CardHeader>
                <CardTitle>Manifestações por Categoria (Triagem IA)</CardTitle>
                <CardDescription>
                  Classificação automática da IA (4A SST · 4B Fora de escopo · 4C Misto). A validação humana é feita na aba <b>Triagem AMO</b>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap mb-4">
                  {[
                    { k: 'all', label: 'Todas' },
                    { k: 'pending_ai', label: 'Pendente IA' },
                    { k: '4A_sst', label: '4A — SST' },
                    { k: '4B_out_of_scope', label: '4B — Fora de escopo' },
                    { k: '4C_mixed', label: '4C — Misto' },
                    { k: 'risco_grave', label: 'Risco Grave' },
                  ].map(o => {
                    const count = o.k === 'all'
                      ? reports.length
                      : o.k === 'risco_grave'
                        ? reports.filter(r => r.risco_grave_imediato === 'SIM').length
                        : reports.filter(r => (r.amo_validated_classification || r.ai_classification || 'pending_ai') === o.k).length;
                    return (
                      <Button key={o.k} size="sm" variant={filtro === o.k ? 'default' : 'outline'} onClick={() => setFiltro(o.k)}>
                        {o.label} <span className="ml-2 opacity-70">({count})</span>
                      </Button>
                    );
                  })}
                  <Button size="sm" variant="ghost" onClick={load} className="ml-auto">Recarregar</Button>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
                ) : filtradas.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">Nenhuma manifestação encontrada.</div>
                ) : (
                  <div className="space-y-2">
                    {filtradas.map(r => {
                      const cls = r.amo_validated_classification || r.ai_classification || 'pending_ai';
                      const validated = !!r.amo_validated_classification;
                      const color = cls === '4C_mixed' ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : cls === '4B_out_of_scope' ? 'bg-gray-100 text-gray-700 border-gray-300'
                          : cls === '4A_sst' ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-300';
                      return (
                        <div key={r.id} className="border rounded p-3 hover:bg-muted/30">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded border ${color}`}>{LABELS[cls] || cls}</span>
                            {r.risco_grave_imediato === 'SIM' && (
                              <span className="text-xs px-2 py-0.5 rounded border bg-red-100 text-red-800 border-red-300">⚠ Risco Grave</span>
                            )}
                            {validated && <span className="text-xs text-green-700">✓ validado AMO</span>}
                            <span className="text-xs text-muted-foreground">Protocolo <b>{r.tracking_code}</b></span>
                          </div>
                          <div className="font-medium mt-1">{r.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.companies?.name} · {new Date(r.created_at).toLocaleString('pt-BR')} · status: {r.status}
                          </div>
                          {r.ai_classification_rationale && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2"><b>IA:</b> {r.ai_classification_rationale}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triagem">
            <TriagemAMO embedded />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TriadorDashboard;
