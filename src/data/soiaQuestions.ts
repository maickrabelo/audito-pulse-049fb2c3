// SOIA Model Questions - Organizational Climate Survey
export interface SOIAQuestion {
  id: string;
  text: string;
  category: string;
  type: 'likert' | 'open_text';
}

export const soiaCategories = [
  { id: 'ambiente', name: 'Ambiente de Trabalho', description: 'Colaboração, respeito e recursos' },
  { id: 'lideranca', name: 'Liderança', description: 'Comunicação, feedback e abertura' },
  { id: 'motivacao', name: 'Motivação e Reconhecimento', description: 'Engajamento e valorização' },
  { id: 'bemestar', name: 'Bem-estar', description: 'Qualidade de vida e equilíbrio' },
  { id: 'open', name: 'Perguntas Abertas', description: 'Feedback qualitativo' },
];

// Likert questions (scale 1-5)
export const soiaQuestions: SOIAQuestion[] = [
  // Ambiente de Trabalho
  { 
    id: 'soia1', 
    text: 'Você sente que existe colaboração e trabalho em equipe entre os colegas?', 
    category: 'ambiente', 
    type: 'likert' 
  },
  { 
    id: 'soia2', 
    text: 'Você se sente respeitado(a) e valorizado(a) no ambiente de trabalho?', 
    category: 'ambiente', 
    type: 'likert' 
  },
  { 
    id: 'soia3', 
    text: 'O ambiente físico e os recursos disponíveis são adequados para realizar seu trabalho?', 
    category: 'ambiente', 
    type: 'likert' 
  },
  
  // Liderança
  { 
    id: 'soia4', 
    text: 'A comunicação entre a liderança e a equipe é clara e transparente?', 
    category: 'lideranca', 
    type: 'likert' 
  },
  { 
    id: 'soia5', 
    text: 'Você sente que pode expressar suas opiniões e ideias livremente?', 
    category: 'lideranca', 
    type: 'likert' 
  },
  { 
    id: 'soia6', 
    text: 'O(a) líder do seu time oferece feedbacks construtivos e com regularidade?', 
    category: 'lideranca', 
    type: 'likert' 
  },
  { 
    id: 'soia7', 
    text: 'Como você avalia a disponibilidade e abertura da liderança para ouvir a equipe?', 
    category: 'lideranca', 
    type: 'likert' 
  },
  
  // Motivação e Reconhecimento
  { 
    id: 'soia8', 
    text: 'Você se sente motivado(a) com seu trabalho?', 
    category: 'motivacao', 
    type: 'likert' 
  },
  { 
    id: 'soia9', 
    text: 'Você sente que seus esforços e resultados são reconhecidos?', 
    category: 'motivacao', 
    type: 'likert' 
  },
  { 
    id: 'soia10', 
    text: 'O trabalho que você realiza é desafiador e oferece oportunidades de crescimento?', 
    category: 'motivacao', 
    type: 'likert' 
  },
  
  // Bem-estar
  { 
    id: 'soia11', 
    text: 'Você sente que a empresa se preocupa com o seu bem-estar e qualidade de vida?', 
    category: 'bemestar', 
    type: 'likert' 
  },
  { 
    id: 'soia12', 
    text: 'Você sente que tem equilíbrio entre vida pessoal e profissional?', 
    category: 'bemestar', 
    type: 'likert' 
  },
];

// Open-ended questions
export const soiaOpenQuestions: SOIAQuestion[] = [
  {
    id: 'soia_open1',
    text: 'Como você descreveria o ambiente de trabalho na empresa?',
    category: 'open',
    type: 'open_text'
  },
  {
    id: 'soia_open2',
    text: 'O que mais te motiva a trabalhar aqui?',
    category: 'open',
    type: 'open_text'
  },
  {
    id: 'soia_open3',
    text: 'O que você acredita que a empresa poderia melhorar?',
    category: 'open',
    type: 'open_text'
  },
  {
    id: 'soia_open4',
    text: 'Existe algo que você gostaria de compartilhar com a liderança?',
    category: 'open',
    type: 'open_text'
  },
  {
    id: 'soia_open5',
    text: 'Agradecemos a sua participação! Sinta-se à vontade, caso queira compartilhar mais algum ponto importante conosco.',
    category: 'open',
    type: 'open_text'
  }
];
