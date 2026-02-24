import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface AIInsights {
  executive_summary: string;
  positive_points: { theme: string; mentions: number; sample_quote?: string }[];
  improvement_points: { theme: string; mentions: number; sample_quote?: string }[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keywords: string[];
}

interface AIInsightsCardProps {
  surveyId: string;
  openResponses?: { question: string; answers: string[] }[];
}

const SENTIMENT_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  surveyId,
  openResponses = []
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeResponses = async () => {
    if (openResponses.length === 0 || openResponses.every(r => r.answers.length === 0)) {
      toast({
        title: "Sem dados para análise",
        description: "Não há respostas abertas suficientes para gerar insights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-climate-survey', {
        body: {
          surveyId,
          responses: openResponses
        }
      });

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setInsights(data);
      toast({
        title: "Análise concluída",
        description: "Os insights da IA foram gerados com sucesso!"
      });
    } catch (err) {
      console.error('Error analyzing responses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Erro na análise",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sentimentData = insights ? [
    { name: 'Positivo', value: insights.sentiment_distribution.positive, color: '#22c55e' },
    { name: 'Neutro', value: insights.sentiment_distribution.neutral, color: '#f59e0b' },
    { name: 'Negativo', value: insights.sentiment_distribution.negative, color: '#ef4444' }
  ] : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights da IA
            </CardTitle>
            <CardDescription>
              Análise de sentimento das respostas abertas
            </CardDescription>
          </div>
          <Button
            onClick={analyzeResponses}
            disabled={isLoading}
            variant={insights ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : insights ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reanalisar
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!insights && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Clique em "Gerar Insights" para analisar as respostas abertas</p>
            <p className="text-sm mt-1">A IA irá identificar temas e sentimentos nas respostas</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analisando respostas com IA...</p>
            <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2 text-foreground">Resumo Executivo</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insights.executive_summary}
              </p>
            </div>

            {/* Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Points */}
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <ThumbsUp className="h-4 w-4" />
                  Pontos Positivos
                </h4>
                <ul className="space-y-2">
                  {insights.positive_points.slice(0, 5).map((point, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">{point.theme}</span>
                        <Badge variant="secondary" className="text-xs">
                          {point.mentions} menções
                        </Badge>
                      </div>
                      {point.sample_quote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{point.sample_quote}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvement Points */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <ThumbsDown className="h-4 w-4" />
                  Pontos de Melhoria
                </h4>
                <ul className="space-y-2">
                  {insights.improvement_points.slice(0, 5).map((point, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">{point.theme}</span>
                        <Badge variant="secondary" className="text-xs">
                          {point.mentions} menções
                        </Badge>
                      </div>
                      {point.sample_quote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{point.sample_quote}"
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sentiment Distribution Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Distribuição de Sentimento</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Palavras-Chave</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
