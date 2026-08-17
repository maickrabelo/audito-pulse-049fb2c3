import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Acceptance {
  id: string;
  user_name: string | null;
  user_email: string | null;
  role: string | null;
  document_code: string;
  document_version: string;
  document_hash: string;
  result: string;
  reason: string | null;
  ip: string | null;
  user_agent: string | null;
  timezone: string | null;
  accepted_at: string;
}

const docLabels: Record<string, string> = {
  DOC02_TERMO_EMPRESA: 'Doc 02 — Empresa Cliente',
  DOC03_TERMO_AMO: 'Doc 03 — Grupo AMO',
  DOC04_AVISO_PRIVACIDADE: 'Doc 04 — Aviso de Privacidade',
};

const LegalAcceptancesCard: React.FC = () => {
  const [rows, setRows] = useState<Acceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docFilter, setDocFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('legal_acceptances')
        .select('*')
        .order('accepted_at', { ascending: false })
        .limit(1000);
      setRows((data as Acceptance[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesDoc = docFilter === 'all' || r.document_code === docFilter;
      const matchesTerm =
        !term ||
        [r.user_name, r.user_email, r.role].some((v) => v?.toLowerCase().includes(term));
      return matchesDoc && matchesTerm;
    });
  }, [rows, search, docFilter]);

  const exportCsv = () => {
    const header = [
      'Data/hora',
      'Fuso',
      'Usuário',
      'E-mail',
      'Perfil',
      'Documento',
      'Versão',
      'Hash',
      'Resultado',
      'Motivo',
      'IP',
      'Navegador',
    ];
    const lines = filtered.map((r) =>
      [
        new Date(r.accepted_at).toISOString(),
        r.timezone ?? '',
        r.user_name ?? '',
        r.user_email ?? '',
        r.role ?? '',
        docLabels[r.document_code] ?? r.document_code,
        r.document_version,
        r.document_hash,
        r.result === 'accepted' ? 'Aceite' : 'Recusa',
        r.reason ?? '',
        r.ip ?? '',
        r.user_agent ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidencias-aceite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidências de aceite dos Termos</CardTitle>
        <CardDescription>
          Registro imutável dos aceites e recusas dos termos de primeiro acesso, com versão, hash,
          perfil e contexto técnico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Buscar por nome, e-mail ou perfil"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={docFilter} onValueChange={setDocFilter}>
            <SelectTrigger className="sm:w-64">
              <SelectValue placeholder="Documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os documentos</SelectItem>
              {Object.entries(docLabels).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando evidências...
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum registro de aceite encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-4">Data/hora</th>
                  <th className="py-2 pr-4">Usuário</th>
                  <th className="py-2 pr-4">Perfil</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Resultado</th>
                  <th className="py-2 pr-4">IP</th>
                  <th className="py-2 pr-4">Hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {new Date(r.accepted_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium">{r.user_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.user_email}</div>
                    </td>
                    <td className="py-2 pr-4">{r.role || '—'}</td>
                    <td className="py-2 pr-4">
                      {docLabels[r.document_code] ?? r.document_code}
                      <div className="text-xs text-muted-foreground">v{r.document_version}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={r.result === 'accepted' ? 'default' : 'destructive'}>
                        {r.result === 'accepted' ? 'Aceite' : 'Recusa'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{r.ip || '—'}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.document_hash.slice(0, 12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalAcceptancesCard;
