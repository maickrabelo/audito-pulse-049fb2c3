import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logAiUsage } from "../_shared/ai-usage.ts";
import {
  aplicarGuardrailsSaida,
  buildAnaSystemPrompt,
  exigirEscopo,
  neutralizarInjection,
  SUMMARY_SYSTEM_PROMPT,
  TenantScopeError,
  TEMPLATES,
  validarAnalysisResult,
  CLASSE_TO_COMPETENCIA,
  CLASSE_TO_AI_CLASSIFICATION,
} from "../_shared/canal-escuta.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id, x-company-id, x-case-id",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODEL = "google/gemini-3.1-flash-lite";
const MAX_TURNS = 8;
const TIMEOUT_MS = 45_000;

/** Só mensagens de usuário/assistente do próprio caso entram no contexto. */
function prepararHistorico(messages: unknown): { role: string; content: string }[] {
  if (!Array.isArray(messages)) return [];
  const limpos = messages
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m: any) => ({ role: m.role as string, content: String(m.content).slice(0, 6000) }));
  return limpos.slice(-MAX_TURNS);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const inicio = Date.now();
  let escopo: ReturnType<typeof exigirEscopo> | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const mode: "chat" | "summary" = body?.mode === "summary" ? "summary" : "chat";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Serviço de IA indisponível no momento." }, 503);

    // ---------------------------------------------------------------------
    // Isolamento obrigatório: tenant + sessão + caso
    // ---------------------------------------------------------------------
    try {
      escopo = exigirEscopo({
        tenant_id: req.headers.get("x-company-id") || body?.company_id || "",
        session_id: req.headers.get("x-session-id") || body?.session_id || "",
        case_id: req.headers.get("x-case-id") || body?.case_id || "",
      });
    } catch (e) {
      if (e instanceof TenantScopeError) return json({ error: e.message }, 400);
      throw e;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Tenant precisa existir — nunca aceitar company_id arbitrário.
    const { data: tenant } = await supabase
      .from("companies")
      .select("id")
      .eq("id", escopo.tenant_id)
      .maybeSingle();
    if (!tenant) return json({ error: "Empresa inválida para esta conversa." }, 403);

    // ---------------------------------------------------------------------
    // Rate limit por sessão (50/h)
    // ---------------------------------------------------------------------
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("chat_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("session_id", escopo.session_id)
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= 50) {
      return json({ error: "Limite de mensagens atingido. Aguarde alguns minutos antes de continuar." }, 429);
    }

    await supabase.from("chat_rate_limits").insert({
      session_id: escopo.session_id,
      company_id: escopo.tenant_id,
      request_count: 1,
    });

    // ---------------------------------------------------------------------
    // Sanitização de prompt injection (o relato legítimo é preservado)
    // ---------------------------------------------------------------------
    const historico = prepararHistorico(body?.messages);
    const injectionPatterns: string[] = [];
    const historicoSeguro = historico.map((m) => {
      if (m.role !== "user") return m;
      const r = neutralizarInjection(m.content);
      if (r.detected) injectionPatterns.push(...r.patterns);
      return { role: m.role, content: r.sanitized };
    });

    if (historicoSeguro.length === 0) {
      return json({ error: "Nenhuma mensagem válida recebida." }, 400);
    }

    // Data/hora sempre do backend
    const nowIso = new Date().toISOString();

    const systemPrompt = mode === "summary"
      ? SUMMARY_SYSTEM_PROMPT
      : buildAnaSystemPrompt({ nowIso, timezone: "America/Sao_Paulo", caseId: escopo.case_id });

    const userPayload = mode === "summary"
      ? [{
        role: "user",
        content: "Transcrição da conversa (relatos, não fatos comprovados):\n\n" +
          historicoSeguro
            .map((m) => `${m.role === "user" ? "Manifestante" : "Ana"}: ${m.content}`)
            .join("\n\n"),
      }]
      : historicoSeguro;

    // ---------------------------------------------------------------------
    // Chamada ao gateway com timeout controlado
    // ---------------------------------------------------------------------
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Lovable-API-Key": LOVABLE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...userPayload],
          ...(mode === "chat" ? { response_format: { type: "json_object" } } : {}),
        }),
      });
    } catch (e) {
      clearTimeout(timer);
      const abortado = (e as Error)?.name === "AbortError";
      console.error("chat-report gateway failure", e);
      return json({
        error: abortado
          ? "Não consegui concluir o processamento neste momento. Tente novamente."
          : "Não consegui processar sua mensagem agora.",
        timeout: abortado,
      }, 504);
    }
    clearTimeout(timer);

    if (!response.ok) {
      const texto = await response.text();
      console.error("AI gateway error", response.status, texto);
      if (response.status === 429) {
        return json({ error: "Muitas solicitações no momento. Tente novamente em instantes." }, 429);
      }
      if (response.status === 402 || response.status === 403) {
        return json({ error: "Serviço de IA temporariamente indisponível. Tente novamente mais tarde." }, 503);
      }
      return json({ error: "Não consegui processar sua mensagem agora." }, 502);
    }

    const data = await response.json();
    await logAiUsage({
      functionName: "chat-report",
      model: MODEL,
      usage: data?.usage,
      companyId: escopo.tenant_id,
      metadata: { mode, case_id: escopo.case_id },
    });

    const bruto: string = data?.choices?.[0]?.message?.content ?? "";

    // -------------------------- modo resumo ------------------------------
    if (mode === "summary") {
      const { text, violations } = aplicarGuardrailsSaida(
        bruto.replace(/[*#`]/g, ""),
      );
      await registrarAuditoria(supabase, {
        escopo,
        mode,
        injectionPatterns,
        violations,
        analysis: null,
        latency: Date.now() - inicio,
      });
      return json({ success: true, summary: text });
    }

    // --------------------------- modo chat -------------------------------
    let parsed: any = {};
    try {
      parsed = JSON.parse(bruto.replace(/^```json\s*/i, "").replace(/```$/, "").trim());
    } catch {
      parsed = {};
    }

    const { valid, errors, analysis } = validarAnalysisResult(parsed?.analysis_result);
    const respostaBruta = typeof parsed?.reply === "string" && parsed.reply.trim()
      ? parsed.reply
      : TEMPLATES.insuficiente;

    const { text: reply, violations } = aplicarGuardrailsSaida(
      respostaBruta.replace(/[*#`]/g, ""),
      { confirmedActions: [] }, // nenhuma integração de ação confirmada existe hoje
    );

    await registrarAuditoria(supabase, {
      escopo,
      mode,
      injectionPatterns,
      violations,
      analysis,
      schemaValido: valid,
      schemaErros: errors,
      latency: Date.now() - inicio,
    });

    // O analysis_result completo é interno; o cliente recebe apenas o controle de UI.
    return json({
      success: true,
      reply,
      server_time: nowIso,
      control: {
        can_finalize: analysis.can_finalize,
        critical_crisis: analysis.critical_crisis,
        urgencia_preliminar: analysis.urgencia,
        information_sufficient: analysis.information_sufficient,
        human_review_required: true,
      },
      // Classificação preliminar (sujeita a validação humana) para o submit.
      preliminary: {
        class_principal: analysis.class_principal,
        competencia: CLASSE_TO_COMPETENCIA[analysis.class_principal],
        ai_classification: CLASSE_TO_AI_CLASSIFICATION[analysis.class_principal],
      },
    });
  } catch (error) {
    console.error("chat-report error", error);
    return json({ error: "Não consegui processar sua mensagem agora." }, 500);
  }
});

async function registrarAuditoria(supabase: any, p: {
  escopo: { tenant_id: string; session_id: string; case_id: string };
  mode: string;
  injectionPatterns: string[];
  violations: string[];
  analysis: unknown;
  schemaValido?: boolean;
  schemaErros?: string[];
  latency: number;
}) {
  try {
    await supabase.from("chat_ai_audit").insert({
      company_id: p.escopo.tenant_id,
      session_id: p.escopo.session_id,
      case_id: p.escopo.case_id,
      mode: p.mode,
      model: MODEL,
      injection_detected: p.injectionPatterns.length > 0,
      injection_patterns: p.injectionPatterns,
      guardrail_violations: p.violations,
      schema_valid: p.schemaValido ?? true,
      schema_errors: p.schemaErros ?? [],
      analysis_result: p.analysis,
      latency_ms: p.latency,
    });
  } catch (e) {
    console.error("chat_ai_audit insert failed", e);
  }
}
