import React from 'react';
import type { LegalDocument } from '@/legal/documents';

/** Renderiza o conteúdo integral (markdown simples) de um documento legal */
const LegalDocumentContent: React.FC<{ document: LegalDocument }> = ({ document }) => {
  const blocks = document.content.split('\n').filter((line) => line.trim().length > 0);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((raw, index) => {
        const line = raw.trim();
        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          const text = heading[2].replace(/\*\*/g, '');
          return (
            <p
              key={index}
              className={
                level <= 2
                  ? 'text-base font-semibold text-foreground pt-2'
                  : 'text-sm font-semibold text-foreground pt-1'
              }
            >
              {text}
            </p>
          );
        }
        if (/^[-*]\s+/.test(line)) {
          return (
            <p key={index} className="pl-4 text-muted-foreground">
              • {line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '')}
            </p>
          );
        }
        const clean = line.replace(/\*\*/g, '').replace(/\\$/, '');
        const isBoldLine = /^\*\*.*\*\*$/.test(line);
        return (
          <p
            key={index}
            className={isBoldLine ? 'font-semibold text-foreground' : 'text-muted-foreground'}
          >
            {clean}
          </p>
        );
      })}
    </div>
  );
};

export default LegalDocumentContent;
