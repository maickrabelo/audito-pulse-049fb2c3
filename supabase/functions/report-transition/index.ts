import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  transicaoPermitida,
  ROTEAMENTO,
  SLA_REGRAS,
  addDiasUteis,
  validarSaidaIA,
  type Estado,
  type Competencia,
} from "../_shared/nr1-spec.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const papeis = (roles || []).map((r: { role: string }) => r.role);
    const equipeAmo = papeis.some((p) => ["admin", "triador_sst", "apurador", "comite", "dpo", "medico_trabalho"].includes(p));

    const body = await req.json();
    const { report_id, estado_destino, classificacao, justificativa, motivo } = body as {
      report_id: string;
      estado_destino: Estado;
      classificacao?: Record<string, unknown>;
      justificativa?: string;
      motivo?: string;
    };

    if (!report_id || !estado_destino) return json({ error: "report_id e estado_destino obrigatórios" }, 400);

    const { data: report } = await admin
      .from("reports")
      .select("id, company_id, estado, competencia, risco_grave_imediato, prioridade, pilares, parte_amo, parte_empresa, versao_classificacao, tracking_code")
      .eq("id", report_id)
      .maybeSingle();
    if (!report) return json({ error: "Manifestação não encontrada" }, 404);

    // Autorização: equipe AMO ou usuário da própria empresa
    if (!equipeAmo) {
      const { data: profile } = await admin.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
      if (!profile || profile.company_id !== report.company_id) return json({ error: "Sem permissão" }, 403);
      const permitidosEmpresa: Estado[] = ["EM_APURACAO_EMPRESA", "MEDIDAS_DEFINIDAS", "PLANO_DE_ACAO_ABERTO", "EM_ACOMPANHAMENTO", "AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO"];
      if (!permitidosEmpresa.includes(estado_destino)) return json({ error: "Transição restrita à equipe AMO" }, 403);
    }

    const atual = report.estado as Estado;
    if (!transicaoPermitida(atual, estado_destino)) {
      return json({ error: `Transição inválida: ${atual} -> ${estado_destino}` }, 422);
    }

    const agora = new Date().toISOString();
    const update: Record<string, unknown> = { estado: estado_destino };
    let novaVersao = report.versao_classificacao ?? 1;

    // ---- Validação humana da classificação ------------------------------
    if (estado_destino === "CLASSIFICADA") {
      if (!classificacao) return json({ error: "Classificação humana obrigatória" }, 400);
      if (!equipeAmo) return json({ error: "Somente a equipe AMO valida a classificação" }, 403);

      const { valido, erros, saida } = validarSaidaIA({
        ...classificacao,
        justificativa_classificacao: justificativa || classificacao.justificativa_classificacao,
      });
      if (!valido) return json({ error: "Classificação inconsistente", erros }, 422);
      if (!justificativa || justificativa.trim().length < 10) {
        return json({ error: "Justificativa da decisão humana é obrigatória" }, 400);
      }

      novaVersao = (report.versao_classificacao ?? 1) + 1;
      Object.assign(update, {
        competencia: saida.classificacao_principal,
        risco_grave_imediato: saida.risco_grave_imediato,
        prioridade: saida.prioridade,
        pilares: saida.pilares_psicossociais,
        parte_amo: saida.parte_competencia_amo,
        parte_empresa: saida.parte_competencia_empresa,
        justificativa_humana: justificativa,
        classificado_por: user.id,
        classificado_em: agora,
        versao_classificacao: novaVersao,
        amo_validated_by: user.id,
        amo_validated_at: agora,
        amo_validation_notes: justificativa,
        amo_validated_classification:
          saida.risco_grave_imediato === "SIM" ? "4D_grave_immediate"
            : saida.classificacao_principal === "SST_NR1" ? "4A_sst"
              : saida.classificacao_principal === "EMPRESA_CLIENTE" ? "4B_out_of_scope"
                : saida.classificacao_principal === "DENUNCIA_MISTA" ? "4C_mixed" : "pending_ai",
      });

      await admin.from("classificacao_versoes").insert({
        report_id,
        versao: novaVersao,
        origem: "HUMANA",
        competencia: saida.classificacao_principal,
        risco_grave_imediato: saida.risco_grave_imediato,
        prioridade: saida.prioridade,
        pilares: saida.pilares_psicossociais,
        parte_amo: saida.parte_competencia_amo,
        parte_empresa: saida.parte_competencia_empresa,
        justificativa,
        confianca: 100,
        payload: saida,
        autor_id: user.id,
      });

      // Manifestação mista: cria as duas subtratativas independentes
      if (saida.classificacao_principal === "DENUNCIA_MISTA") {
        const { data: existentes } = await admin.from("subtratativas").select("escopo").eq("report_id", report_id);
        const jaTem = new Set((existentes || []).map((s: { escopo: string }) => s.escopo));
        const novas = [
          { escopo: "AMO", resumo: saida.parte_competencia_amo, estado: "ENCAMINHADA_AMO" },
          { escopo: "EMPRESA", resumo: saida.parte_competencia_empresa, estado: "ENCAMINHADA_EMPRESA" },
        ].filter((s) => !jaTem.has(s.escopo)).map((s) => ({ report_id, ...s }));
        if (novas.length) await admin.from("subtratativas").insert(novas);
      }
    }

    // ---- Regras de encerramento ----------------------------------------
    if (estado_destino === "AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO" || estado_destino === "ENCERRADA") {
      const { data: subs } = await admin.from("subtratativas").select("id, escopo").eq("report_id", report_id).is("concluida_em", null);
      if (subs && subs.length) {
        return json({ error: "Não é possível encerrar: existem subtratativas em aberto", pendencias: subs.map((s) => s.escopo) }, 422);
      }
      const { data: planos } = await admin.from("planos_acao").select("id").eq("report_id", report_id).neq("status", "CONCLUIDA");
      if (planos && planos.length) {
        return json({ error: "Não é possível encerrar: existem ações do plano em aberto", pendencias: planos.length }, 422);
      }
    }
    if (estado_destino === "ENCERRADA") {
      if (!equipeAmo) return json({ error: "Somente a equipe AMO encerra a manifestação" }, 403);
      if (!justificativa) return json({ error: "Justificativa de encerramento obrigatória" }, 400);
      update.status = "resolved";
      update.justificativa_humana = justificativa;
    }
    if (estado_destino === "AGUARDANDO_COMPLEMENTACAO") {
      update.status = "pending";
    }
    if (["ENCAMINHADA_AMO", "ENCAMINHADA_EMPRESA", "EM_TRATATIVA_MISTA", "EM_ANALISE_TECNICA_AMO", "EM_APURACAO_EMPRESA"].includes(estado_destino)) {
      update.status = "in_progress";
      if (!report.empresa_confirmou_recebimento_em && estado_destino === "ENCAMINHADA_EMPRESA") {
        update.empresa_confirmou_recebimento_em = null;
      }
    }

    const { error: updErr } = await admin.from("reports").update(update).eq("id", report_id);
    if (updErr) return json({ error: updErr.message }, 500);

    await admin.from("report_updates").insert({
      report_id,
      user_id: user.id,
      old_status: atual,
      new_status: estado_destino,
      notes: justificativa || motivo || null,
    });

    // ---- SLA ------------------------------------------------------------
    if (estado_destino === "ENCAMINHADA_AMO" || estado_destino === "EM_TRATATIVA_MISTA") {
      await admin.from("sla_prazos").insert({
        report_id,
        evento: "apuracao_tecnica_amo",
        iniciado_em: agora,
        limite_em: addDiasUteis(new Date(), SLA_REGRAS.apuracao_tecnica_amo.dias).toISOString(),
      });
    }
    if (estado_destino === "ENCERRADA" || estado_destino === "ARQUIVADA") {
      await admin.from("sla_prazos").update({ concluido_em: agora }).eq("report_id", report_id).is("concluido_em", null);
    }
    if (estado_destino === "AGUARDANDO_COMPLEMENTACAO") {
      await admin.from("sla_prazos").update({ pausado_em: agora, motivo_pausa: "Aguardando complementação do manifestante" })
        .eq("report_id", report_id).is("concluido_em", null).is("pausado_em", null);
    }
    if (atual === "AGUARDANDO_COMPLEMENTACAO") {
      await admin.from("sla_prazos").update({ pausado_em: null, motivo_pausa: null })
        .eq("report_id", report_id).is("concluido_em", null).not("pausado_em", "is", null);
    }

    const proximoSugerido = estado_destino === "CLASSIFICADA"
      ? ROTEAMENTO[(update.competencia as Competencia) ?? (report.competencia as Competencia)]
      : null;

    return json({ success: true, estado: estado_destino, versao: novaVersao, proximo_sugerido: proximoSugerido });
  } catch (e) {
    console.error("report-transition error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
