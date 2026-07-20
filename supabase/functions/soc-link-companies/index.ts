import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const onlyDigits = (s: any) => String(s || "").replace(/\D/g, "");

function parseCsv(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(";");
  return lines.slice(1).map(line => {
    const cols = line.split(";");
    const row: any = {};
    headers.forEach((h, i) => row[h.trim()] = (cols[i] || "").trim());
    return row;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const SOC_EMPRESA = Deno.env.get("SOC_EMPRESA_FUNC") || Deno.env.get("SOC_EMPRESA");
    const codigo = Deno.env.get("SOC_EXPORT_CODE_EMPRESAS");
    const chave = Deno.env.get("SOC_CHAVE_EMPRESAS");
    if (!SOC_EMPRESA || !codigo || !chave) {
      return new Response(JSON.stringify({ error: "SOC credentials for company list not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parametro = { empresa: SOC_EMPRESA, codigo, chave, tipoSaida: "csv" };
    const url = `https://ws1.soc.com.br/WebSoc/exportadados?parametro=${encodeURIComponent(JSON.stringify(parametro))}`;
    const socRes = await fetch(url);
    if (!socRes.ok) {
      const body = await socRes.text();
      return new Response(JSON.stringify({ error: "SOC error", details: body.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await socRes.arrayBuffer());
    let raw: string;
    try { raw = new TextDecoder("utf-8", { fatal: true }).decode(buf); }
    catch { raw = new TextDecoder("iso-8859-1").decode(buf); }

    const rows = parseCsv(raw);

    // Map: CNPJ digits -> CODIGO (empresaTrabalho)
    const byCnpj = new Map<string, string>();
    for (const r of rows) {
      const cnpj = onlyDigits(r.CNPJ);
      const code = String(r.CODIGO || "").trim();
      if (cnpj && code && !byCnpj.has(cnpj)) byCnpj.set(cnpj, code);
    }

    // Fetch all companies from our DB
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, cnpj, soc_unit_code");
    if (error) throw error;

    let matched = 0, updated = 0, skipped = 0, notFound = 0;
    const notFoundList: { id: string; name: string; cnpj: string }[] = [];
    const toUpdate: { id: string; code: string }[] = [];

    for (const c of companies || []) {
      const cnpj = onlyDigits(c.cnpj);
      if (!cnpj) { skipped++; continue; }
      const code = byCnpj.get(cnpj);
      if (!code) { notFound++; notFoundList.push({ id: c.id, name: c.name, cnpj }); continue; }
      matched++;
      if (String(c.soc_unit_code || "") !== code) toUpdate.push({ id: c.id, code });
    }

    // Executa updates em paralelo com concorrência limitada
    const CONCURRENCY = 20;
    for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
      const batch = toUpdate.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(u =>
        supabase.from("companies").update({ soc_unit_code: u.code }).eq("id", u.id)
      ));
      updated += results.filter(r => !r.error).length;
    }

    return new Response(JSON.stringify({
      success: true,
      soc_companies: rows.length,
      db_companies: companies?.length || 0,
      matched, updated, skipped_no_cnpj: skipped, not_found_in_soc: notFound,
      not_found_sample: notFoundList.slice(0, 20),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
