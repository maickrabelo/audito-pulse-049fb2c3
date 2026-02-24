import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Download, RefreshCw, AlertCircle, LogIn, LogOut, Eye, Wifi } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AccessLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  event_type: string;
  page_path: string | null;
  error_message: string | null;
  error_stack: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const PAGE_SIZE = 50;

const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login:     { label: 'Login',      icon: <LogIn className="h-3 w-3" />,      variant: 'default' },
  logout:    { label: 'Logout',     icon: <LogOut className="h-3 w-3" />,     variant: 'secondary' },
  page_view: { label: 'Navegação',  icon: <Eye className="h-3 w-3" />,        variant: 'outline' },
  error:     { label: 'Erro',       icon: <AlertCircle className="h-3 w-3" />, variant: 'destructive' },
  api_error: { label: 'Erro API',   icon: <Wifi className="h-3 w-3" />,       variant: 'destructive' },
};

const PERIOD_OPTIONS = [
  { label: 'Hoje',          value: 'today' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Todos',          value: 'all' },
];

export const AccessLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('7d');
  const [emailSearch, setEmailSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('access_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }

      if (emailSearch.trim()) {
        query = query.ilike('user_email', `%${emailSearch.trim()}%`);
      }

      if (periodFilter === 'today') {
        query = query.gte('created_at', startOfDay(new Date()).toISOString());
      } else if (periodFilter === '7d') {
        query = query.gte('created_at', subDays(new Date(), 7).toISOString());
      } else if (periodFilter === '30d') {
        query = query.gte('created_at', subDays(new Date(), 30).toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setLogs((data as AccessLog[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching access logs:', err);
    } finally {
      setLoading(false);
    }
  }, [eventFilter, periodFilter, emailSearch, page]);

  useEffect(() => {
    setPage(0);
  }, [eventFilter, periodFilter, emailSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Horário', 'Usuário', 'Perfil', 'Evento', 'Página', 'Erro'];
    const rows = logs.map(log => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      log.user_email || 'Anônimo',
      log.user_role || '-',
      log.event_type,
      log.page_path || '-',
      log.error_message || '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Logs de Acesso</CardTitle>
              <CardDescription>{totalCount.toLocaleString('pt-BR')} registros encontrados</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!logs.length}>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail..."
                className="pl-9"
                value={emailSearch}
                onChange={e => setEmailSearch(e.target.value)}
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="page_view">Navegação</SelectItem>
                <SelectItem value="error">Erro de Página</SelectItem>
                <SelectItem value="api_error">Erro de API</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Horário</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : logs.map(log => {
                  const isError = log.event_type === 'error' || log.event_type === 'api_error';
                  const eventInfo = EVENT_LABELS[log.event_type] ?? { label: log.event_type, icon: null, variant: 'outline' as const };
                  return (
                    <TableRow key={log.id} className={isError ? 'bg-destructive/5 hover:bg-destructive/10' : ''}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">
                        {log.user_email || <span className="text-muted-foreground italic">Anônimo</span>}
                      </TableCell>
                      <TableCell>
                        {log.user_role ? (
                          <Badge variant="secondary" className="text-xs capitalize">{log.user_role}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={eventInfo.variant} className="flex items-center gap-1 w-fit text-xs">
                          {eventInfo.icon}
                          {eventInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs font-mono text-muted-foreground" title={log.page_path || ''}>
                        {log.page_path || '—'}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {log.error_message ? (
                          <span className="text-destructive text-xs truncate block" title={log.error_message}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
