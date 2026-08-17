import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  reportId: string | null;
  trackingCode?: string | null;
  userId?: string | null;
  role?: string | null;
  onCancel: () => void;
  /** Chamado quando o usuário declara ausência de conflito */
  onCleared: () => void;
  /** Chamado quando o usuário declara impedimento (caso bloqueado) */
  onConflict: () => void;
}

const ConflictOfInterestDialog: React.FC<Props> = ({
  open,
  reportId,
  trackingCode,
  userId,
  role,
  onCancel,
  onCleared,
  onConflict,
}) => {
  const [declaring, setDeclaring] = useState(false);
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState('');
  const { toast } = useToast();

  const record = async (hasConflict: boolean) => {
    if (!reportId || !userId) return;
    setDeclaring(true);
    const { error } = await supabase.from('case_conflict_declarations').insert({
      report_id: reportId,
      user_id: userId,
      user_role: role ?? null,
      has_conflict: hasConflict,
      justification: hasConflict ? justification.trim() || null : null,
      user_agent: navigator.userAgent,
    });

    await supabase.from('eventos_auditoria').insert({
      report_id: reportId,
      entidade: 'case_conflict_declarations',
      entidade_id: reportId,
      acao: hasConflict ? 'conflito_declarado' : 'conflito_ausente',
      ator_id: userId,
      ator_papel: role ?? null,
      justificativa: hasConflict
        ? justification.trim() ||
          'Usuário declarou impedimento; caso bloqueado e sinalizado para redirecionamento.'
        : 'Usuário declarou ausência de conflito de interesse antes de acessar o caso.',
    });

    setDeclaring(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Não foi possível registrar', description: error.message });
      return;
    }

    setJustification('');
    setShowJustification(false);
    if (hasConflict) {
      toast({
        title: 'Impedimento registrado',
        description: 'O caso foi bloqueado para você e sinalizado para redirecionamento.',
      });
      onConflict();
    } else {
      onCleared();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Declaração de conflito de interesse
          </DialogTitle>
          <DialogDescription>
            Antes de acessar a manifestação {trackingCode ? <b>{trackingCode}</b> : null}, confirme
            que você não possui conflito de interesse ou impedimento para atuar neste caso.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription className="text-sm">
            Há conflito quando você é parte envolvida, tem relação pessoal, hierárquica ou de
            interesse com os envolvidos, ou qualquer situação que comprometa a imparcialidade.
            A declaração é registrada em trilha de auditoria.
          </AlertDescription>
        </Alert>

        {showJustification && (
          <Textarea
            placeholder="Descreva brevemente o motivo do impedimento (opcional)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            maxLength={500}
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {showJustification ? (
            <>
              <Button variant="ghost" onClick={() => setShowJustification(false)} disabled={declaring}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={() => record(true)} disabled={declaring}>
                {declaring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar impedimento
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowJustification(true)} disabled={declaring}>
                Declaro impedimento
              </Button>
              <Button onClick={() => record(false)} disabled={declaring}>
                {declaring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Declaro ausência de conflito
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictOfInterestDialog;
