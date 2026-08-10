// Constantes da parametrização amo_canal_denuncias_sst_nr1 v1.0.0 (frontend)

export const COMPETENCIAS = {
  SST_NR1: { label: "SST / NR-1", codigo: "CL-01", desc: "Fator técnico da organização, condições, gestão ou ergonomia do trabalho. Responsável: AMO." },
  EMPRESA_CLIENTE: { label: "Empresa cliente", codigo: "CL-02", desc: "Apuração administrativa, disciplinar, jurídica, ética ou de RH. Responsável: empresa." },
  DENUNCIA_MISTA: { label: "Manifestação mista", codigo: "CL-03", desc: "Contém simultaneamente componente SST e apuração da empresa." },
  INFORMACOES_INSUFICIENTES: { label: "Informações insuficientes", codigo: "CL-04", desc: "Não permite identificar fato, contexto, competência ou urgência." },
} as const;

export type Competencia = keyof typeof COMPETENCIAS;

export const RISCOS = { SIM: "Sim", NAO: "Não", INDETERMINADO: "Indeterminado" } as const;
export type Risco = keyof typeof RISCOS;

export const PRIORIDADES = { CRITICA: "Crítica", ALTA: "Alta", MODERADA: "Moderada", BAIXA: "Baixa" } as const;
export type Prioridade = keyof typeof PRIORIDADES;

export const PILARES = {
  "PT-00": "Não aplicável",
  "PT-01": "Ergonomia",
  "PT-02": "Organização do Trabalho",
  "PT-03": "Liderança e Gestão",
  "PT-04": "Assédio e Clima de Respeito",
  "PT-05": "Bem-Estar e Saúde",
  "PT-06": "Questões Pessoais e Apoio Social",
} as const;
export type Pilar = keyof typeof PILARES;

export const ESTADOS: Record<string, string> = {
  RECEBIDA: "Recebida",
  VALIDACAO_DE_VINCULO: "Validação de vínculo",
  AGUARDANDO_TRIAGEM: "Aguardando triagem",
  EM_TRIAGEM: "Em triagem",
  AGUARDANDO_COMPLEMENTACAO: "Aguardando complementação",
  AGUARDANDO_VALIDACAO_HUMANA: "Aguardando validação humana",
  CLASSIFICADA: "Classificada",
  ALERTA_CRITICO_ATIVO: "Alerta crítico ativo",
  ENCAMINHADA_AMO: "Encaminhada à AMO",
  ENCAMINHADA_EMPRESA: "Encaminhada à empresa",
  EM_TRATATIVA_MISTA: "Em tratativa mista",
  AGUARDANDO_EVIDENCIAS: "Aguardando evidências",
  EM_ANALISE_TECNICA_AMO: "Em análise técnica AMO",
  EM_APURACAO_EMPRESA: "Em apuração pela empresa",
  MEDIDAS_DEFINIDAS: "Medidas definidas",
  PLANO_DE_ACAO_ABERTO: "Plano de ação aberto",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO: "Aguardando validação de encerramento",
  ENCERRADA: "Encerrada",
  ARQUIVADA: "Arquivada",
};

export const TRANSICOES: Record<string, string[]> = {
  RECEBIDA: ["VALIDACAO_DE_VINCULO", "AGUARDANDO_TRIAGEM"],
  VALIDACAO_DE_VINCULO: ["AGUARDANDO_TRIAGEM"],
  AGUARDANDO_TRIAGEM: ["EM_TRIAGEM"],
  EM_TRIAGEM: ["ALERTA_CRITICO_ATIVO", "AGUARDANDO_COMPLEMENTACAO", "AGUARDANDO_VALIDACAO_HUMANA"],
  AGUARDANDO_COMPLEMENTACAO: ["EM_TRIAGEM", "AGUARDANDO_VALIDACAO_HUMANA"],
  ALERTA_CRITICO_ATIVO: ["AGUARDANDO_VALIDACAO_HUMANA", "CLASSIFICADA"],
  AGUARDANDO_VALIDACAO_HUMANA: ["CLASSIFICADA", "AGUARDANDO_COMPLEMENTACAO"],
  CLASSIFICADA: ["ENCAMINHADA_AMO", "ENCAMINHADA_EMPRESA", "EM_TRATATIVA_MISTA", "AGUARDANDO_COMPLEMENTACAO"],
  ENCAMINHADA_AMO: ["AGUARDANDO_EVIDENCIAS", "EM_ANALISE_TECNICA_AMO"],
  ENCAMINHADA_EMPRESA: ["EM_APURACAO_EMPRESA"],
  EM_TRATATIVA_MISTA: ["AGUARDANDO_EVIDENCIAS", "EM_ANALISE_TECNICA_AMO", "EM_APURACAO_EMPRESA"],
  AGUARDANDO_EVIDENCIAS: ["EM_ANALISE_TECNICA_AMO"],
  EM_ANALISE_TECNICA_AMO: ["MEDIDAS_DEFINIDAS", "AGUARDANDO_EVIDENCIAS"],
  EM_APURACAO_EMPRESA: ["MEDIDAS_DEFINIDAS"],
  MEDIDAS_DEFINIDAS: ["PLANO_DE_ACAO_ABERTO", "EM_ACOMPANHAMENTO"],
  PLANO_DE_ACAO_ABERTO: ["EM_ACOMPANHAMENTO"],
  EM_ACOMPANHAMENTO: ["AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO", "PLANO_DE_ACAO_ABERTO"],
  AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO: ["ENCERRADA", "EM_ACOMPANHAMENTO"],
  ENCERRADA: ["ARQUIVADA", "EM_ACOMPANHAMENTO"],
  ARQUIVADA: [],
};

export const ROTEAMENTO: Record<Competencia, string> = {
  SST_NR1: "ENCAMINHADA_AMO",
  EMPRESA_CLIENTE: "ENCAMINHADA_EMPRESA",
  DENUNCIA_MISTA: "EM_TRATATIVA_MISTA",
  INFORMACOES_INSUFICIENTES: "AGUARDANDO_COMPLEMENTACAO",
};

export const prioridadeVariant = (p?: string | null) =>
  p === "CRITICA" ? "destructive" : p === "ALTA" ? "default" : p === "MODERADA" ? "secondary" : "outline";

export const competenciaVariant = (c?: string | null) =>
  c === "DENUNCIA_MISTA" ? "secondary" : c === "EMPRESA_CLIENTE" ? "outline" : c === "INFORMACOES_INSUFICIENTES" ? "outline" : "default";

// Consistência obrigatória (schema_saida_ia.allOf) replicada no cliente
export function validarClassificacao(v: {
  competencia?: string; risco?: string; pilares: string[]; parte_amo: string; parte_empresa: string; justificativa: string;
}): string[] {
  const e: string[] = [];
  if (!v.competencia) e.push("Selecione a competência.");
  if (!v.risco) e.push("Informe o risco grave e imediato.");
  if (v.pilares.includes("PT-00") && v.pilares.length > 1) e.push("PT-00 não pode coexistir com outros pilares.");
  if (v.competencia === "SST_NR1") {
    if (!v.parte_amo.trim()) e.push("Descreva a parte de competência da AMO.");
    if (v.pilares.length === 0 || v.pilares.includes("PT-00")) e.push("SST/NR-1 exige ao menos um pilar entre PT-01 e PT-06.");
  }
  if (v.competencia === "EMPRESA_CLIENTE") {
    if (!v.parte_empresa.trim()) e.push("Descreva a parte de competência da empresa.");
    if (v.pilares.length !== 1 || v.pilares[0] !== "PT-00") e.push("Empresa cliente deve usar somente PT-00.");
  }
  if (v.competencia === "DENUNCIA_MISTA") {
    if (!v.parte_amo.trim()) e.push("Descreva a parte de competência da AMO.");
    if (!v.parte_empresa.trim()) e.push("Descreva a parte de competência da empresa.");
    if (v.pilares.length === 0 || v.pilares.includes("PT-00")) e.push("Manifestação mista exige ao menos um pilar entre PT-01 e PT-06.");
  }
  if (v.justificativa.trim().length < 10) e.push("A justificativa da decisão humana é obrigatória (mín. 10 caracteres).");
  return e;
}
