
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";

const AIAnalysisCard = () => {
  const { profile } = useRealAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  
  useEffect(() => {
    if (profile?.company_id) {
      loadAnalysis();
    }
  }, [profile?.company_id]);
  
  const loadAnalysis = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-reports', {
        body: { company_id: profile.company_id }
      });

      if (error) {
        console.error('Error calling analyze-reports:', error);
        throw error;
      }

      if (data?.insights) {
        const formattedInsights = data.insights.map((insight: any, index: number) => ({
          id: index + 1,
          category: insight.category,
          alert: insight.priority === 'high' ? 'Alto' : insight.priority === 'medium' ? 'Médio' : 'Baixo',
          trend: insight.priority === 'high' ? 'crescente' : 'estável',
          message: `${insight.title}: ${insight.description}`
        }));
        
        setInsights(formattedInsights);
      } else {
        setInsights([{
          id: 1,
          category: 'Geral',
          alert: 'Baixo',
          trend: 'estável',
          message: 'Nenhuma análise disponível no momento.'
        }]);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setInsights([{
        id: 1,
        category: 'Erro',
        alert: 'Baixo',
        trend: 'estável',
        message: 'Não foi possível carregar a análise de IA. Tente novamente mais tarde.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAlertBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alto':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-300">Alto</Badge>;
      case 'médio':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">Médio</Badge>;
      case 'baixo':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Baixo</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === "crescente") {
      return <span className="text-red-500">↑</span>;
    } else if (trend === "decrescente") {
      return <span className="text-green-500">↓</span>;
    }
    return <span className="text-gray-500">→</span>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-audit-secondary" />
            <div>
              <CardTitle className="text-xl">Análise de IA</CardTitle>
              <CardDescription>
                {insights.length} {insights.length === 1 ? 'insight' : 'insights'} disponíveis
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnalysis} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-[150px] flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-audit-primary/50" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {insights.map((insight) => (
              <AccordionItem 
                key={insight.id} 
                value={`item-${insight.id}`}
                className="border rounded-lg bg-muted/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-col items-start gap-2 flex-1 text-left">
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge variant="outline" className="bg-background">
                        {insight.category}
                      </Badge>
                      {getAlertBadge(insight.alert)}
                    </div>
                    <p className="text-sm font-medium line-clamp-2">
                      {insight.message}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Tendência:</span>
                      {getTrendIcon(insight.trend)}
                      <span>{insight.trend}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.message}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
