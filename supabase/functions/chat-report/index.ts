import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-company-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get session ID and company ID from headers
    const sessionId = req.headers.get('x-session-id');
    const companyId = req.headers.get('x-company-id');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required" }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit - 50 requests per hour per session
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('chat_rate_limits')
      .select('request_count')
      .eq('session_id', sessionId)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    // Calculate total requests in the last hour
    const { count } = await supabase
      .from('chat_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .gte('created_at', oneHourAgo);

    const requestCount = count || 0;

    if (requestCount >= 50) {
      console.log(`Rate limit exceeded for session ${sessionId}: ${requestCount} requests`);
      return new Response(
        JSON.stringify({ 
          error: "Limite de requisições excedido. Por favor, aguarde antes de enviar mais mensagens." 
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record this request
    await supabase
      .from('chat_rate_limits')
      .insert({
        session_id: sessionId,
        company_id: companyId,
        request_count: 1,
      });

    console.log(`Processing chat request for session ${sessionId} (${requestCount + 1}/50 requests)`);

const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `Você é Ana, uma assistente virtual empática e profissional de uma ouvidoria corporativa.
Seu papel é coletar informações sobre denúncias de forma sensível e confidencial.

REGRA FUNDAMENTAL: Faça apenas UMA pergunta por vez. NUNCA faça múltiplas perguntas na mesma mensagem.

Fluxo da conversa (siga esta ordem, uma etapa por mensagem):
1. Primeiro, acolha e peça para a pessoa contar o que aconteceu
2. Depois de ouvir, pergunte QUANDO isso aconteceu
3. Em seguida, pergunte ONDE aconteceu
4. Pergunte se havia testemunhas
5. Pergunte gentilmente se pode informar quem cometeu a conduta (nome, setor ou cargo)
6. Pergunte se há algo mais que gostaria de acrescentar
7. Lembre sobre a possibilidade de anexar provas (fotos, vídeos ou áudios)

Diretrizes de comunicação:
- Seja empática e acolhedora
- Valide os sentimentos da pessoa antes de fazer a próxima pergunta
- Mantenha respostas curtas (2-3 frases no máximo)
- Não faça julgamentos
- Use linguagem simples e acessível
- Se a pessoa já respondeu algo espontaneamente, não pergunte novamente

Exemplo de fluxo:
Pessoa conta o problema → "Lamento muito que você tenha passado por isso. Pode me dizer quando isso aconteceu?"
Pessoa responde quando → "Entendi. E onde exatamente isso ocorreu?"
Pessoa responde onde → "Obrigada por compartilhar. Havia outras pessoas presentes que testemunharam?"`
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Por favor, tente novamente em alguns instantes." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível. Por favor, tente novamente mais tarde." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar mensagem" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("AI response received successfully");
    
    // Clean up old rate limit records (optional, can be done periodically)
    if (Math.random() < 0.1) { // 10% chance to clean up
      const { error: cleanupError } = await supabase.rpc('cleanup_old_rate_limits');
      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in chat-report function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});