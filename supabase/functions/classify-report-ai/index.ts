import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  preProcessar,
  SYSTEM_PROMPT,
  validarSaidaIA,
  ROTEAMENTO,
  SLA_REGRAS,
  addDiasUteis,
  type Prioridade,
} from "../_shared/nr1-spec.ts";
import { logAiUsage } from "../_shared/ai-usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { report_id, force } = await req.json();
    if (!report_id) return json({ error: "report_id obrigatório" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select(
        "id, company_id, title, description, ai_summary, category, snapshot_unidade, snapshot_ghe, snapshot_cargo, " +
          "data_inicio_ocorrencia, data_fim_ocorrencia, periodo_descritivo, local_ocorrencia, pessoas_envolvidas, " +
          "testemunhas, evidencias_disponiveis, ha_risco_imediato_informado, versao_classificacao",
      )
      .eq("id", report_id)
      .maybeSingle();

    if (repErr || !report) return json({ error: "Denúncia não encontrada" }, 404);

    // Parâmetros do canal (específicos da empresa, com fallback global)
    const { data: params } = await supabase
      .from("parametros_canal")
      .select("*")
      .or(`company_id.eq.${report.company_id},company_id.is.null`)
      .order("company_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const confiancaMinima = params?.confianca_minima ?? 70;
    const prioridadeIndet = (params?.prioridade_risco_indeterminado ?? "ALTA") as Prioridade;
    const prioridadeNao = (params?.prioridade_risco_nao ?? "MODERADA") as Prioridade;

    await supabase.from("reports").update({ estado: "EM_TRIAGEM" }).eq("id", report_id);

    // Pré-processamento: sanitização e pseudonimização antes de enviar ao modelo
    const contexto = [
      `Título: ${preProcessar(report.title || "")}`,
      `Relato: ${preProcessar(report.description || "")}`,
      report.ai_summary ? `Resumo do atendimento: ${preProcessar(report.ai_summary)}` : "",
      report.periodo_descritivo ? `Período: ${preProcessar(report.periodo_descritivo)}` : "",
      report.data_inicio_ocorrencia ? `Início da ocorrência: ${report.data_inicio_ocorrencia}` : "",
      report.data_fim_ocorrencia ? `Fim da ocorrência: ${report.data_fim_ocorrencia}` : "",
      report.local_ocorrencia ? `Local/setor: ${preProcessar(report.local_ocorrencia)}` : "",
      report.pessoas_envolvidas ? `Pessoas envolvidas (papel funcional): ${preProcessar(report.pessoas_envolvidas)}` : "",
      report.testemunhas ? `Testemunhas: ${preProcessar(report.testemunhas)}` : "",
      report.evidencias_disponiveis ? `Evidências indicadas: ${preProcessar(report.evidencias_disponiveis)}` : "",
      report.ha_risco_imediato_informado != null
        ? `Denunciante informou risco imediato: ${report.ha_risco_imediato_informado ? "sim" : "não"}`
        : "",
      report.snapshot_unidade ? `Unidade: ${report.snapshot_unidade}` : "",
      report.snapshot_ghe ? `GHE/Setor: ${report.snapshot_ghe}` : "",
      report.snapshot_cargo ? `Cargo: ${report.snapshot_cargo}` : "",
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contexto },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const body = await aiRes.text();
      console.error("AI gateway error", aiRes.status, body);
      await supabase.from("reports").update({ estado: "AGUARDANDO_VALIDACAO_HUMANA", ia_schema_valido: false }).eq("id", report_id);
      return json({ error: "Falha na triagem de IA", status: aiRes.status }, aiRes.status === 429 ? 429 : 502);
    }

    const completion = await aiRes.json();
    await logAiUsage({
      functionName: "classify-report-ai",
      model: "google/gemini-3.6-flash",
      usage: completion?.usage,
      companyId: report?.company_id ?? null,
      reportId: report_id ?? null,
    });
    const content = completion?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(content.replace(/^```json\s*/i, "").replace(/```$/, ""));
    } catch {
      parsed = {};
    }

    const { valido, erros, saida } = validarSaidaIA(parsed, prioridadeIndet, prioridadeNao);

    const versao = (report.versao_classificacao ?? 0) + 1;
    const critico = saida.risco_grave_imediato === "SIM";
    const baixaConfianca = saida.confianca < confiancaMinima;

    // Estado após triagem automática: sempre aguarda validação humana (obrigatória),
    // exceto alerta crítico, que ativa primeiro o fluxo de emergência.
    const estado = critico
      ? "ALERTA_CRITICO_ATIVO"
      : saida.classificacao_principal === "INFORMACOES_INSUFICIENTES"
        ? "AGUARDANDO_COMPLEMENTACAO"
        : "AGUARDANDO_VALIDACAO_HUMANA";

    await supabase.from("reports").update({
      estado,
      competencia: saida.classificacao_principal,
      risco_grave_imediato: saida.risco_grave_imediato,
      prioridade: saida.prioridade,
      pilares: saida.pilares_psicossociais,
      parte_amo: saida.parte_competencia_amo,
      parte_empresa: saida.parte_competencia_empresa,
      confianca_ia: saida.confianca,
      ia_schema_valido: valido,
      dados_faltantes: saida.dados_faltantes,
      documentos_sugeridos: saida.documentos_sugeridos,
      trechos_relevantes: saida.trechos_relevantes,
      acao_recomendada: saida.acao_recomendada,
      ai_classification_rationale: saida.justificativa_classificacao,
      versao_classificacao: versao,
      // compatibilidade com a classificação legada 4A/4B/4C/4D
      ai_classification: critico
        ? "4D_grave_immediate"
        : saida.classificacao_principal === "SST_NR1"
          ? "4A_sst"
          : saida.classificacao_principal === "EMPRESA_CLIENTE"
            ? "4B_out_of_scope"
            : saida.classificacao_principal === "DENUNCIA_MISTA"
              ? "4C_mixed"
              : "pending_ai",
    }).eq("id", report_id);

    await supabase.from("classificacao_versoes").insert({
      report_id,
      versao,
      origem: "IA",
      competencia: saida.classificacao_principal,
      risco_grave_imediato: saida.risco_grave_imediato,
      prioridade: saida.prioridade,
      pilares: saida.pilares_psicossociais,
      parte_amo: saida.parte_competencia_amo,
      parte_empresa: saida.parte_competencia_empresa,
      justificativa: saida.justificativa_classificacao,
      confianca: saida.confianca,
      payload: { ...saida, erros_validacao: erros, schema_valido: valido, roteamento_sugerido: ROTEAMENTO[saida.classificacao_principal] },
    });

    // Solicitações de evidência sugeridas (somente parte AMO)
    if (saida.documentos_sugeridos.length && saida.classificacao_principal !== "EMPRESA_CLIENTE") {
      const prazo = addDiasUteis(new Date(), SLA_REGRAS.acionamento_empresa_demais_casos.dias).toISOString();
      await supabase.from("solicitacoes_evidencia").insert(
        saida.documentos_sugeridos.slice(0, 20).map((doc) => ({
          report_id,
          documento: doc,
          destinatario: "EMPRESA",
          status: "SUGERIDA",
          prazo_limite: prazo,
        })),
      );
    }

    // SLA de triagem concluído; abre prazo de acionamento da empresa
    await supabase.from("sla_prazos").update({ concluido_em: new Date().toISOString() })
      .eq("report_id", report_id).eq("evento", "triagem_inicial").is("concluido_em", null);

    const regra = critico ? SLA_REGRAS.acionamento_empresa_caso_grave : SLA_REGRAS.acionamento_empresa_demais_casos;
    await supabase.from("sla_prazos").insert({
      report_id,
      evento: critico ? "acionamento_empresa_caso_grave" : "acionamento_empresa_demais_casos",
      iniciado_em: new Date().toISOString(),
      limite_em: addDiasUteis(new Date(), regra.dias).toISOString(),
    });

    if (critico) {
      supabase.functions.invoke("escalate-report", { body: { report_id } })
        .catch((e) => console.error("escalate-report failed", e));
    }

    return json({
      success: true,
      schema_valido: valido,
      erros_validacao: erros,
      baixa_confianca: baixaConfianca,
      estado,
      classificacao: saida,
    });
  } catch (e) {
    console.error("classify-report-ai error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
