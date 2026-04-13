import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sstManagerId: string;
  onCompanyAdded: () => void;
}

const AddCompanyDialog = ({ open, onOpenChange, sstManagerId, onCompanyAdded }: AddCompanyDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const cnpj = formData.get('cnpj') as string;
    const slug = cnpj.replace(/\D/g, '');

    if (!slug) {
      toast({ title: "CNPJ obrigatório", description: "Informe o CNPJ da empresa.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create company
      const { data: company, error: compError } = await supabase
        .from('companies')
        .insert({
          name: formData.get('name') as string,
          cnpj,
          email: formData.get('email') as string || null,
          phone: formData.get('phone') as string || null,
          address: formData.get('address') as string || null,
          slug,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (compError) throw compError;

      // Assign to SST manager
      const { error: assignError } = await supabase
        .from('company_sst_assignments')
        .insert({
          company_id: company.id,
          sst_manager_id: sstManagerId,
        });

      if (assignError) throw assignError;

      // Create login user for the company if email was provided
      const companyEmail = formData.get('email') as string;
      if (companyEmail) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const { error: userError } = await supabase.functions.invoke('create-company-user', {
            body: {
              company_id: company.id,
              email: companyEmail,
              cnpj,
              company_name: formData.get('name') as string,
            },
          });

          if (userError) {
            console.error('Error creating company user:', userError);
            toast({
              title: "Empresa cadastrada, mas login não criado",
              description: `A empresa foi cadastrada, mas houve erro ao criar o login: ${userError.message}. Crie o login manualmente.`,
              variant: "destructive",
            });
          } else {
            const cnpjDigits = cnpj.replace(/\D/g, '');
            toast({
              title: "Empresa cadastrada com sucesso!",
              description: `Login criado: ${companyEmail} | Senha inicial: ${cnpjDigits} (CNPJ)`,
            });
          }
        } catch (userErr: any) {
          console.error('Error creating company user:', userErr);
          toast({
            title: "Empresa cadastrada, login pendente",
            description: "A empresa foi criada, mas o login precisa ser criado manualmente.",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "Empresa cadastrada", description: "A empresa foi cadastrada sem login (email não informado)." });
      }

      onOpenChange(false);
      onCompanyAdded();
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar empresa", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
          <DialogDescription>Preencha os dados da empresa para cadastrá-la.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input id="name" name="name" required placeholder="Nome da empresa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input id="cnpj" name="cnpj" required placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="contato@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Endereço completo" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
