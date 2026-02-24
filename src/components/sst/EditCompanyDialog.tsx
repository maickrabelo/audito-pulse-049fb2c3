import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    cnpj?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  onCompanyUpdated: () => void;
}

const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  open,
  onOpenChange,
  company,
  onCompanyUpdated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (company && open) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
      });
      setLogoPreview(company.logo_url || null);
      setLogoFile(null);
    }
  }, [company, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O logo deve ter no máximo 2MB.", variant: "destructive" });
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da empresa.", variant: "destructive" });
      return;
    }

    if (trimmedName.length > 200) {
      toast({ title: "Nome muito longo", description: "O nome deve ter no máximo 200 caracteres.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = company.logo_url;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('company-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: trimmedName,
          cnpj: formData.cnpj.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          logo_url: logoUrl,
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      toast({
        title: "Empresa atualizada",
        description: `Os dados de ${trimmedName} foram atualizados com sucesso.`,
      });

      onOpenChange(false);
      onCompanyUpdated();
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({ title: "Erro ao atualizar empresa", description: error.message || 'Tente novamente.', variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>Atualize os dados da empresa.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da empresa *</Label>
            <Input
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Empresa ABC Ltda"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cnpj">CNPJ</Label>
            <Input
              id="edit-cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@empresa.com"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Endereço</Label>
            <Input
              id="edit-address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, cidade - UF"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {logoPreview && (
                <img src={logoPreview} alt="Preview" className="h-12 w-12 rounded object-contain border" />
              )}
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
                {logoFile ? logoFile.name : 'Alterar imagem'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
