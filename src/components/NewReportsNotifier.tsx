import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface Item { id: string; created_at: string; tracking_code: string | null; company_id: string; companies?: { name: string } | null }

const KEY = 'new-reports-last-seen';

const NewReportsNotifier = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const knownIds = useRef<Set<string> | null>(null);

  const load = async () => {
    const since = localStorage.getItem(KEY) || new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await supabase
      .from('reports')
      .select('id, created_at, tracking_code, company_id, companies(name)')
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    const list = (data as unknown as Item[]) || [];
    if (knownIds.current) {
      const fresh = list.filter(i => !knownIds.current!.has(i.id));
      if (fresh.length) {
        toast({
          title: fresh.length === 1 ? 'Nova manifestação recebida' : `${fresh.length} novas manifestações`,
          description: fresh.map(f => f.companies?.name || 'Empresa').slice(0, 3).join(', '),
        });
      }
    }
    knownIds.current = new Set(list.map(i => i.id));
    setItems(list);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const markSeen = () => {
    localStorage.setItem(KEY, new Date().toISOString());
    setItems([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Novas manifestações">
          <Bell className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-sm">Novas manifestações</p>
          {items.length > 0 && <Button size="sm" variant="ghost" onClick={markSeen}>Marcar como vistas</Button>}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma manifestação nova.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {items.map(i => (
              <div key={i.id} className="border rounded p-2 text-sm">
                <div className="font-medium truncate">{i.companies?.name || 'Empresa'}</div>
                <div className="text-xs text-muted-foreground">
                  {i.tracking_code} · {new Date(i.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NewReportsNotifier;
