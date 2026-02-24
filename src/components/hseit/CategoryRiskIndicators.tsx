import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import {
  HSEITCategory,
  HSEIT_CATEGORY_LABELS,
  getRiskLevel,
  getHealthImpact,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  HEALTH_IMPACT_LABELS,
  HEALTH_IMPACT_COLORS,
  HealthImpact,
  RiskLevel
} from '@/data/hseitQuestions';

interface CategoryRiskIndicatorsProps {
  categoryAverages: Record<string, number>;
}

// Recomendações automáticas baseadas na categoria e nível de risco
const CATEGORY_RECOMMENDATIONS: Record<HSEITCategory, Record<'risk' | 'intermediate' | 'favorable', string>> = {
  demands: {
    risk: 'CRÍTICO: Redistribuir carga de trabalho, revisar prazos, contratar pessoal adicional. Implementar gestão de prioridades e avaliar volume de tarefas por colaborador.',
    intermediate: 'ATENÇÃO: Monitorar prazos e volume de trabalho. Promover pausas regulares e avaliar redistribuição de tarefas nos períodos de pico.',
    favorable: 'MANTER: Carga de trabalho adequada. Continuar monitorando para manter equilíbrio.'
  },
  control: {
    risk: 'CRÍTICO: Aumentar autonomia dos colaboradores, implementar flexibilidade de horários. Revisar processos para dar mais controle sobre ritmo e método de trabalho.',
    intermediate: 'ATENÇÃO: Avaliar oportunidades de maior autonomia. Considerar horários flexíveis e participação em decisões sobre processos.',
    favorable: 'MANTER: Bom nível de autonomia. Continuar promovendo participação nas decisões.'
  },
  managerSupport: {
    risk: 'CRÍTICO: Treinar gestores em liderança e comunicação. Implementar reuniões regulares 1:1, criar canais de feedback e suporte emocional.',
    intermediate: 'ATENÇÃO: Fortalecer comunicação gestor-equipe. Aumentar frequência de feedbacks e disponibilidade para suporte.',
    favorable: 'MANTER: Gestão eficaz. Continuar práticas de apoio e reconhecimento.'
  },
  peerSupport: {
    risk: 'CRÍTICO: Promover integração da equipe, atividades de team building. Criar cultura de colaboração e apoio mútuo entre colegas.',
    intermediate: 'ATENÇÃO: Incentivar trabalho colaborativo. Promover momentos de interação e apoio entre pares.',
    favorable: 'MANTER: Bom clima entre colegas. Continuar fomentando colaboração.'
  },
  relationships: {
    risk: 'CRÍTICO: Investigar conflitos, implementar política anti-assédio. Mediar conflitos existentes e criar canais seguros de denúncia.',
    intermediate: 'ATENÇÃO: Monitorar relacionamentos. Promover respeito mútuo e comunicação não-violenta.',
    favorable: 'MANTER: Ambiente respeitoso. Continuar políticas de convivência saudável.'
  },
  role: {
    risk: 'CRÍTICO: Clarificar descrições de cargo, definir objetivos claros. Alinhar expectativas e comunicar metas departamentais.',
    intermediate: 'ATENÇÃO: Revisar clareza de papéis. Garantir que todos entendam suas responsabilidades e objetivos.',
    favorable: 'MANTER: Papéis bem definidos. Continuar comunicação clara sobre expectativas.'
  },
  change: {
    risk: 'CRÍTICO: Melhorar comunicação sobre mudanças, envolver equipe no planejamento. Dar tempo para adaptação e explicar impactos claramente.',
    intermediate: 'ATENÇÃO: Aprimorar gestão de mudanças. Comunicar antecipadamente e ouvir preocupações da equipe.',
    favorable: 'MANTER: Boa gestão de mudanças. Continuar envolvendo equipe nos processos.'
  }
};

const getCategoryIcon = (category: HSEITCategory) => {
  switch (category) {
    case 'demands': return '⚡';
    case 'control': return '🎮';
    case 'managerSupport': return '👔';
    case 'peerSupport': return '🤝';
    case 'relationships': return '💬';
    case 'role': return '🎯';
    case 'change': return '🔄';
    default: return '📊';
  }
};

const getTrafficLightIcon = (impact: HealthImpact) => {
  switch (impact) {
    case 'favorable': return <CheckCircle2 className="h-5 w-5" />;
    case 'intermediate': return <AlertCircle className="h-5 w-5" />;
    case 'risk': return <AlertTriangle className="h-5 w-5" />;
  }
};

const getTrendIcon = (impact: HealthImpact) => {
  switch (impact) {
    case 'favorable': return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'intermediate': return <Minus className="h-4 w-4 text-orange-500" />;
    case 'risk': return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
};

export function CategoryRiskIndicators({ categoryAverages }: CategoryRiskIndicatorsProps) {
  const categories: HSEITCategory[] = ['demands', 'control', 'managerSupport', 'peerSupport', 'relationships', 'role', 'change'];

  // Ordenar por nível de risco (mais crítico primeiro)
  const sortedCategories = [...categories].sort((a, b) => {
    const avgA = categoryAverages[a] || 0;
    const avgB = categoryAverages[b] || 0;
    return avgA - avgB; // Menor média = maior risco
  });

  const criticalCategories = sortedCategories.filter(cat => {
    const impact = getHealthImpact(categoryAverages[cat] || 0);
    return impact === 'risk';
  });

  const intermediateCategories = sortedCategories.filter(cat => {
    const impact = getHealthImpact(categoryAverages[cat] || 0);
    return impact === 'intermediate';
  });

  const favorableCategories = sortedCategories.filter(cat => {
    const impact = getHealthImpact(categoryAverages[cat] || 0);
    return impact === 'favorable';
  });

  return (
    <div className="space-y-6">
      {/* Semáforo Visual - Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚦</span>
            Semáforo de Riscos Psicossociais
          </CardTitle>
          <CardDescription>
            Visão geral do nível de risco por categoria com recomendações automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Crítico */}
            <div className="p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-red-700 dark:text-red-400">Crítico</span>
                <Badge variant="destructive" className="ml-auto">{criticalCategories.length}</Badge>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                Requer ação imediata
              </p>
            </div>

            {/* Intermediário */}
            <div className="p-4 rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="font-semibold text-orange-700 dark:text-orange-400">Atenção</span>
                <Badge className="ml-auto bg-orange-500">{intermediateCategories.length}</Badge>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Monitorar e planejar ações
              </p>
            </div>

            {/* Favorável */}
            <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="font-semibold text-green-700 dark:text-green-400">Favorável</span>
                <Badge className="ml-auto bg-green-500">{favorableCategories.length}</Badge>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Manter práticas atuais
              </p>
            </div>
          </div>

          {/* Lista de Categorias com Indicadores */}
          <div className="space-y-3">
            {sortedCategories.map(category => {
              const avg = categoryAverages[category] || 0;
              const impact = getHealthImpact(avg);
              const riskLevel = getRiskLevel(avg);
              const recommendation = CATEGORY_RECOMMENDATIONS[category][impact];

              return (
                <div
                  key={category}
                  className="p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{
                    borderColor: HEALTH_IMPACT_COLORS[impact],
                    backgroundColor: `${HEALTH_IMPACT_COLORS[impact]}10`
                  }}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Indicador Visual */}
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full text-white shrink-0"
                      style={{ backgroundColor: HEALTH_IMPACT_COLORS[impact] }}
                    >
                      {getTrafficLightIcon(impact)}
                    </div>

                    {/* Informações da Categoria */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <h4 className="font-semibold text-foreground">
                          {HSEIT_CATEGORY_LABELS[category]}
                        </h4>
                        {getTrendIcon(impact)}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold" style={{ color: HEALTH_IMPACT_COLORS[impact] }}>
                          {avg.toFixed(2)}
                        </span>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: RISK_LEVEL_COLORS[riskLevel],
                            color: RISK_LEVEL_COLORS[riskLevel]
                          }}
                        >
                          {RISK_LEVEL_LABELS[riskLevel]}
                        </Badge>
                        <Badge
                          style={{
                            backgroundColor: `${HEALTH_IMPACT_COLORS[impact]}20`,
                            color: HEALTH_IMPACT_COLORS[impact],
                            borderColor: HEALTH_IMPACT_COLORS[impact]
                          }}
                          variant="outline"
                        >
                          {HEALTH_IMPACT_LABELS[impact]}
                        </Badge>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(avg / 5) * 100}%`,
                            backgroundColor: HEALTH_IMPACT_COLORS[impact]
                          }}
                        />
                      </div>

                      {/* Recomendação */}
                      <div className="flex items-start gap-2 p-3 rounded-md bg-background/50">
                        <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: HEALTH_IMPACT_COLORS[impact] }} />
                        <p className="text-sm text-muted-foreground">
                          {recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CategoryRiskIndicators;
