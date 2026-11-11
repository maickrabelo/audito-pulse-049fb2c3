import { useState } from "react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PRECO_EMPRESA = 1;
const MULT_IA = 5;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usd = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
const fmtCnpj = (c?: string | null) => { const d = (c || "").replace(/\D/g, ""); return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : d; };

async function fetchAll<T>(build: (from: number, to: number) => any): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await build(i, i + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export default function Faturamento() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [ini, setIni] = useState(today.slice(0, 8) + "01");
  const [fim, setFim] = useState(today);
  const [cotacao, setCotacao] = useState("5.00");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setLoading(false); return toast({ title: "Acesso negado", description: "E-mail ou senha inválidos.", variant: "destructive" }); }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    setLoading(false);
    if (!roles?.some((r: any) => r.role === "admin")) { await supabase.auth.signOut(); return toast({ title: "Sem permissão", variant: "destructive" }); }
    setOk(true);
  };

  const gerar = async () => {
    setLoading(true);
    try {
      const start = new Date(ini + "T00:00:00-03:00").toISOString();
      const end = new Date(fim + "T23:59:59.999-03:00").toISOString();
      const empresas = await fetchAll<any>((a, b) => supabase.from("companies").select("name, cnpj, created_at").gte("created_at", start).lte("created_at", end).order("created_at").range(a, b));
      const ia = await fetchAll<any>((a, b) => supabase.from("ai_usage_logs").select("function_name, total_tokens, cost_usd").gte("created_at", start).lte("created_at", end).range(a, b));
      const cot = Number(cotacao.replace(",", ".")) || 0;
      const iaUsd = ia.reduce((s, r) => s + Number(r.cost_usd || 0), 0) * MULT_IA;
      const iaBrl = iaUsd * cot;
      const totEmp = empresas.length * PRECO_EMPRESA;
      const porFn: Record<string, { n: number; t: number; c: number }> = {};
      ia.forEach((r) => { const k = r.function_name; porFn[k] ||= { n: 0, t: 0, c: 0 }; porFn[k].n++; porFn[k].t += Number(r.total_tokens || 0); porFn[k].c += Number(r.cost_usd || 0) * MULT_IA; });

      const doc = new jsPDF();
      const W = 210; let y = 20;
      const per = `${ini.split("-").reverse().join("/")} a ${fim.split("-").reverse().join("/")}`;
      const check = (h = 8) => { if (y + h > 280) { doc.addPage(); y = 20; } };
      doc.setFillColor(22, 101, 52); doc.rect(0, 0, W, 32, "F");
      doc.setTextColor(255); doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("FATURA - Canal de Escuta", 14, 15);
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Agência Mundi  >  Grupo AMO   |   Período: ${per}`, 14, 24);
      doc.text(`Emitida em ${new Date().toLocaleString("pt-BR")}`, W - 14, 24, { align: "right" });
      doc.setTextColor(0); y = 44;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Resumo", 14, y); y += 8;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      const linha = (a: string, b: string, bold = false) => { check(); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.text(a, 14, y); doc.text(b, W - 14, y, { align: "right" }); y += 7; };
      linha(`Empresas cadastradas no período: ${empresas.length} x ${brl(PRECO_EMPRESA)}`, brl(totEmp));
      linha(`Uso de IA: ${ia.length} processamentos (${usd(iaUsd)} x cotação R$ ${cot.toFixed(2)})`, brl(iaBrl));
      doc.line(14, y - 3, W - 14, y - 3); y += 2;
      doc.setFontSize(12); linha("TOTAL A PAGAR", brl(totEmp + iaBrl), true); doc.setFontSize(10); y += 6;

      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Uso de IA por função", 14, y); y += 7; doc.setFontSize(9);
      doc.text("Função", 14, y); doc.text("Chamadas", 120, y, { align: "right" }); doc.text("Tokens", 155, y, { align: "right" }); doc.text("Custo (USD)", W - 14, y, { align: "right" }); y += 6;
      doc.setFont("helvetica", "normal");
      Object.entries(porFn).sort((a, b) => b[1].c - a[1].c).forEach(([k, v]) => { check(); doc.text(k, 14, y); doc.text(String(v.n), 120, y, { align: "right" }); doc.text(v.t.toLocaleString("pt-BR"), 155, y, { align: "right" }); doc.text(usd(v.c), W - 14, y, { align: "right" }); y += 6; });
      if (!ia.length) { doc.text("Nenhum uso no período.", 14, y); y += 6; }
      y += 6; check(14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(`Empresas cadastradas (${empresas.length})`, 14, y); y += 7; doc.setFontSize(9);
      doc.text("#", 14, y); doc.text("Razão social", 24, y); doc.text("CNPJ", 150, y); doc.text("Cadastro", W - 14, y, { align: "right" }); y += 6;
      doc.setFont("helvetica", "normal");
      empresas.forEach((e, i) => { check(); doc.text(String(i + 1), 14, y); doc.text(String(e.name || "").slice(0, 62), 24, y); doc.text(fmtCnpj(e.cnpj), 150, y); doc.text(new Date(e.created_at).toLocaleDateString("pt-BR"), W - 14, y, { align: "right" }); y += 5.5; });
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(120); doc.text(`Página ${p} de ${pages}`, W / 2, 290, { align: "center" }); }
      doc.save(`fatura-canal-de-escuta_${ini}_${fim}.pdf`);
    } catch (err: any) {
      toast({ title: "Erro ao gerar fatura", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Fatura — Canal de Escuta</CardTitle></CardHeader>
        <CardContent>
          {!ok ? (
            <form onSubmit={login} className="space-y-4">
              <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button className="w-full" disabled={loading}>Entrar</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>De</Label><Input type="date" value={ini} onChange={(e) => setIni(e.target.value)} /></div>
                <div><Label>Até</Label><Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
              </div>
              <div><Label>Cotação do dólar (R$)</Label><Input value={cotacao} onChange={(e) => setCotacao(e.target.value)} /></div>
              <Button className="w-full" onClick={gerar} disabled={loading}>{loading ? "Gerando..." : "Baixar fatura em PDF"}</Button>
              <Button variant="ghost" className="w-full" onClick={async () => { await supabase.auth.signOut(); setOk(false); }}>Sair</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
