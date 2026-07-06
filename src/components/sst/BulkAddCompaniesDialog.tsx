import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sstManagerId: string;
  onCompaniesAdded: () => void;
}

interface ParsedRow {
  address: string;
  city: string;
  uf: string;
  cep: string;
  cnpj: string;
  cnpjDigits: string;
  name: string;
  error?: string;
}

const HEADER_KEYWORDS = ['endereço', 'endereco', 'cnpj', 'razão social', 'razao social'];

function parseInput(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];
  for (const line of lines) {
    // Split by tabs; fallback to 2+ spaces
    let parts = line.split('\t').map(p => p.trim());
    if (parts.length < 6) {
      parts = line.split(/\s{2,}|;/).map(p => p.trim());
    }
    // Skip header
    const lower = line.toLowerCase();
    if (HEADER_KEYWORDS.filter(k => lower.includes(k)).length >= 2) continue;
    if (parts.length < 6) {
      rows.push({ address: '', city: '', uf: '', cep: '', cnpj: '', cnpjDigits: '', name: line, error: 'Formato inválido (esperado 6 colunas)' });
      continue;
    }
    const [address, city, uf, cep, cnpj, ...rest] = parts;
    const name = rest.join(' ').trim();
    const cnpjDigits = (cnpj || '').replace(/\D/g, '');
    const row: ParsedRow = { address, city, uf, cep, cnpj, cnpjDigits, name };
    if (!name) row.error = 'Razão Social ausente';
    else if (cnpjDigits.length !== 14) row.error = 'CNPJ inválido';
    rows.push(row);
  }
  return rows;
}

const BulkAddCompaniesDialog = ({ open, onOpenChange, sstManagerId, onCompaniesAdded }: Props) => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsed = useMemo(() => parseInput(text), [text]);
  const validRows = parsed.filter(r => !r.error);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      toast({ title: "Nenhuma linha válida", description: "Verifique o formato colado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let created = 0;
    let linked = 0;
    let duplicatesInPaste = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Dedupe within the paste by CNPJ
    const seen = new Set<string>();
    const uniqueRows = validRows.filter(r => {
      if (seen.has(r.cnpjDigits)) { duplicatesInPaste++; return false; }
      seen.add(r.cnpjDigits);
      return true;
    });

    // Preload existing companies with these CNPJs (formatted or digits)
    const cnpjVariants = uniqueRows.flatMap(r => [r.cnpj, r.cnpjDigits]);
    const { data: existing } = await supabase
      .from('companies')
      .select('id, cnpj')
      .in('cnpj', cnpjVariants);

    const existingMap = new Map<string, string>();
    (existing || []).forEach(c => {
      if (c.cnpj) existingMap.set(c.cnpj.replace(/\D/g, ''), c.id);
    });

    // Preload existing assignments for this SST manager
    const existingIds = Array.from(existingMap.values());
    let alreadyAssigned = new Set<string>();
    if (existingIds.length > 0) {
      const { data: assigns } = await supabase
        .from('company_sst_assignments')
        .select('company_id')
        .eq('sst_manager_id', sstManagerId)
        .in('company_id', existingIds);
      alreadyAssigned = new Set((assigns || []).map(a => a.company_id));
    }

    for (const row of uniqueRows) {
      try {
        let companyId = existingMap.get(row.cnpjDigits);

        if (!companyId) {
          const fullAddress = `${row.address}, ${row.city}/${row.uf} - CEP ${row.cep}`;
          const { data: company, error: compError } = await supabase
            .from('companies')
            .insert({
              name: row.name,
              cnpj: row.cnpj,
              address: fullAddress,
              slug: row.cnpjDigits,
              subscription_status: 'pending',
            })
            .select('id')
            .single();
          if (compError) throw compError;
          companyId = company.id;
          created++;
        } else if (alreadyAssigned.has(companyId)) {
          skipped++;
          continue;
        }

        const { error: assignError } = await supabase
          .from('company_sst_assignments')
          .insert({ company_id: companyId, sst_manager_id: sstManagerId });
        if (assignError) {
          // If already assigned (race), treat as skipped rather than error
          if (assignError.code === '23505') { skipped++; continue; }
          throw assignError;
        }
        if (existingMap.has(row.cnpjDigits)) linked++;
      } catch (e: any) {
        skipped++;
        errors.push(`${row.name}: ${e.message}`);
      }
    }

    setIsSubmitting(false);
    toast({
      title: `Cadastro concluído`,
      description: `${created} nova(s), ${linked} vinculada(s), ${skipped} ignorada(s)${duplicatesInPaste ? `, ${duplicatesInPaste} duplicada(s) no texto` : ''}.`,
    });
    if (errors.length) console.warn('Bulk import errors:', errors);
    setText('');
    onOpenChange(false);
    onCompaniesAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Empresas em Lote</DialogTitle>
          <DialogDescription>
            Cole os dados copiados do Excel/Planilhas. Formato esperado (separado por tabulação):
            <br />
            <code className="text-xs">Endereço | Cidade | UF | CEP | CNPJ | Razão Social</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-text">Dados colados</Label>
            <Textarea
              id="bulk-text"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              placeholder="Avenida Edilson Lamartine Mendes, 45&#9;Uberaba&#9;MG&#9;38045-000&#9;43.544.943/0001-98&#9;ARCO DE PUA EXPRESS"
              className="font-mono text-xs"
            />
          </div>

          {parsed.length > 0 && (
            <div className="border rounded-md max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Razão Social</th>
                    <th className="p-2 text-left">CNPJ</th>
                    <th className="p-2 text-left">Cidade/UF</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        {r.error ? (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <AlertCircle className="h-3 w-3" /> {r.error}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.cnpj}</td>
                      <td className="p-2">{r.city}/{r.uf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {parsed.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {validRows.length} de {parsed.length} linhas prontas para cadastro.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || validRows.length === 0}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Cadastrar {validRows.length > 0 ? `${validRows.length} empresa(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddCompaniesDialog;
