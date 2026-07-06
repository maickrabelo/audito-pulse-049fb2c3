import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  address?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onCompleted: () => void;
}

const CompletePendingCompanyDialog = ({ open, onOpenChange, company, onCompleted }: Props) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !company.cnpj) return;
    if (!email) {
      toast({ title: "E-mail obrigatório", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const cnpjDigits = company.cnpj.replace(/\D/g, '');

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ email, subscription_status: 'active' })
        .eq('id', company.id);
      if (updateError) throw updateError;

      const { error: userError } = await supabase.functions.invoke('create-company-user', {
        body: {
          company_id: company.id,
          email,
          cnpj: company.cnpj,
          company_name: company.name,
        },
      });

      if (userError) {
        toast({
          title: "Empresa ativada, login não criado",
          description: `Erro ao criar login: ${userError.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Acesso gerado com sucesso!",
          description: `Login: ${email} | Senha inicial: ${cnpjDigits} (CNPJ - trocar no primeiro acesso)`,
        });
      }

      setEmail('');
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      toast({ title: "Erro ao completar cadastro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Completar Cadastro</DialogTitle>
          <DialogDescription>
            Informe o e-mail do responsável para gerar o acesso da empresa.
          </DialogDescription>
        </DialogHeader>
        {company && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
              <p><span className="font-medium">Empresa:</span> {company.name}</p>
              <p><span className="font-medium">CNPJ:</span> {company.cnpj}</p>
              {company.address && <p className="text-muted-foreground text-xs">{company.address}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do responsável *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="responsavel@empresa.com"
              />
              <p className="text-xs text-muted-foreground">
                A senha inicial será o CNPJ (apenas dígitos). O usuário será obrigado a trocá-la no primeiro acesso.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Gerar acesso
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompletePendingCompanyDialog;
