import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, ArrowLeft, ArrowRight, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PartnerFormData, Representative } from "@/pages/PartnerRegistration";

const representativeSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  rg: z.string().min(5, "RG inválido"),
  isPrimary: z.boolean().default(false),
});

interface RepresentativesStepProps {
  partnerData: PartnerFormData;
  initialRepresentatives: Representative[];
  onSubmit: (representatives: Representative[], partnerId: string) => void;
  onBack: () => void;
}

const RepresentativesStep = ({
  partnerData,
  initialRepresentatives,
  onSubmit,
  onBack,
}: RepresentativesStepProps) => {
  const [representatives, setRepresentatives] = useState<Representative[]>(
    initialRepresentatives.length > 0
      ? initialRepresentatives
      : [{ id: crypto.randomUUID(), nome: "", cpf: "", rg: "", isPrimary: true }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof representativeSchema>>({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      rg: "",
      isPrimary: false,
    },
  });

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .substring(0, 14);
  };

  const updateRepresentative = (id: string, field: keyof Representative, value: string | boolean) => {
    setRepresentatives((prev) =>
      prev.map((rep) => {
        if (rep.id === id) {
          if (field === "isPrimary" && value === true) {
            return { ...rep, isPrimary: true };
          }
          return { ...rep, [field]: value };
        }
        if (field === "isPrimary" && value === true) {
          return { ...rep, isPrimary: false };
        }
        return rep;
      })
    );
  };

  const addRepresentative = () => {
    setRepresentatives((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", cpf: "", rg: "", isPrimary: false },
    ]);
  };

  const removeRepresentative = (id: string) => {
    if (representatives.length === 1) {
      toast.error("É necessário pelo menos um representante");
      return;
    }
    const rep = representatives.find((r) => r.id === id);
    setRepresentatives((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      if (rep?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const validateRepresentatives = () => {
    for (const rep of representatives) {
      if (!rep.nome || rep.nome.length < 3) {
        toast.error(`Nome do representante inválido`);
        return false;
      }
      if (!rep.cpf || rep.cpf.replace(/\D/g, "").length !== 11) {
        toast.error(`CPF do representante ${rep.nome} inválido`);
        return false;
      }
      if (!rep.rg || rep.rg.length < 5) {
        toast.error(`RG do representante ${rep.nome} inválido`);
        return false;
      }
    }
    if (!representatives.some((rep) => rep.isPrimary)) {
      toast.error("Selecione um representante principal");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateRepresentatives()) return;

    setIsSubmitting(true);
    try {
      const partnerId = crypto.randomUUID();

      const { error: partnerError } = await supabase
        .from("licensed_partners")
        .insert({
          id: partnerId,
          razao_social: partnerData.razaoSocial,
          nome_fantasia: partnerData.nomeFantasia,
          cnpj: partnerData.cnpj.replace(/\D/g, ""),
          endereco_completo: partnerData.enderecoCompleto,
          email: partnerData.email,
          phone: partnerData.phone.replace(/\D/g, ""),
          status: "pending_contract",
        });

      if (partnerError) throw partnerError;

      // Create representatives
      const representativesData = representatives.map((rep) => ({
        partner_id: partnerId,
        nome: rep.nome,
        cpf: rep.cpf.replace(/\D/g, ""),
        rg: rep.rg,
        is_primary: rep.isPrimary,
      }));

      const { error: repsError } = await supabase
        .from("partner_representatives")
        .insert(representativesData);

      if (repsError) throw repsError;

      toast.success("Dados salvos com sucesso!");
      onSubmit(representatives, partnerId);
    } catch (error: any) {
      console.error("Error saving partner:", error);
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Sócios e Representantes Legais</h3>
        <p className="text-sm text-muted-foreground">
          Adicione todos os sócios e representantes legais da empresa
        </p>
      </div>

      <div className="space-y-4">
        {representatives.map((rep, index) => (
          <Card key={rep.id} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Representante {index + 1}
                </span>
                {representatives.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRepresentative(rep.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input
                    placeholder="Nome completo"
                    value={rep.nome}
                    onChange={(e) => updateRepresentative(rep.id, "nome", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF</label>
                  <Input
                    placeholder="000.000.000-00"
                    value={rep.cpf}
                    onChange={(e) => updateRepresentative(rep.id, "cpf", formatCPF(e.target.value))}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RG</label>
                  <Input
                    placeholder="RG"
                    value={rep.rg}
                    onChange={(e) => updateRepresentative(rep.id, "rg", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`primary-${rep.id}`}
                  checked={rep.isPrimary}
                  onCheckedChange={(checked) =>
                    updateRepresentative(rep.id, "isPrimary", checked as boolean)
                  }
                />
                <label
                  htmlFor={`primary-${rep.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Representante Principal (assinará o contrato)
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addRepresentative} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Representante
      </Button>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RepresentativesStep;
