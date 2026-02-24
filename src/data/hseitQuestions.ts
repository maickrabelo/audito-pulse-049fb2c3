// HSE-IT (Health and Safety Executive - Indicator Tool)
// Questionário de Avaliação de Riscos Psicossociais
// 35 questões divididas em 7 categorias

export interface HSEITQuestion {
  number: number;
  text: string;
  category: HSEITCategory;
  isInverted: boolean; // Se true, 5 = Ruim, então calcular 6 - valor
}

export type HSEITCategory = 
  | 'demands'        // Demandas
  | 'control'        // Controle
  | 'managerSupport' // Apoio da Chefia
  | 'peerSupport'    // Apoio dos Colegas
  | 'relationships'  // Relacionamentos
  | 'role'           // Papel/Cargo
  | 'change';        // Mudanças

export const HSEIT_CATEGORY_LABELS: Record<HSEITCategory, string> = {
  demands: 'Demandas',
  control: 'Controle',
  managerSupport: 'Apoio da Chefia',
  peerSupport: 'Apoio dos Colegas',
  relationships: 'Relacionamentos',
  role: 'Papel/Cargo',
  change: 'Mudanças'
};

export const HSEIT_CATEGORY_COLORS: Record<HSEITCategory, string> = {
  demands: '#ef4444',       // red
  control: '#3b82f6',       // blue
  managerSupport: '#22c55e', // green
  peerSupport: '#a855f7',    // purple
  relationships: '#f97316',  // orange
  role: '#06b6d4',          // cyan
  change: '#eab308'          // yellow
};

// Escala Likert
export const HSEIT_LIKERT_OPTIONS = [
  { value: 1, label: 'Nunca' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'Às vezes' },
  { value: 4, label: 'Frequentemente' },
  { value: 5, label: 'Sempre' }
];

// 35 Questões HSE-IT baseadas no arquivo Excel fornecido
export const HSEIT_QUESTIONS: HSEITQuestion[] = [
  // Cargo (Role) - Questões 1, 4, 11, 13, 17
  { number: 1, text: 'Eu tenho clareza sobre o que é esperado de mim no trabalho', category: 'role', isInverted: false },
  { number: 4, text: 'Eu sei como fazer o meu trabalho', category: 'role', isInverted: false },
  { number: 11, text: 'Eu tenho clareza sobre meus deveres e responsabilidades', category: 'role', isInverted: false },
  { number: 13, text: 'Eu tenho clareza sobre os objetivos e metas do meu setor', category: 'role', isInverted: false },
  { number: 17, text: 'Eu entendo como meu trabalho se encaixa nos objetivos gerais da organização', category: 'role', isInverted: false },
  
  // Controle (Control) - Questões 2, 10, 15, 19, 25, 30
  { number: 2, text: 'Eu posso decidir quando fazer uma pausa', category: 'control', isInverted: false },
  { number: 10, text: 'Eu tenho voz sobre a velocidade do meu trabalho', category: 'control', isInverted: false },
  { number: 15, text: 'Eu tenho autonomia sobre como fazer meu trabalho', category: 'control', isInverted: false },
  { number: 19, text: 'Eu tenho oportunidade de decidir sobre O QUE fazer no meu trabalho', category: 'control', isInverted: false },
  { number: 25, text: 'Eu tenho oportunidade de decidir sobre COMO organizar meu trabalho', category: 'control', isInverted: false },
  { number: 30, text: 'Meus horários de trabalho podem ser flexíveis', category: 'control', isInverted: false },
  
  // Demandas (Demands) - Questões 3, 6, 9, 12, 16, 18, 20, 22
  { number: 3, text: 'Diferentes grupos no trabalho exigem coisas de mim que são difíceis de combinar', category: 'demands', isInverted: true },
  { number: 6, text: 'Eu tenho prazos inalcançáveis', category: 'demands', isInverted: true },
  { number: 9, text: 'Eu tenho que trabalhar muito intensamente', category: 'demands', isInverted: true },
  { number: 12, text: 'Eu tenho que negligenciar algumas tarefas porque tenho muito o que fazer', category: 'demands', isInverted: true },
  { number: 16, text: 'Eu não consigo fazer pausas suficientes', category: 'demands', isInverted: true },
  { number: 18, text: 'Eu sou pressionado a trabalhar longas horas', category: 'demands', isInverted: true },
  { number: 20, text: 'Eu tenho que trabalhar muito rápido', category: 'demands', isInverted: true },
  { number: 22, text: 'Eu tenho pressões de tempo irrealistas', category: 'demands', isInverted: true },
  
  // Relacionamentos (Relationships) - Questões 5, 14, 21, 34
  { number: 5, text: 'Eu sou alvo de assédio pessoal na forma de palavras ou comportamentos ofensivos', category: 'relationships', isInverted: true },
  { number: 14, text: 'Existem atritos ou conflitos entre colegas', category: 'relationships', isInverted: true },
  { number: 21, text: 'Eu sou alvo de bullying no trabalho', category: 'relationships', isInverted: true },
  { number: 34, text: 'Os relacionamentos no trabalho são tensos', category: 'relationships', isInverted: true },
  
  // Apoio dos Colegas (Peer Support) - Questões 7, 24, 27, 31
  { number: 7, text: 'Eu recebo ajuda e apoio de que preciso dos colegas', category: 'peerSupport', isInverted: false },
  { number: 24, text: 'Meus colegas estão dispostos a ouvir meus problemas relacionados ao trabalho', category: 'peerSupport', isInverted: false },
  { number: 27, text: 'Quando o trabalho fica difícil, meus colegas me ajudam', category: 'peerSupport', isInverted: false },
  { number: 31, text: 'Eu recebo o respeito no trabalho que mereço dos meus colegas', category: 'peerSupport', isInverted: false },
  
  // Apoio da Chefia (Manager Support) - Questões 8, 23, 29, 33, 35
  { number: 8, text: 'Eu recebo apoio da minha chefia/gestor quando preciso', category: 'managerSupport', isInverted: false },
  { number: 23, text: 'Eu posso contar com meu gestor para me ajudar com um problema de trabalho', category: 'managerSupport', isInverted: false },
  { number: 29, text: 'Meu gestor me dá feedback construtivo sobre meu trabalho', category: 'managerSupport', isInverted: false },
  { number: 33, text: 'Eu sou apoiado em trabalhos emocionalmente desafiadores', category: 'managerSupport', isInverted: false },
  { number: 35, text: 'Minha chefia me encoraja no trabalho', category: 'managerSupport', isInverted: false },
  
  // Mudanças (Change) - Questões 26, 28, 32
  { number: 26, text: 'Eu tenho tempo suficiente para entender as mudanças no trabalho', category: 'change', isInverted: false },
  { number: 28, text: 'Mudanças na forma de trabalhar são discutidas com a equipe', category: 'change', isInverted: false },
  { number: 32, text: 'Quando há mudanças no trabalho, está claro como elas vão funcionar na prática', category: 'change', isInverted: false },
];

// Ordenar questões por número
export const HSEIT_QUESTIONS_SORTED = [...HSEIT_QUESTIONS].sort((a, b) => a.number - b.number);

// Obter questões por categoria
export const getQuestionsByCategory = (category: HSEITCategory): HSEITQuestion[] => {
  return HSEIT_QUESTIONS.filter(q => q.category === category);
};

// Limiares de classificação de risco (baseado no Excel)
export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  very_low: 'Muito Baixo',
  low: 'Baixo',
  moderate: 'Moderado',
  high: 'Alto',
  very_high: 'Muito Alto'
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  very_low: '#22c55e',  // green
  low: '#84cc16',       // lime
  moderate: '#eab308',  // yellow
  high: '#f97316',      // orange
  very_high: '#ef4444'  // red
};

// Classificação de nível de risco baseada na média
// Para questões POSITIVAS (não invertidas): maior = melhor
// Para questões NEGATIVAS (invertidas): após conversão, maior = melhor também
export function getRiskLevel(score: number): RiskLevel {
  // Score já deve estar normalizado (1-5 onde 5 é favorável)
  if (score >= 4.21) return 'very_low';   // Muito favorável = risco muito baixo
  if (score >= 3.41) return 'low';        // Favorável = risco baixo
  if (score >= 2.61) return 'moderate';   // Intermediário = risco moderado
  if (score >= 1.81) return 'high';       // Desfavorável = risco alto
  return 'very_high';                      // Muito desfavorável = risco muito alto
}

// Impacto para saúde (Semáforo)
export type HealthImpact = 'favorable' | 'intermediate' | 'risk';

export const HEALTH_IMPACT_LABELS: Record<HealthImpact, string> = {
  favorable: 'Favorável',
  intermediate: 'Intermediário',
  risk: 'Risco'
};

export const HEALTH_IMPACT_COLORS: Record<HealthImpact, string> = {
  favorable: '#22c55e',   // Verde
  intermediate: '#f97316', // Laranja
  risk: '#ef4444'          // Vermelho
};

export function getHealthImpact(score: number): HealthImpact {
  if (score >= 3.67) return 'favorable';      // Verde
  if (score >= 2.33) return 'intermediate';   // Laranja
  return 'risk';                               // Vermelho
}

// Calcular score normalizado para uma resposta
// Para questões invertidas, inverte o valor para que 5 seja sempre favorável
export function normalizeScore(value: number, isInverted: boolean): number {
  return isInverted ? (6 - value) : value;
}

// Calcular média de uma categoria
export function calculateCategoryAverage(
  answers: { questionNumber: number; value: number }[],
  category: HSEITCategory
): number {
  const categoryQuestions = getQuestionsByCategory(category);
  const questionNumbers = categoryQuestions.map(q => q.number);
  
  const categoryAnswers = answers.filter(a => questionNumbers.includes(a.questionNumber));
  
  if (categoryAnswers.length === 0) return 0;
  
  const total = categoryAnswers.reduce((sum, answer) => {
    const question = categoryQuestions.find(q => q.number === answer.questionNumber);
    if (!question) return sum;
    return sum + normalizeScore(answer.value, question.isInverted);
  }, 0);
  
  return total / categoryAnswers.length;
}

// Calcular média geral
export function calculateOverallAverage(
  answers: { questionNumber: number; value: number }[]
): number {
  if (answers.length === 0) return 0;
  
  const total = answers.reduce((sum, answer) => {
    const question = HSEIT_QUESTIONS.find(q => q.number === answer.questionNumber);
    if (!question) return sum;
    return sum + normalizeScore(answer.value, question.isInverted);
  }, 0);
  
  return total / answers.length;
}
