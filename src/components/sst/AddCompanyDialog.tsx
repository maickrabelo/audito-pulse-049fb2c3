import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sstManagerId: string;
  onCompanyAdded: () => void;
}

const extractCnpjDigits = (cnpj: string): string => cnpj.replace(/\D/g, '');

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
};

const AddCompanyDialog: React.FC<AddCompanyDialogProps> = ({
  open,
  onOpenChange,
  sstManagerId,
  onCompanyAdded,
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

  const resetForm = () => {
    setFormData({ name: '', cnpj: '', email: '', phone: '', address: '' });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da empresa.", variant: "destructive" });
      return;
    }

    if (trimmedName.length > 200) {
      toast({ title: "Nome muito longo", description: "O nome deve ter no máximo 200 caracteres.", variant: "destructive" });
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      toast({ title: "Email obrigatório", description: "Informe o email da empresa para criar o acesso.", variant: "destructive" });
      return;
    }

    const cnpjDigits = extractCnpjDigits(formData.cnpj);
    if (cnpjDigits.length < 11) {
      toast({ title: "CNPJ inválido", description: "Informe um CNPJ válido com pelo menos 11 dígitos.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
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

      // Generate unique slug
      let baseSlug = generateSlug(trimmedName);
      let slug = baseSlug;
      let suffix = 1;

      // Check slug uniqueness
      while (true) {
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (!existing) break;
        slug = `${baseSlug}-${suffix}`;
        suffix++;
        if (suffix > 100) throw new Error('Não foi possível gerar um slug único.');
      }

      // Insert company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: trimmedName,
          cnpj: formData.cnpj.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          logo_url: logoUrl,
          slug,
          subscription_status: 'active',
        })
        .select('id')
        .single();

      if (companyError) throw companyError;

      // Create SST assignment
      const { error: assignmentError } = await supabase
        .from('company_sst_assignments')
        .insert({
          company_id: newCompany.id,
          sst_manager_id: sstManagerId,
        });

      if (assignmentError) {
        // Rollback: delete the company if assignment fails
        await supabase.from('companies').delete().eq('id', newCompany.id);
        throw assignmentError;
      }

      // Create user account for the company
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await supabase.functions.invoke('create-company-user', {
          body: {
            company_id: newCompany.id,
            email: trimmedEmail,
            cnpj: formData.cnpj.trim(),
            company_name: trimmedName,
          },
        });

        if (response.error) {
          console.error('Error creating company user:', response.error);
          toast({
            title: "Empresa cadastrada, mas sem usuário",
            description: `A empresa foi criada, porém não foi possível criar o acesso automático: ${response.error.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Empresa cadastrada com sucesso!",
            description: `${trimmedName} foi adicionada. O acesso foi criado com email: ${trimmedEmail} e senha: CNPJ (${cnpjDigits.substring(0, 4)}****). No primeiro login será solicitada a troca de senha.`,
          });
        }
      } catch (userError: any) {
        console.error('Error creating company user:', userError);
        toast({
          title: "Empresa cadastrada, mas sem usuário",
          description: "A empresa foi criada, porém houve um erro ao criar o acesso automático.",
          variant: "destructive",
        });
      }

      resetForm();
      onOpenChange(false);
      onCompanyAdded();
    } catch (error: any) {
      console.error('Error creating company:', error);
      let message = 'Não foi possível cadastrar a empresa. Tente novamente.';
      const errMsg = error.message || '';
      const errCode = error.code || '';
      if (errMsg.includes('Limite de')) {
        message = errMsg;
      } else if (errMsg.includes('companies_cnpj_key') || errMsg.includes('duplicate key') && errMsg.includes('cnpj') || errCode === '23505' && errMsg.includes('cnpj')) {
        message = 'Este CNPJ já está cadastrado no sistema. Verifique o número informado.';
      } else if (errCode === '23505' || errMsg.includes('duplicate key') || errMsg.includes('unique constraint')) {
        message = 'Este registro já existe no sistema. Verifique os dados informados.';
      }
      toast({ title: "Erro ao cadastrar empresa", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Empresa</DialogTitle>
          <DialogDescription>Preencha os dados da empresa para cadastrá-la.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Empresa ABC Ltda"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
            />
            <p className="text-xs text-muted-foreground">Será usado como senha do primeiro acesso.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@empresa.com"
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, cidade - UF"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo (opcional)</Label>
            <div className="flex items-center gap-3">
              {logoPreview && (
                <img src={logoPreview} alt="Preview" className="h-12 w-12 rounded object-contain border" />
              )}
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
                {logoFile ? logoFile.name : 'Selecionar imagem'}
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
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Empresa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
