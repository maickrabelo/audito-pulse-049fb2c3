import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Mail, Trash2, LogOut, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  COMPANY_MEMBER_ROLES,
  COMPANY_ROLE_DESCRIPTIONS,
  COMPANY_ROLE_LABELS,
  type CompanyMemberRole,
} from "@/lib/companyRoles";

interface ManagedUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  role_label: string;
  status: "pending" | "active" | "revoked";
  created_at: string;
}

const statusBadge = (status: ManagedUser["status"]) => {
  if (status === "active") return <Badge className="bg-emerald-600">Ativo</Badge>;
  if (status === "revoked") return <Badge variant="destructive">Revogado</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
};

const CompanyUserManager = () => {
  const { role, isLoading: authLoading, signOut } = useRealAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogRole, setDialogRole] = useState<CompanyMemberRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const allowed = role === "gestor_usuarios" || role === "company" || role === "admin";

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-company-invites", { body });
    if (error) {
      let message = error.message;
      try {
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx) message = (await ctx.json())?.error ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setUsers((data.users as ManagedUser[]) ?? []);
      setCompanyName(((data.company as { name?: string })?.name) ?? "");
    } catch (e) {
      toast({
        title: "Erro ao carregar usuários",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) load();
    else if (!authLoading) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, authLoading]);

  const handleInvite = async () => {
    if (!dialogRole) return;
    setSaving(true);
    try {
      const data = await call({
        action: "invite",
        role: dialogRole,
        full_name: fullName,
        email,
      });
      toast({
        title: "Convite enviado",
        description: data.email_sent
          ? `${email} receberá um e-mail para criar a senha.`
          : "Usuário criado, mas o e-mail não pôde ser enviado. Use 'Reenviar convite'.",
      });
      setDialogRole(null);
      setFullName("");
      setEmail("");
      await load();
    } catch (e) {
      toast({
        title: "Não foi possível convidar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (user: ManagedUser) => {
    try {
      await call({ action: "resend", user_id: user.id });
      toast({ title: "Convite reenviado", description: user.email ?? "" });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao reenviar convite",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (user: ManagedUser) => {
    if (!window.confirm(`Remover o acesso de ${user.email}?`)) return;
    try {
      await call({ action: "revoke", user_id: user.id });
      toast({ title: "Acesso removido" });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao remover acesso",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const takenRoles = new Set(users.filter((u) => u.status !== "revoked").map((u) => u.role));

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva do gestor de usuários da empresa.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold truncate">Gestão de usuários</p>
              <p className="text-xs text-muted-foreground truncate">{companyName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Convidar usuários</CardTitle>
            <CardDescription>
              Cada empresa pode ter um usuário de cada tipo. O convidado recebe um e-mail
              para criar a própria senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {COMPANY_MEMBER_ROLES.map((r) => (
              <div key={r} className="rounded-lg border p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{COMPANY_ROLE_LABELS[r]}</span>
                  {takenRoles.has(r) ? (
                    <Badge variant="secondary">Criado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setDialogRole(r)}>
                      <Plus className="h-4 w-4 mr-1" /> Convidar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {COMPANY_ROLE_DESCRIPTIONS[r]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários cadastrados</CardTitle>
            <CardDescription>
              Pendente = convite enviado e senha ainda não criada. Ativo = cadastro concluído.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum usuário cadastrado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                      <TableCell>{u.role_label}</TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {u.role !== "gestor_usuarios" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleResend(u)}>
                              <Mail className="h-3 w-3 mr-1" /> Reenviar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRevoke(u)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!dialogRole} onOpenChange={(open) => !open && setDialogRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Convidar {dialogRole ? COMPANY_ROLE_LABELS[dialogRole] : ""}
            </DialogTitle>
            <DialogDescription>
              O usuário receberá um e-mail com link para criar a senha de acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInvite} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyUserManager;
