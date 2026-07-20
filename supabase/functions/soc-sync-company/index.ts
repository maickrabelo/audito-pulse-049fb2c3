import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { company_id, export_code, unit_code } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SOC_EMPRESA = Deno.env.get("SOC_EMPRESA");
    const SOC_CHAVE = Deno.env.get("SOC_CHAVE");
    const CPF_HASH_SALT = Deno.env.get("CPF_HASH_SALT");

    if (!SOC_EMPRESA || !SOC_CHAVE || !CPF_HASH_SALT) {
      return new Response(JSON.stringify({ error: "SOC credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = new Date().toISOString();

    const { data: company } = await supabase
      .from("companies")
      .select("id, name, cnpj, soc_unit_code, soc_export_code")
      .eq("id", company_id)
      .maybeSingle();
    if (!company) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const codigo = export_code || company.soc_export_code || Deno.env.get("SOC_EXPORT_CODE_FUNCIONARIOS");
    const unitCode = unit_code || company.soc_unit_code;

    if (!codigo) {
      return new Response(JSON.stringify({ error: "export_code (código do relatório SOC Exporta Dados de funcionários) é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!unitCode) {
      return new Response(JSON.stringify({ error: "soc_unit_code (CODIGOUNIDADE no SOC) é obrigatório para esta empresa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parametro = {
      empresa: SOC_EMPRESA,
      codigo,
      chave: SOC_CHAVE,
      tipoSaida: "json",
      ativo: "Sim",
      inativo: "",
      afastado: "",
      pendente: "",
      ferias: "",
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

    // SOC pode retornar latin-1
    const buf = new Uint8Array(await socRes.arrayBuffer());
    let raw: string;
    try { raw = new TextDecoder("utf-8", { fatal: true }).decode(buf); }
    catch { raw = new TextDecoder("iso-8859-1").decode(buf); }

    let rows: any[] = [];
    try { rows = JSON.parse(raw); } catch { rows = []; }

    // Filtrar por CODIGOUNIDADE da empresa (empresas clientes são unidades da conta SOC principal)
    const unitStr = String(unitCode).trim();
    const filtered = rows.filter((r: any) => String(r.CODIGOUNIDADE || "").trim() === unitStr);

    let inserted = 0;
    const errors: string[] = [];
    for (const r of filtered) {
      const cpfDigits = onlyDigits(r.CPF);
      if (cpfDigits.length !== 11) continue;
      try {
        const cpf_hash = await hashCpf(cpfDigits, CPF_HASH_SALT);
        const { error } = await supabase.from("soc_employees").upsert({
          company_id,
          cpf_hash,
          cpf_last4: cpfDigits.slice(-4),
          matricula: r.MATRICULAFUNCIONARIO || null,
          unidade: r.NOMEUNIDADE || null,
          setor: r.NOMESETOR || null,
          ghe: r.NOMEGHE || r.NOMESETOR || null,
          cargo: r.NOMECARGO || null,
          cbo: r.CBOCARGO || null,
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
      success: true,
      total_rows: rows.length,
      matched_unit: filtered.length,
      upserted: inserted,
      errors: errors.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("soc-sync-company error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
