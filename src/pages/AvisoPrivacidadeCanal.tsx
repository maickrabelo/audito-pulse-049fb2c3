import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import LegalDocumentContent from '@/components/legal/LegalDocumentContent';
import { Badge } from '@/components/ui/badge';
import { getLegalDocument, DOC_PRIVACY_NOTICE } from '@/legal/documents';

const AvisoPrivacidadeCanal = () => {
  const document = getLegalDocument(DOC_PRIVACY_NOTICE);

  if (!document) return null;

  return (
    <LegalLayout
      title="Aviso de Privacidade — Canal de Escuta"
      updatedAt={new Date(`${document.effective_date}T12:00:00`).toLocaleDateString('pt-BR')}
    >
      <div className="flex flex-wrap gap-2 mb-6 not-prose">
        <Badge variant="outline">Versão {document.version}</Badge>
        <Badge variant="outline">
          Vigência {new Date(`${document.effective_date}T12:00:00`).toLocaleDateString('pt-BR')}
        </Badge>
      </div>
      <LegalDocumentContent document={document} />
    </LegalLayout>
  );
};

export default AvisoPrivacidadeCanal;
