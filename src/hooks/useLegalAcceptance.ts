import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DOC_AMO,
  DOC_COMPANY,
  getLegalDocument,
  type LegalDocument,
} from '@/legal/documents';

const AMO_ROLES = ['admin', 'triador_sst', 'medico_trabalho'];
const CHANNEL_ROLES = [
  'company',
  'apurador',
  'comite',
  'dpo',
  'visualizador',
  'sst',
  ...AMO_ROLES,
];

/** Documento de primeiro acesso exigido para o papel informado */
export const requiredDocumentCode = (role?: string | null): string | null => {
  if (!role || !CHANNEL_ROLES.includes(role)) return null;
  return AMO_ROLES.includes(role) ? DOC_AMO : DOC_COMPANY;
};

interface AcceptanceState {
  isChecking: boolean;
  document: LegalDocument | null;
  needsAcceptance: boolean;
  reason: 'first_access' | 'new_version' | 'role_change' | null;
  refresh: () => Promise<void>;
  markAccepted: () => void;
}

export const useLegalAcceptance = (
  userId?: string | null,
  role?: string | null,
): AcceptanceState => {
  const [isChecking, setIsChecking] = useState(true);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [reason, setReason] = useState<AcceptanceState['reason']>(null);

  const code = requiredDocumentCode(role);
  const document = code ? getLegalDocument(code) ?? null : null;

  const check = useCallback(async () => {
    if (!userId || !document) {
      setNeedsAcceptance(false);
      setReason(null);
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    const { data } = await supabase
      .from('legal_acceptances')
      .select('document_version, document_hash, role, result')
      .eq('user_id', userId)
      .eq('document_code', document.code)
      .eq('result', 'accepted')
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      setNeedsAcceptance(true);
      setReason('first_access');
    } else if (
      data.document_version !== document.version ||
      data.document_hash !== document.content_hash
    ) {
      setNeedsAcceptance(true);
      setReason('new_version');
    } else if (role && data.role && data.role !== role) {
      setNeedsAcceptance(true);
      setReason('role_change');
    } else {
      setNeedsAcceptance(false);
      setReason(null);
    }
    setIsChecking(false);
  }, [userId, document?.code, document?.version, document?.content_hash, role]);

  useEffect(() => {
    check();
  }, [check]);

  return {
    isChecking,
    document,
    needsAcceptance,
    reason,
    refresh: check,
    markAccepted: () => {
      setNeedsAcceptance(false);
      setReason(null);
    },
  };
};
