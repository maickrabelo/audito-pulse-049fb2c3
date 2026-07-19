import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hash CPF with global salt (HMAC-like via SHA-256(salt + cpf))
async function hashCpf(cpf: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + cpf);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function onlyDigits(s: string | null | undefined): string {
  return (s || "").replace(/\D/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { company_id, export_code } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SOC_EMPRESA = Deno.env.get("SOC_EMPRESA");
    const SOC_CODIGO = Deno.env.get("SOC_CODIGO");
    const SOC_CHAVE = Deno.env.get("SOC_CHAVE");
    const CPF_HASH_SALT = Deno.env.get("CPF_HASH_SALT");
    const codigo = export_code || Deno.env.get("SOC_EXPORT_CODE_FUNCIONARIOS");

    if (!SOC_EMPRESA || !SOC_CODIGO || !SOC_CHAVE || !CPF_HASH_SALT) {
      return new Response(JSON.stringify({ error: "SOC credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!codigo) {
      return new Response(JSON.stringify({ error: "export_code (código do relatório SOC de funcionários) é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = new Date().toISOString();

    // Load company to get its CNPJ / código SOC (usamos CNPJ como filtro se necessário)
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, cnpj")
      .eq("id", company_id)
      .maybeSingle();
    if (!company) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SOC ExportaDados endpoint
    const parametro = {
      empresa: SOC_EMPRESA,
      codigo,
      chave: SOC_CHAVE,
      tipoSaida: "json",
    };
    const url = `https://ws1.soc.com.br/WebSoc/exportadados?parametro=${encodeURIComponent(JSON.stringify(parametro))}`;

    const socRes = await fetch(url);
    if (!socRes.ok) {
      const body = await socRes.text();
      console.error("SOC error", socRes.status, body);
      await supabase.from("soc_sync_logs").insert({
        company_id, started_at: startedAt, finished_at: new Date().toISOString(),
        status: "error", error_message: `SOC ${socRes.status}: ${body.slice(0, 500)}`,
      });
      return new Response(JSON.stringify({ error: "Falha ao consultar SOC", details: body.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SOC returns ISO-8859-1 sometimes; try as text and JSON.parse
    const raw = await socRes.text();
    let rows: any[] = [];
    try { rows = JSON.parse(raw); } catch { rows = []; }

    // Filter for this company by CNPJ if available in row (SOC field: CODIGOEMPRESA / CNPJ)
    const cnpjDigits = onlyDigits(company.cnpj);
    const filtered = cnpjDigits
      ? rows.filter((r: any) => onlyDigits(r.CNPJ || r.CNPJEMPRESA || r.cnpj) === cnpjDigits)
      : rows;

    let inserted = 0;
    const errors: string[] = [];
    for (const r of filtered) {
      const cpfDigits = onlyDigits(r.CPF || r.CPFFUNCIONARIO || r.cpf);
      if (cpfDigits.length !== 11) continue;
      try {
        const cpf_hash = await hashCpf(cpfDigits, CPF_HASH_SALT);
        const { error } = await supabase.from("soc_employees").upsert({
          company_id,
          cpf_hash,
          cpf_last4: cpfDigits.slice(-4),
          matricula: r.MATRICULAFUNCIONARIO || r.MATRICULA || null,
          unidade: r.NOMEUNIDADE || r.UNIDADE || null,
          setor: r.NOMESETOR || r.SETOR || null,
          ghe: r.NOMEGHE || r.GHE || null,
          cargo: r.NOMECARGO || r.CARGO || null,
          cbo: r.CBOCARGO || r.CBO || null,
          situacao: r.SITUACAO || null,
          synced_at: new Date().toISOString(),
        }, { onConflict: "company_id,cpf_hash" });
        if (error) errors.push(error.message);
        else inserted++;
      } catch (e: any) {
        errors.push(e.message);
      }
    }

    await supabase.from("soc_sync_logs").insert({
      company_id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: errors.length ? "partial" : "success",
      rows_received: filtered.length,
      rows_upserted: inserted,
      error_message: errors.length ? errors.slice(0, 5).join(" | ") : null,
    });

    return new Response(JSON.stringify({
      success: true, received: filtered.length, upserted: inserted, errors: errors.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("soc-sync-company error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
