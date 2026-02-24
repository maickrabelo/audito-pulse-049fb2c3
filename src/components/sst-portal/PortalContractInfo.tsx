import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileCheck, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { Loader2 } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractData {
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  contract_signed_at: string | null;
  contract_expires_at: string | null;
}

const PortalContractInfo = () => {
  const { user } = useRealAuth();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchContractInfo();
  }, [user]);

  const fetchContractInfo = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("sst_manager_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.sst_manager_id) return;

      const { data, error } = await supabase
        .from("sst_managers")
        .select("name, cnpj, email, phone, contract_signed_at, contract_expires_at")
        .eq("id", profile.sst_manager_id)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error("Error fetching contract info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Informações de contrato não disponíveis.
      </div>
    );
  }

  const isExpired = contract.contract_expires_at
    ? isPast(new Date(contract.contract_expires_at))
    : false;

  const daysUntilExpiry = contract.contract_expires_at
    ? differenceInDays(new Date(contract.contract_expires_at), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && !isExpired;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isExpired && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Contrato expirado</p>
            <p className="text-sm text-destructive/80">
              Entre em contato para renovação.
            </p>
          </div>
        </div>
      )}

      {isExpiringSoon && (
        <div className="bg-accent/50 border border-accent rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-accent-foreground flex-shrink-0" />
          <div>
            <p className="font-medium text-accent-foreground">Contrato expira em breve</p>
            <p className="text-sm text-muted-foreground">
              Faltam {daysUntilExpiry} dias para a expiração do contrato.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Razão Social</p>
              <p className="font-medium">{contract.name}</p>
            </div>
            {contract.cnpj && (
              <div>
                <p className="text-xs text-muted-foreground">CNPJ</p>
                <p className="font-medium">{contract.cnpj}</p>
              </div>
            )}
            {contract.email && (
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-medium">{contract.email}</p>
              </div>
            )}
            {contract.phone && (
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium">{contract.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Data de Assinatura</p>
              <p className="font-medium">
                {contract.contract_signed_at
                  ? format(new Date(contract.contract_signed_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "Não informada"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de Expiração</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {contract.contract_expires_at
                    ? format(new Date(contract.contract_expires_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "Não informada"}
                </p>
                {isExpired && (
                  <Badge variant="destructive" className="text-xs">
                    Expirado
                  </Badge>
                )}
                {isExpiringSoon && (
                  <Badge variant="secondary" className="text-xs">
                    Expira em {daysUntilExpiry} dias
                  </Badge>
                )}
                {!isExpired && !isExpiringSoon && contract.contract_expires_at && (
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                )}
              </div>
            </div>
            {daysUntilExpiry !== null && !isExpired && (
              <div>
                <p className="text-xs text-muted-foreground">Dias Restantes</p>
                <p className="font-medium text-2xl text-primary">{daysUntilExpiry}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalContractInfo;
