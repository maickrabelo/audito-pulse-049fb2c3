// GPTW Questions based on the standard questionnaire
export interface GPTWQuestion {
  id: string;
  text: string;
  category: string;
  type: 'likert' | 'scale_0_10' | 'open_text' | 'single_choice';
}

export const gptwCategories = [
  { id: 'credibilidade', name: 'Credibilidade', description: 'Comunicação, competência e integridade' },
  { id: 'respeito', name: 'Respeito', description: 'Apoio, colaboração e cuidado' },
  { id: 'imparcialidade', name: 'Imparcialidade', description: 'Equidade, justiça e ausência de favoritismo' },
  { id: 'orgulho', name: 'Orgulho', description: 'Trabalho, equipe e organização' },
  { id: 'camaradagem', name: 'Camaradagem', description: 'Intimidade, hospitalidade e comunidade' },
];

export const gptwQuestions: GPTWQuestion[] = [
  // Credibilidade - Comunicação
  { id: 'q1', text: 'Os gestores deixam claras suas expectativas', category: 'credibilidade', type: 'likert' },
  { id: 'q2', text: 'Posso fazer qualquer pergunta razoável aos gestores e obter respostas diretas', category: 'credibilidade', type: 'likert' },
  { id: 'q3', text: 'Os gestores me mantêm informado sobre assuntos importantes e sobre mudanças na empresa', category: 'credibilidade', type: 'likert' },
  { id: 'q4', text: 'É fácil se aproximar dos gestores e é também fácil falar com eles', category: 'credibilidade', type: 'likert' },
  
  // Credibilidade - Competência
  { id: 'q5', text: 'Os gestores têm uma visão clara de para onde estamos indo e como fazer para chegar lá', category: 'credibilidade', type: 'likert' },
  { id: 'q6', text: 'Os gestores sabem coordenar colaboradores e distribuir tarefas adequadamente', category: 'credibilidade', type: 'likert' },
  { id: 'q7', text: 'Os gestores são competentes para tocar o negócio', category: 'credibilidade', type: 'likert' },
  { id: 'q8', text: 'Os gestores contratam pessoas que se enquadram bem aqui', category: 'credibilidade', type: 'likert' },
  
  // Credibilidade - Integridade
  { id: 'q9', text: 'Os gestores cumprem o que prometem', category: 'credibilidade', type: 'likert' },
  { id: 'q10', text: 'Os gestores agem de acordo com o que falam', category: 'credibilidade', type: 'likert' },
  { id: 'q11', text: 'Os gestores são honestos e éticos na condução dos negócios', category: 'credibilidade', type: 'likert' },
  { id: 'q12', text: 'Acredito que os gestores só promoveriam reduções de quadro como último recurso', category: 'credibilidade', type: 'likert' },
  
  // Respeito - Apoio
  { id: 'q13', text: 'A empresa me oferece treinamento ou outras formas de desenvolvimento para o meu crescimento profissional', category: 'respeito', type: 'likert' },
  { id: 'q14', text: 'Eu recebo os equipamentos e recursos necessários para realizar meu trabalho', category: 'respeito', type: 'likert' },
  { id: 'q15', text: 'Os gestores agradecem o bom trabalho e o esforço extra', category: 'respeito', type: 'likert' },
  { id: 'q16', text: 'Os gestores reconhecem erros não intencionais como parte do negócio', category: 'respeito', type: 'likert' },
  
  // Respeito - Colaboração
  { id: 'q17', text: 'Os gestores incentivam ideias e sugestões e as levam em consideração de forma sincera', category: 'respeito', type: 'likert' },
  { id: 'q18', text: 'Os gestores envolvem os colaboradores em decisões que afetam suas atividades e seu ambiente de trabalho', category: 'respeito', type: 'likert' },
  
  // Respeito - Cuidado
  { id: 'q19', text: 'Os gestores se preocupam com a segurança física dos colaboradores, independentemente do local de trabalho', category: 'respeito', type: 'likert' },
  { id: 'q20', text: 'Os gestores se preocupam para que tenhamos instalações adequadas de trabalho', category: 'respeito', type: 'likert' },
  { id: 'q21', text: 'Este é um lugar psicológica e emocionalmente saudável para trabalhar', category: 'respeito', type: 'likert' },
  { id: 'q22', text: 'Os colaboradores são encorajados a equilibrar sua vida profissional e pessoal', category: 'respeito', type: 'likert' },
  { id: 'q23', text: 'Os gestores mostram interesse sincero por mim como pessoa e não somente como empregado', category: 'respeito', type: 'likert' },
  { id: 'q24', text: 'Temos benefícios especiais e diferenciados aqui', category: 'respeito', type: 'likert' },
  { id: 'q25', text: 'Posso me ausentar do trabalho quando necessário', category: 'respeito', type: 'likert' },
  
  // Imparcialidade - Equidade
  { id: 'q26', text: 'Os colaboradores aqui são pagos adequadamente pelo serviço que fazem', category: 'imparcialidade', type: 'likert' },
  { id: 'q27', text: 'Acredito que a quantia que recebo como participação nos resultados da empresa é justa', category: 'imparcialidade', type: 'likert' },
  { id: 'q28', text: 'Todos aqui têm a oportunidade de receber um reconhecimento especial', category: 'imparcialidade', type: 'likert' },
  
  // Imparcialidade - Ausência de Favoritismo
  { id: 'q29', text: 'Os gestores evitam o favoritismo', category: 'imparcialidade', type: 'likert' },
  { id: 'q30', text: 'Os colaboradores evitam fazer "politicagem" e intrigas como forma de obter resultados', category: 'imparcialidade', type: 'likert' },
  { id: 'q31', text: 'As promoções são dadas aos colaboradores que realmente mais merecem', category: 'imparcialidade', type: 'likert' },
  
  // Imparcialidade - Justiça
  { id: 'q32', text: 'Se eu for tratado injustamente, acredito que serei ouvido e acabarei recebendo um tratamento justo', category: 'imparcialidade', type: 'likert' },
  { id: 'q33', text: 'Os colaboradores aqui são bem tratados independentemente de sua idade', category: 'imparcialidade', type: 'likert' },
  { id: 'q34', text: 'Os colaboradores aqui são bem tratados independentemente de sua cor ou etnia', category: 'imparcialidade', type: 'likert' },
  { id: 'q35', text: 'Os colaboradores aqui são bem tratados independentemente de seu gênero', category: 'imparcialidade', type: 'likert' },
  { id: 'q36', text: 'Os colaboradores aqui são bem tratados independentemente de sua orientação sexual', category: 'imparcialidade', type: 'likert' },
  { id: 'q37', text: 'Eu sou considerado importante independentemente de minha posição na empresa', category: 'imparcialidade', type: 'likert' },
  
  // Orgulho - Trabalho Individual
  { id: 'q38', text: 'Meu trabalho tem um sentido especial. Para mim, não é só "mais um emprego"', category: 'orgulho', type: 'likert' },
  { id: 'q39', text: 'Sinto que eu faço a diferença aqui', category: 'orgulho', type: 'likert' },
  
  // Orgulho - Equipe
  { id: 'q40', text: 'Quando vejo o que fazemos por aqui, sinto orgulho', category: 'orgulho', type: 'likert' },
  { id: 'q41', text: 'Nossos clientes classificam nossos serviços e/ou produtos como excelentes', category: 'orgulho', type: 'likert' },
  
  // Orgulho - Organização
  { id: 'q42', text: 'Tenho orgulho de contar a outras pessoas que trabalho aqui', category: 'orgulho', type: 'likert' },
  { id: 'q43', text: 'Eu me sinto bem com a forma pela qual contribuímos para a comunidade', category: 'orgulho', type: 'likert' },
  
  // Camaradagem - Intimidade
  { id: 'q44', text: 'Posso ser eu mesmo por aqui', category: 'camaradagem', type: 'likert' },
  { id: 'q45', text: 'Este é um lugar descontraído para trabalhar', category: 'camaradagem', type: 'likert' },
  { id: 'q46', text: 'Nós sempre comemoramos eventos especiais', category: 'camaradagem', type: 'likert' },
  
  // Camaradagem - Hospitalidade
  { id: 'q47', text: 'Quando se entra nesta empresa, fazem você se sentir bem‑vindo', category: 'camaradagem', type: 'likert' },
  { id: 'q48', text: 'Quando os colaboradores mudam de função ou de área, a empresa faz com que se sintam rapidamente "em casa"', category: 'camaradagem', type: 'likert' },
  
  // Camaradagem - Comunidade
  { id: 'q49', text: 'Aqui os colaboradores se importam uns com os outros', category: 'camaradagem', type: 'likert' },
  { id: 'q50', text: 'Pode-se contar com a colaboração dos colaboradores por aqui', category: 'camaradagem', type: 'likert' },
  { id: 'q51', text: 'Os colaboradores aqui estão dispostos a dar mais de si para concluir um trabalho', category: 'camaradagem', type: 'likert' },
  { id: 'q52', text: 'Os colaboradores aqui têm motivação para trabalhar', category: 'camaradagem', type: 'likert' },
  
  // Autonomia e Confiança
  { id: 'q53', text: 'Os gestores confiam que os colaboradores fazem um bom trabalho sem precisar vigiá‑los', category: 'credibilidade', type: 'likert' },
  { id: 'q54', text: 'Os gestores aqui dão autonomia aos colaboradores', category: 'respeito', type: 'likert' },
  
  // Retenção
  { id: 'q55', text: 'Pretendo trabalhar aqui por muito tempo', category: 'orgulho', type: 'likert' },
];

// NPS Question
export const npsQuestion: GPTWQuestion = {
  id: 'nps',
  text: 'Com certeza, eu recomendaria minha empresa para amigos e família como um excelente lugar para trabalhar',
  category: 'nps',
  type: 'scale_0_10'
};

// Open-ended questions
export const openQuestions: GPTWQuestion[] = [
  {
    id: 'open1',
    text: 'O que torna esta organização um excelente lugar para trabalhar?',
    category: 'open',
    type: 'open_text'
  },
  {
    id: 'open2',
    text: 'O que você acha que precisa melhorar na organização?',
    category: 'open',
    type: 'open_text'
  }
];

// Demographic options
export const demographicOptions = {
  gender: [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
    { value: 'prefiro_nao_informar', label: 'Prefiro não informar' }
  ],
  ageRange: [
    { value: '18-25', label: '18 a 25 anos' },
    { value: '26-35', label: '26 a 35 anos' },
    { value: '36-45', label: '36 a 45 anos' },
    { value: '46-55', label: '46 a 55 anos' },
    { value: '56+', label: '56 anos ou mais' }
  ],
  tenure: [
    { value: 'menos_1', label: 'Menos de 1 ano' },
    { value: '1-2', label: '1 a 2 anos' },
    { value: '3-5', label: '3 a 5 anos' },
    { value: '6-10', label: '6 a 10 anos' },
    { value: 'mais_10', label: 'Mais de 10 anos' }
  ],
  education: [
    { value: 'fundamental', label: 'Ensino Fundamental' },
    { value: 'medio', label: 'Ensino Médio' },
    { value: 'tecnico', label: 'Ensino Técnico' },
    { value: 'superior', label: 'Ensino Superior' },
    { value: 'pos_graduacao', label: 'Pós-Graduação' },
    { value: 'mestrado_doutorado', label: 'Mestrado/Doutorado' }
  ],
  role: [
    { value: 'operacional', label: 'Operacional' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'supervisao', label: 'Supervisão/Coordenação' },
    { value: 'gerencia', label: 'Gerência' },
    { value: 'diretoria', label: 'Diretoria' }
  ]
};

export const likertOptions = [
  { value: 1, label: 'Discordo totalmente' },
  { value: 2, label: 'Discordo' },
  { value: 3, label: 'Nem concordo nem discordo' },
  { value: 4, label: 'Concordo' },
  { value: 5, label: 'Concordo totalmente' }
];
