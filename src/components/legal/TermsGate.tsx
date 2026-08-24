import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useLegalAcceptance } from '@/hooks/useLegalAcceptance';
import LegalDocumentContent from './LegalDocumentContent';

const reasonLabel: Record<string, string> = {
  first_access: 'Primeiro acesso ao Canal de Escuta',
  new_version: 'Nova versão do Termo publicada',
  role_change: 'Alteração de perfil ou permissões',
};

/**
 * Bloqueia o uso do Canal de Escuta até o aceite do termo de primeiro acesso
 * correspondente ao perfil do usuário (Documento 02 / Documento 03).
 */
const TermsGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading, signOut } = useRealAuth();
  const { isChecking, document, needsAcceptance, reason, markAccepted } = useLegalAcceptance(
    user?.id,
    role,
  );
  const [checked, setChecked] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setChecked(document ? document.declarations.map(() => false) : []);
  }, [document?.code, document?.version, needsAcceptance]);

  const allChecked = useMemo(
    () => checked.length > 0 && checked.every(Boolean),
    [checked],
  );

  const blocking = !!user && !isLoading && !isChecking && needsAcceptance && !!document;

  const send = async (result: 'accepted' | 'refused') => {
    if (!document) return;
    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('record-legal-acceptance', {
      body: {
        document_code: document.code,
        result,
        reason: reason ?? null,
        declarations: document.declarations.map((text, i) => ({ text, checked: !!checked[i] })),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        session_id: sessionData.session?.access_token?.slice(-24) ?? null,
      },
    });
    setSubmitting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Não foi possível registrar', description: error.message });
      return;
    }

    if (result === 'accepted') {
      markAccepted();
      toast({ title: 'Termo aceito', description: 'Registro de aceite armazenado com sucesso.' });
    } else {
      toast({ title: 'Termo recusado', description: 'O acesso permanece bloqueado.' });
      await signOut();
    }
  };

  return (
    <>
      {children}
      <Dialog open={blocking}>
        <DialogContent
          className="max-w-3xl max-h-[92vh] flex flex-col [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {document && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                  <span>{document.title}</span>
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <span className="block">{document.subtitle}</span>
                  <span className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">Versão {document.version}</Badge>
                    <Badge variant="outline">
                      Vigência {new Date(`${document.effective_date}T12:00:00`).toLocaleDateString('pt-BR')}
                    </Badge>
                    {reason && <Badge variant="secondary">{reasonLabel[reason]}</Badge>}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 min-h-0 max-h-[55vh] border rounded-md p-4 overflow-y-auto">
                <LegalDocumentContent document={document} />
              </ScrollArea>

              <div className="space-y-3 pt-2">
                {document.declarations.map((text, i) => (
                  <label key={i} className="flex gap-3 items-start text-sm cursor-pointer">
                    <Checkbox
                      checked={!!checked[i]}
                      onCheckedChange={(v) =>
                        setChecked((prev) => prev.map((c, idx) => (idx === i ? v === true : c)))
                      }
                    />
                    <span className="text-muted-foreground">{text}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => send('refused')} disabled={submitting}>
                  NÃO ACEITAR E SAIR
                </Button>
                <Button onClick={() => send('accepted')} disabled={!allChecked || submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ACEITAR E CONTINUAR
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TermsGate;
