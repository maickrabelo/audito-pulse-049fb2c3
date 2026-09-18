import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteInfo {
  email: string;
  full_name: string | null;
  role_label: string;
  company_name: string | null;
}

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const { data, error: fnError } = await supabase.functions.invoke("accept-invite", { body });
    if (fnError) {
      let message = fnError.message;
      try {
        const ctx = (fnError as unknown as { context?: Response }).context;
        if (ctx) message = (await ctx.json())?.error ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("Link de convite inválido.");
        setLoading(false);
        return;
      }
      try {
        const data = await call({ action: "verify", token });
        setInfo(data as unknown as InviteInfo);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Convite inválido.");
      } finally {
        setLoading(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast({ title: "A senha deve ter pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não conferem.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await call({ action: "accept", token, password });
      const email = info?.email ?? "";
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast({ title: "Senha criada! Faça login para continuar." });
        navigate("/auth");
        return;
      }
      toast({ title: "Cadastro concluído", description: "Bem-vindo(a) à Ouvidoria AMO." });
    } catch (e) {
      toast({
        title: "Não foi possível concluir",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Criar senha de acesso
          </CardTitle>
          <CardDescription>
            {info
              ? `${info.company_name ?? "Ouvidoria AMO"} — perfil ${info.role_label}`
              : "Ouvidoria AMO"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Ir para o login
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label>E-mail</Label>
                <Input value={info?.email ?? ""} disabled />
              </div>
              <div>
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>
              <div>
                <Label>Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Concluir cadastro
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
