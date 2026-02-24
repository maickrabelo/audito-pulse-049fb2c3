import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();
    
    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id é obrigatório" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar denúncias dos últimos 60 dias
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: reports, error } = await supabase
      .from('reports')
      .select('category, department, status, urgency, created_at, ai_summary')
      .eq('company_id', company_id)
      .gte('created_at', sixtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    if (!reports || reports.length === 0) {
      return new Response(
        JSON.stringify({
          insights: [
            {
              title: "Sem dados suficientes",
              category: "Geral",
              priority: "low",
              description: "Não há denúncias recentes suficientes para gerar análises estratégicas. Continue monitorando o sistema."
            }
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preparar dados para análise
    const categoryCount: { [key: string]: number } = {};
    const departmentCount: { [key: string]: number } = {};
    const statusCount: { [key: string]: number } = {};
    const urgencyCount: { [key: string]: number } = {};

    reports.forEach(report => {
      categoryCount[report.category || 'Outros'] = (categoryCount[report.category || 'Outros'] || 0) + 1;
      if (report.department) {
        departmentCount[report.department] = (departmentCount[report.department] || 0) + 1;
      }
      statusCount[report.status] = (statusCount[report.status] || 0) + 1;
      urgencyCount[report.urgency] = (urgencyCount[report.urgency] || 0) + 1;
    });

    const analysisData = {
      total_reports: reports.length,
      categories: categoryCount,
      departments: departmentCount,
      status_distribution: statusCount,
      urgency_distribution: urgencyCount,
      recent_summaries: reports.slice(0, 5).map(r => r.ai_summary || r.category).join('; ')
    };

    console.log('Analyzing reports with Lovable AI:', analysisData);

    // Chamar Lovable AI para análise
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um analista estratégico de compliance e recursos humanos. Analise os dados e identifique APENAS insights realmente críticos e importantes para tomada de decisão. Gere entre 1 e 3 insights, mas somente se forem informações estratégicas relevantes. Não force insights genéricos. IMPORTANTE: NUNCA critique a falta de informações nas denúncias, problemas no formulário ou no canal de denúncias - você está analisando PARA o próprio canal. Foque exclusivamente em padrões comportamentais, riscos organizacionais e ações estratégicas."
          },
          {
            role: "user",
            content: `Analise os dados de denúncias e identifique APENAS os insights mais críticos e estratégicos.

IMPORTANTE: Gere entre 1 e 3 insights, mas SOMENTE se forem informações realmente importantes.
Não force insights genéricos ou óbvios. Seja seletivo e estratégico.

RESTRIÇÕES CRÍTICAS:
- NUNCA critique a falta de detalhes nas denúncias
- NUNCA sugira melhorias no formulário ou canal de denúncias
- NUNCA mencione problemas de coleta de dados ou informações incompletas
- Foque APENAS em padrões comportamentais e riscos organizacionais dos DADOS EXISTENTES

Dados:
- Total de denúncias: ${analysisData.total_reports}
- Categorias: ${JSON.stringify(analysisData.categories)}
- Departamentos: ${JSON.stringify(analysisData.departments)}
- Status: ${JSON.stringify(analysisData.status_distribution)}
- Urgência: ${JSON.stringify(analysisData.urgency_distribution)}
- Resumos recentes: ${analysisData.recent_summaries}

Foque em:
- Padrões graves ou recorrentes que exigem ação imediata
- Riscos significativos (legal, reputacional, operacional)
- Tendências preocupantes que podem escalar
- Recomendações acionáveis com impacto real na cultura organizacional

Para cada insight:
- Título: Claro e direto (máximo 60 caracteres)
- Categoria: Tipo de denúncia ou departamento
- Prioridade: high, medium ou low
- Descrição: Detalhada com dados concretos e recomendações práticas (máximo 300 caracteres)`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Gera entre 1 e 3 insights estratégicos, apenas se forem realmente importantes",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        title: { 
                          type: "string",
                          description: "Título curto e impactante do insight"
                        },
                        category: { 
                          type: "string",
                          description: "Categoria ou departamento relacionado"
                        },
                        priority: { 
                          type: "string",
                          enum: ["high", "medium", "low"],
                          description: "Nível de prioridade"
                        },
                        description: { 
                          type: "string",
                          description: "Descrição detalhada com recomendação estratégica"
                        }
                      },
                      required: ["title", "category", "priority", "description"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    // Extrair insights da resposta
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let insights;

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      insights = parsed.insights;
    } else {
      // Fallback para insights básicos
      insights = [
        {
          title: "Análise pendente",
          category: "Geral",
          priority: "medium",
          description: "Sistema de análise de IA está sendo inicializado. Tente novamente em alguns momentos."
        }
      ];
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in analyze-reports:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao processar análise",
        insights: [
          {
            title: "Erro na análise",
            category: "Sistema",
            priority: "low",
            description: "Não foi possível gerar insights automáticos no momento. Verifique os dados manualmente."
          }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});