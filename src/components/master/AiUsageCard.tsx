import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, RefreshCw, DollarSign, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UsageRow {
  function_name: string;
  model: string;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
}

const MULTIPLICADOR = 5;

const fmtUsd = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });

const AiUsageCard = () => {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_usage_logs")
      .select("function_name, model, total_tokens, cost_usd, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (!error && data) setRows(data as UsageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalCost = rows.reduce((s, r) => s + Number(r.cost_usd || 0), 0);
  const totalTokens = rows.reduce((s, r) => s + Number(r.total_tokens || 0), 0);
  const totalCalls = rows.length;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const mesRows = rows.filter((r) => new Date(r.created_at) >= inicioMes);
  const mesCost = mesRows.reduce((s, r) => s + Number(r.cost_usd || 0), 0);

  const porFuncao = Object.values(
    rows.reduce<Record<string, { name: string; calls: number; tokens: number; cost: number }>>((acc, r) => {
      const k = r.function_name;
      acc[k] = acc[k] || { name: k, calls: 0, tokens: 0, cost: 0 };
      acc[k].calls += 1;
      acc[k].tokens += Number(r.total_tokens || 0);
      acc[k].cost += Number(r.cost_usd || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.cost - a.cost);

  const LABELS: Record<string, string> = {
    "chat-report": "Chat de manifestação (Ana)",
    "classify-report-ai": "Triagem / classificação NR-1",
    "analyze-reports": "Análise de manifestações",
    "analyze-climate-survey": "Análise de pesquisa de clima",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-audit-primary">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Custo total (USD)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-audit-primary">{fmtUsd(totalCost * MULTIPLICADOR)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Custo do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtUsd(mesCost * MULTIPLICADOR)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Hash className="h-4 w-4" /> Tokens processados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processamentos de IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Consumo de IA por processo</CardTitle>
            <CardDescription>
              Custo estimado a partir dos tokens de cada modelo.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead className="text-right">Execuções</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porFuncao.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {loading ? "Carregando..." : "Nenhum consumo de IA registrado ainda."}
                  </TableCell>
                </TableRow>
              )}
              {porFuncao.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="font-medium">{LABELS[f.name] ?? f.name}</TableCell>
                  <TableCell className="text-right">{f.calls.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{f.tokens.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtUsd(f.cost * MULTIPLICADOR)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiUsageCard;
