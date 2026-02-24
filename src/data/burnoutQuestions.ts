// Burnout Assessment Questions based on LBQ and MBI
// Categories: Exaustão (5), Despersonalização (7), Desmotivação (8)

export type BurnoutCategory = 'exaustao' | 'despersonalizacao' | 'desmotivacao';

export interface BurnoutQuestion {
  number: number;
  text: string;
  category: BurnoutCategory;
}

export const BURNOUT_CATEGORY_LABELS: Record<BurnoutCategory, string> = {
  exaustao: 'Exaustão',
  despersonalizacao: 'Despersonalização',
  desmotivacao: 'Desmotivação'
};

export const BURNOUT_CATEGORY_COLORS: Record<BurnoutCategory, string> = {
  exaustao: '#ef4444', // red
  despersonalizacao: '#f59e0b', // amber
  desmotivacao: '#6366f1' // indigo
};

export const BURNOUT_LIKERT_OPTIONS = [
  { value: 1, label: 'Nunca' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'Uma ou mais vezes por mês' },
  { value: 4, label: 'Mais ou menos toda semana' },
  { value: 5, label: 'Várias vezes por semana' },
  { value: 6, label: 'Todos os dias' }
];

export const BURNOUT_QUESTIONS: BurnoutQuestion[] = [
  // Exaustão (5 questões)
  { number: 1, text: 'Sinto-me esgotado emocionalmente em relação ao meu trabalho', category: 'exaustao' },
  { number: 2, text: 'Sinto-me excessivamente exausto no fim do dia de trabalho', category: 'exaustao' },
  { number: 3, text: 'Levanto cansado e sem disposição para trabalhar', category: 'exaustao' },
  { number: 4, text: 'Desprendo muita energia para realizar as atividades de trabalho', category: 'exaustao' },
  { number: 5, text: 'Não tenho forças para ter resultados significantes', category: 'exaustao' },
  
  // Despersonalização (7 questões)
  { number: 6, text: 'Sinto que devo ser uma referência para as pessoas com quem trabalho', category: 'despersonalizacao' },
  { number: 7, text: 'Trato algumas pessoas do trabalho como se fossem minha família', category: 'despersonalizacao' },
  { number: 8, text: 'Me envolvo com facilidade nos problemas das outras pessoas', category: 'despersonalizacao' },
  { number: 9, text: 'Acredito que poderia fazer mais pelas pessoas que eu trabalho/oriento/atendo', category: 'despersonalizacao' },
  { number: 10, text: 'Tenho me sentido mais estressado com as pessoas que trabalho/oriento/atendo', category: 'despersonalizacao' },
  { number: 11, text: 'Me sinto responsável pelos problemas das pessoas que trabalho/oriento/atendo', category: 'despersonalizacao' },
  { number: 12, text: 'Sinto que as pessoas me culpam pelos seus problemas', category: 'despersonalizacao' },
  
  // Desmotivação (8 questões)
  { number: 13, text: 'Sinto-me desmotivado para trabalhar', category: 'desmotivacao' },
  { number: 14, text: 'Tenho pouca vitalidade, estou desanimado', category: 'desmotivacao' },
  { number: 15, text: 'Não me sinto realizado no meu trabalho', category: 'desmotivacao' },
  { number: 16, text: 'Não amo mais meu trabalho como antes', category: 'desmotivacao' },
  { number: 17, text: 'Não acredito mais no meu trabalho', category: 'desmotivacao' },
  { number: 18, text: 'Não acredito mais na profissão que eu atuo', category: 'desmotivacao' },
  { number: 19, text: 'Sinto que meu salário é desproporcional às funções que executo', category: 'desmotivacao' },
  { number: 20, text: 'Penso que meu trabalho não irá mudar, não importa o que eu faça', category: 'desmotivacao' }
];

export const BURNOUT_QUESTIONS_SORTED = [...BURNOUT_QUESTIONS].sort((a, b) => a.number - b.number);

export function getQuestionsByCategory(category: BurnoutCategory): BurnoutQuestion[] {
  return BURNOUT_QUESTIONS.filter(q => q.category === category);
}

// Risk Level Classification
export type BurnoutRiskLevel = 'sem_indicio' | 'risco_desenvolvimento' | 'fase_inicial' | 'condicao_estabelecida' | 'estagio_avancado';

export const BURNOUT_RISK_LABELS: Record<BurnoutRiskLevel, string> = {
  sem_indicio: 'Sem Indício',
  risco_desenvolvimento: 'Risco de Desenvolver',
  fase_inicial: 'Fase Inicial',
  condicao_estabelecida: 'Condição Estabelecida',
  estagio_avancado: 'Estágio Avançado'
};

export const BURNOUT_RISK_COLORS: Record<BurnoutRiskLevel, string> = {
  sem_indicio: '#22c55e', // green
  risco_desenvolvimento: '#eab308', // yellow
  fase_inicial: '#f97316', // orange
  condicao_estabelecida: '#ef4444', // red
  estagio_avancado: '#7f1d1d' // dark red
};

export const BURNOUT_RISK_RECOMMENDATIONS: Record<BurnoutRiskLevel, { conduta: string; acoes: string[] }> = {
  sem_indicio: {
    conduta: 'Não há necessidade de intervenção.',
    acoes: [
      'Manter ambiente de trabalho saudável',
      'Continuar monitoramento preventivo',
      'Promover cultura de bem-estar'
    ]
  },
  risco_desenvolvimento: {
    conduta: 'Oferecer medidas de prevenção.',
    acoes: [
      'Manutenção de uma rotina saudável',
      'Prática regular de exercícios físicos',
      'Técnicas de manejo do estresse',
      'Pausas regulares durante o trabalho',
      'Avaliação da carga de trabalho'
    ]
  },
  fase_inicial: {
    conduta: 'Oferecer medidas de prevenção de forma mais assertiva. Considerar modificação de tarefa ou de emprego.',
    acoes: [
      'Manutenção de uma rotina saudável',
      'Prática regular de exercícios físicos',
      'Manejo do estresse com técnicas específicas',
      'Considerar modificação de tarefa',
      'Avaliação do ambiente de trabalho',
      'Acompanhamento psicológico preventivo'
    ]
  },
  condicao_estabelecida: {
    conduta: 'Considerar tratamento com psicoterapia e técnicas de mindfulness. Considerar modificação de tarefa ou de emprego.',
    acoes: [
      'Encaminhamento para psicoterapia',
      'Técnicas de mindfulness',
      'Orientar medidas preventivas',
      'Considerar modificação de tarefa ou emprego',
      'Acompanhamento regular com profissional de saúde',
      'Avaliação de afastamento temporário se necessário'
    ]
  },
  estagio_avancado: {
    conduta: 'Considerar tratamento com psicoterapia e técnicas de mindfulness. Se houver pensamentos depressivos ou ansiosos em alta intensidade, considerar farmacoterapia específica. Sempre que possível, propor afastamento do trabalho até melhora.',
    acoes: [
      'Tratamento com psicoterapia urgente',
      'Técnicas de mindfulness',
      'Avaliação para farmacoterapia se necessário',
      'Propor afastamento do trabalho',
      'Acompanhamento multidisciplinar',
      'Reavaliação completa do posto de trabalho',
      'Suporte familiar e social'
    ]
  }
};

export function getBurnoutRiskLevel(totalScore: number): BurnoutRiskLevel {
  if (totalScore <= 20) return 'sem_indicio';
  if (totalScore <= 40) return 'risco_desenvolvimento';
  if (totalScore <= 60) return 'fase_inicial';
  if (totalScore <= 80) return 'condicao_estabelecida';
  return 'estagio_avancado';
}

export function calculateTotalScore(answers: { questionNumber: number; value: number }[]): number {
  return answers.reduce((sum, a) => sum + a.value, 0);
}

export function calculateCategoryScore(answers: { questionNumber: number; value: number }[], category: BurnoutCategory): number {
  const categoryQuestions = getQuestionsByCategory(category);
  const categoryAnswers = answers.filter(a => 
    categoryQuestions.some(q => q.number === a.questionNumber)
  );
  
  if (categoryAnswers.length === 0) return 0;
  
  const totalValue = categoryAnswers.reduce((sum, a) => sum + a.value, 0);
  return totalValue / categoryAnswers.length;
}

export function calculateCategoryPercentage(answers: { questionNumber: number; value: number }[], category: BurnoutCategory): number {
  const avgScore = calculateCategoryScore(answers, category);
  // Convert 1-6 scale to 0-100%
  return ((avgScore - 1) / 5) * 100;
}
