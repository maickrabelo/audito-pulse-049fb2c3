import React from 'react';
import type { LegalDocument } from '@/legal/documents';

type Block =
  | { kind: 'text'; line: string }
  | { kind: 'table'; rows: string[][]; hasHeader: boolean };

const isSeparator = (line: string) => /^\+[-=+:\s]+\+$/.test(line.trim());
const isHeaderSeparator = (line: string) => isSeparator(line) && line.includes('=');
const isRow = (line: string) => /^\|.*\|$/.test(line.trim());

const splitRow = (line: string) =>
  line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());

/** Converte tabelas em grade (pandoc) e linhas de texto em blocos renderizáveis */
const parseBlocks = (content: string): Block[] => {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isSeparator(line)) {
      const rows: string[][] = [];
      let current: string[] | null = null;
      let hasHeader = false;
      let headerEndIndex = -1;
      i++;

      while (i < lines.length && (isSeparator(lines[i]) || isRow(lines[i]))) {
        if (isSeparator(lines[i])) {
          if (current) {
            rows.push(current);
            current = null;
          }
          if (isHeaderSeparator(lines[i])) {
            hasHeader = true;
            headerEndIndex = rows.length;
          }
        } else {
          const cells = splitRow(lines[i]);
          if (!current) {
            current = cells;
          } else {
            current = current.map((c, idx) =>
              cells[idx] ? (c ? `${c} ${cells[idx]}` : cells[idx]) : c,
            );
          }
        }
        i++;
      }
      if (current) rows.push(current);

      const cleaned = rows.filter((r) => r.some((c) => c.length > 0));
      if (cleaned.length) {
        blocks.push({
          kind: 'table',
          rows: cleaned,
          hasHeader: hasHeader && headerEndIndex === 1,
        });
      }
      continue;
    }

    if (line.trim().length > 0) blocks.push({ kind: 'text', line: line.trim() });
    i++;
  }

  return blocks;
};

const clean = (text: string) => text.replace(/\*\*/g, '').replace(/\\\|/g, '|').replace(/\\$/, '');

const renderText = (line: string, key: number) => {
  const heading = line.match(/^(#{1,6})\s+(.*)$/);
  if (heading) {
    const level = heading[1].length;
    return (
      <p
        key={key}
        className={
          level <= 2
            ? 'text-base font-semibold text-foreground pt-2'
            : 'text-sm font-semibold text-foreground pt-1'
        }
      >
        {clean(heading[2])}
      </p>
    );
  }
  if (/^[-*]\s+/.test(line)) {
    return (
      <p key={key} className="pl-4 text-muted-foreground">
        • {clean(line.replace(/^[-*]\s+/, ''))}
      </p>
    );
  }
  const isBoldLine = /^\*\*.*\*\*$/.test(line);
  return (
    <p key={key} className={isBoldLine ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
      {clean(line)}
    </p>
  );
};

/** Renderiza o conteúdo integral (markdown simples + tabelas) de um documento legal */
const LegalDocumentContent: React.FC<{ document: LegalDocument }> = ({ document }) => {
  const blocks = parseBlocks(document.content);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        if (block.kind === 'text') return renderText(block.line, index);

        const { rows, hasHeader } = block;

        // Caixa de destaque (tabela de coluna única)
        if (rows.every((r) => r.length === 1)) {
          return (
            <div
              key={index}
              className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-2"
            >
              {rows.map((r, ri) => (
                <p
                  key={ri}
                  className={
                    ri === 0
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  {clean(r[0])}
                </p>
              ))}
            </div>
          );
        }

        const header = hasHeader ? rows[0] : null;
        const body = hasHeader ? rows.slice(1) : rows;

        return (
          <div key={index} className="overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-xs">
              {header && (
                <thead>
                  <tr className="bg-muted">
                    {header.map((cell, ci) => (
                      <th
                        key={ci}
                        className="border-b border-r last:border-r-0 px-3 py-2 text-left font-semibold text-foreground align-top"
                      >
                        {clean(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="even:bg-muted/30">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border-b border-r last:border-r-0 px-3 py-2 align-top text-muted-foreground"
                      >
                        {clean(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default LegalDocumentContent;
