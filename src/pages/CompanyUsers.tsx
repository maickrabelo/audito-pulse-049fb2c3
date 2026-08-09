import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
import { Loader2, Plus, KeyRound, Trash2, Copy, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  COMPANY_MEMBER_ROLES,
  COMPANY_ROLE_DESCRIPTIONS,
  COMPANY_ROLE_LABELS,
  type CompanyMemberRole,
} from "@/lib/companyRoles";

interface CompanyUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

const CompanyUsers = () => {
  const { role, isLoading: authLoading } = useRealAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogRole, setDialogRole] = useState<CompanyMemberRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-company-users", { body });
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setUsers((data.users as CompanyUser[]) ?? []);
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
    if (role === "company") loadUsers();
    else if (!authLoading) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, authLoading]);

  const handleCreate = async () => {
    if (!dialogRole) return;
    setSaving(true);
    try {
      const data = await call({
        action: "create",
        role: dialogRole,
        full_name: fullName,
        email,
      });
      setCredentials({ email: data.email as string, password: data.password as string });
      setDialogRole(null);
      setFullName("");
      setEmail("");
      await loadUsers();
    } catch (e) {
      toast({
        title: "Não foi possível criar o usuário",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (user: CompanyUser) => {
    try {
      const data = await call({ action: "reset_password", user_id: user.id });
      setCredentials({ email: user.email ?? "", password: data.password as string });
    } catch (e) {
      toast({
        title: "Erro ao redefinir senha",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (user: CompanyUser) => {
    if (!window.confirm(`Remover o acesso de ${user.email}?`)) return;
    try {
      await call({ action: "delete", user_id: user.id });
      toast({ title: "Usuário removido" });
      await loadUsers();
    } catch (e) {
      toast({
        title: "Erro ao remover usuário",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const takenRoles = new Set(users.map((u) => u.role));

  const content = () => {
    if (authLoading || loading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (role !== "company") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Apenas o usuário principal da empresa pode gerenciar os usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Usuários da empresa
            </CardTitle>
            <CardDescription>
              Cada empresa pode ter um usuário de cada tipo, além do usuário principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {COMPANY_MEMBER_ROLES.map((r) => (
                <div key={r} className="rounded-lg border p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{COMPANY_ROLE_LABELS[r]}</span>
                    {takenRoles.has(r) ? (
                      <Badge variant="secondary">Criado</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setDialogRole(r)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Criar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {COMPANY_ROLE_DESCRIPTIONS[r]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acessos ativos</CardTitle>
            <CardDescription>Usuários vinculados a esta empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      {COMPANY_ROLE_LABELS[(u.role ?? "") as CompanyMemberRole] ?? u.role ?? "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {u.role !== "company" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleReset(u)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(u)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <h1 className="text-2xl font-semibold mb-6">Gestão de usuários da empresa</h1>
          {content()}
        </div>
      </main>
      <Footer />

      <Dialog open={!!dialogRole} onOpenChange={(open) => !open && setDialogRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Criar {dialogRole ? COMPANY_ROLE_LABELS[dialogRole] : ""}
            </DialogTitle>
            <DialogDescription>
              {dialogRole ? COMPANY_ROLE_DESCRIPTIONS[dialogRole] : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de acesso</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRole(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving || !fullName || !email}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciais de acesso</DialogTitle>
            <DialogDescription>
              Copie e envie ao usuário. A senha será exibida apenas agora e deverá ser
              alterada no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">E-mail</p>
              <p className="font-medium">{credentials?.email}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Senha provisória</p>
              <p className="font-mono font-medium">{credentials?.password}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  `E-mail: ${credentials?.email}\nSenha: ${credentials?.password}`,
                );
                toast({ title: "Credenciais copiadas" });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={() => setCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyUsers;
