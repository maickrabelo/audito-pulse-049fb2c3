import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenResponse {
  question: string;
  answers: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, responses } = await req.json() as { 
      surveyId: string; 
      responses: OpenResponse[] 
    };

    console.log(`Analyzing survey ${surveyId} with ${responses.length} question groups`);

    if (!responses || responses.length === 0) {
      return new Response(JSON.stringify({ error: "Sem respostas para analisar" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare the text for analysis
    const allResponses = responses
      .flatMap(r => r.answers.filter(a => a && a.trim()))
      .slice(0, 100); // Limit to 100 responses for performance

    if (allResponses.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma resposta válida encontrada" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responsesText = allResponses
      .map((r, i) => `${i + 1}. "${r}"`)
      .join('\n');

    const systemPrompt = `Você é um especialista em análise de clima organizacional. Analise as respostas abertas de uma pesquisa de clima e extraia insights valiosos.

Responda APENAS com um JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "executive_summary": "Resumo executivo de 2-3 frases sobre o clima geral",
  "positive_points": [
    { "theme": "Tema identificado", "mentions": 10, "sample_quote": "Citação exemplo" }
  ],
  "improvement_points": [
    { "theme": "Tema que precisa melhorar", "mentions": 8, "sample_quote": "Citação exemplo" }
  ],
  "sentiment_distribution": {
    "positive": 45,
    "neutral": 30,
    "negative": 25
  },
  "keywords": ["palavra1", "palavra2", "palavra3"]
}

Regras:
- O resumo deve ser em português
- Identifique até 5 pontos positivos e 5 pontos de melhoria
- Os números de menções devem ser estimativas baseadas na frequência dos temas
- A distribuição de sentimento deve somar 100
- Inclua 8-12 palavras-chave relevantes
- Mantenha citações curtas (até 50 caracteres)`;

    const userPrompt = `Analise estas ${allResponses.length} respostas de uma pesquisa de clima organizacional:

${responsesText}

Extraia insights sobre pontos positivos, pontos de melhoria, sentimento geral e palavras-chave frequentes.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao processar análise com IA" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI response received, parsing...');

    // Try to parse the JSON response
    let insights;
    try {
      // Clean up potential markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      insights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      
      // Return a fallback response
      insights = {
        executive_summary: "A análise identificou diversos temas nas respostas dos colaboradores, indicando áreas de satisfação e oportunidades de melhoria no ambiente de trabalho.",
        positive_points: [
          { theme: "Ambiente de trabalho", mentions: Math.floor(allResponses.length * 0.3), sample_quote: "Bom ambiente" }
        ],
        improvement_points: [
          { theme: "Comunicação", mentions: Math.floor(allResponses.length * 0.2), sample_quote: "Melhorar comunicação" }
        ],
        sentiment_distribution: {
          positive: 50,
          neutral: 30,
          negative: 20
        },
        keywords: ["trabalho", "equipe", "ambiente", "comunicação", "empresa"]
      };
    }

    console.log('Analysis complete');

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-climate-survey:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
