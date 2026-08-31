import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, KeyRound, Trash2, Copy } from 'lucide-react';

interface InternalUser {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  email: string;
  created_at: string;
  tratamentos: number;
}

const maskCpf = (cpf: string) =>
  cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

const InternalUsersCard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', cpf: '', email: '' });
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data: session } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('manage-internal-users', {
      headers: { Authorization: `Bearer ${session.session?.access_token}` },
      body,
    });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await call({ action: 'list' });
      setUsers((data.users as InternalUser[]) ?? []);
    } catch (e) {
      toast({ title: 'Erro ao carregar usuários internos', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    try {
      const data = await call({ action: 'create', ...form });
      setCredentials({ email: data.email as string, password: data.password as string });
      setForm({ full_name: '', cpf: '', email: '' });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Erro ao criar usuário', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (u: InternalUser) => {
    try {
      const data = await call({ action: 'reset_password', user_id: u.user_id });
      setCredentials({ email: u.email, password: data.password as string });
    } catch (e) {
      toast({ title: 'Erro ao redefinir senha', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const remove = async (u: InternalUser) => {
    if (!confirm(`Remover o usuário interno ${u.full_name}?`)) return;
    try {
      await call({ action: 'delete', user_id: u.user_id });
      toast({ title: 'Usuário removido' });
      load();
    } catch (e) {
      toast({ title: 'Erro ao remover', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Usuários internos (tratamento de manifestações)</CardTitle>
            <CardDescription>
              Acessam apenas as abas <b>Manifestações por Categoria</b> e <b>Triagem AMO</b>. O registro de quem
              tratou cada manifestação é interno e visível somente aqui.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Novo usuário interno</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo usuário interno</DialogTitle>
                <DialogDescription>Informe nome, CPF e e-mail. A senha inicial será gerada automaticamente.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome completo</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input value={form.cpf} maxLength={14}
                    onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {credentials && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm">
            <p className="font-medium text-green-900">Credenciais geradas (copie agora, não serão exibidas novamente)</p>
            <p className="mt-1">E-mail: <b>{credentials.email}</b></p>
            <p>Senha: <b>{credentials.password}</b></p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(`${credentials.email} / ${credentials.password}`);
                toast({ title: 'Credenciais copiadas' });
              }}><Copy className="h-3 w-3 mr-1" /> Copiar</Button>
              <Button size="sm" variant="ghost" onClick={() => setCredentials(null)}>Fechar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Nenhum usuário interno cadastrado.</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 border rounded p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.email} · CPF {maskCpf(u.cpf)} · desde {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{u.tratamentos} tratamento(s)</Badge>
                  <Button size="sm" variant="outline" onClick={() => resetPassword(u)}>
                    <KeyRound className="h-3 w-3 mr-1" /> Nova senha
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(u)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InternalUsersCard;
