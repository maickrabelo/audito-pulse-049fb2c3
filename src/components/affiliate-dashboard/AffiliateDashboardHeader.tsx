import { Copy, Check, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AffiliateDashboardHeaderProps {
  affiliate: {
    nome_completo: string;
    referral_code: string;
  };
}

export const AffiliateDashboardHeader = ({ affiliate }: AffiliateDashboardHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/checkout?ref=${affiliate.referral_code}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{affiliate.nome_completo}</h1>
          <p className="text-sm text-muted-foreground">
            Código de indicação: <span className="font-mono font-medium text-primary">{affiliate.referral_code}</span>
          </p>
        </div>
      </div>

      <Button variant="outline" onClick={copyToClipboard} className="gap-2">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        Copiar Link de Indicação
      </Button>
    </div>
  );
};
