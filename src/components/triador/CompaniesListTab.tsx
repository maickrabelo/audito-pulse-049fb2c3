import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';

interface Company { id: string; name: string; cnpj: string | null; slug: string | null; email: string | null; subscription_status: string | null; }

const PAGE = 50;

const CompaniesListTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const all: Company[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('companies')
          .select('id, name, cnpj, slug, email, subscription_status')
          .order('name').range(from, from + 999);
        if (error || !data || data.length === 0) break;
        all.push(...(data as Company[]));
        if (data.length < 1000) break;
      }
      setCompanies(all);
      setLoading(false);
    })();
  }, []);

  useEffect(() => setPage(1), [q]);
  const term = q.toLowerCase();
  const digits = q.replace(/\D/g, '');
  const filtered = companies.filter(c => !q || c.name.toLowerCase().includes(term)
    || (!!digits && ((c.cnpj || '').replace(/\D/g, '').includes(digits) || (c.slug || '').includes(digits)))
    || (c.email || '').toLowerCase().includes(term));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresas Cadastradas</CardTitle>
        <CardDescription>{loading ? 'Carregando...' : `${companies.length} empresas cadastradas`}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input placeholder="Buscar por nome, CNPJ ou e-mail..." value={q} onChange={e => setQ(e.target.value)} className="max-w-md mb-4" />
        {loading ? <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div> : (
          <>
            <div className="divide-y border rounded">
              {shown.map(c => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">CNPJ: {c.cnpj || '—'}{c.email ? ` · ${c.email}` : ''} · {c.subscription_status === 'active' ? 'Ativa' : c.subscription_status === 'pending' ? 'Pendente' : 'Inativa'}</div>
                  </div>
                  {c.slug && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`${window.location.origin}/report/${c.slug}`, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {shown.length === 0 && <div className="p-6 text-center text-muted-foreground">Nenhuma empresa encontrada.</div>}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <span className="text-sm">Página {page} de {pages}</span>
                <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompaniesListTab;
