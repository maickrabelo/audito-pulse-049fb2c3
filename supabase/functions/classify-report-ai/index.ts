import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um triador de denúncias de ouvidoria SST (Segurança e Saúde do Trabalho) sob NR-1.
Classifique o relato em UMA das categorias:

- "4A_sst": envolve risco psicossocial/SST no trabalho (assédio moral, assédio sexual, sobrecarga, discriminação, violência, condições inseguras).
- "4B_out_of_scope": problema pessoal ou fora do escopo SST (briga com vizinho, questão familiar, financeira pessoal etc.).
- "4C_mixed": mistura de SST com outro tema (ex: conflito familiar que também gera assédio no trabalho).
- "4D_grave_immediate": risco GRAVE e IMINENTE à vida/integridade (tentativa de suicídio, ameaça de morte real e imediata, ferimento com risco de vida em curso, violência física em andamento).

Responda APENAS com JSON válido no formato:
{"classification":"4A_sst"|"4B_out_of_scope"|"4C_mixed"|"4D_grave_immediate","rationale":"1-2 frases explicando"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { report_id } = await req.json();
    if (!report_id) throw new Error("report_id required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: report, error } = await supabase
      .from("reports").select("id, title, description, ai_summary, company_id").eq("id", report_id).single();
    if (error) throw error;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const text = [report.title, report.ai_summary, report.description].filter(Boolean).join("\n\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const body = await aiRes.text();
      console.error("AI classify error", aiRes.status, body);
      throw new Error(`AI ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    let parsed: any = {};
    try { parsed = JSON.parse(aiData.choices?.[0]?.message?.content || "{}"); } catch {}
    const classification = ["4A_sst", "4B_out_of_scope", "4C_mixed", "4D_grave_immediate"].includes(parsed.classification)
      ? parsed.classification : "4A_sst";

    await supabase.from("reports").update({
      ai_classification: classification,
      ai_classification_rationale: parsed.rationale || null,
    }).eq("id", report_id);

    // 4D -> escala imediatamente
    if (classification === "4D_grave_immediate") {
      supabase.functions.invoke("escalate-report", { body: { report_id } }).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true, classification, rationale: parsed.rationale }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("classify-report-ai error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
