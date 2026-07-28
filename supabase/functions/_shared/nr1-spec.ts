// Parametrização amo_canal_denuncias_sst_nr1 v1.0.0
// Fonte única de verdade para motor de IA, máquina de estados e SLA.

export type Competencia = "SST_NR1" | "EMPRESA_CLIENTE" | "DENUNCIA_MISTA" | "INFORMACOES_INSUFICIENTES";
export type Risco = "SIM" | "NAO" | "INDETERMINADO";
export type Prioridade = "CRITICA" | "ALTA" | "MODERADA" | "BAIXA";
export type Pilar = "PT-00" | "PT-01" | "PT-02" | "PT-03" | "PT-04" | "PT-05" | "PT-06";

export const COMPETENCIAS: Competencia[] = ["SST_NR1", "EMPRESA_CLIENTE", "DENUNCIA_MISTA", "INFORMACOES_INSUFICIENTES"];
export const RISCOS: Risco[] = ["SIM", "NAO", "INDETERMINADO"];
export const PRIORIDADES: Prioridade[] = ["CRITICA", "ALTA", "MODERADA", "BAIXA"];
export const PILARES: Pilar[] = ["PT-00", "PT-01", "PT-02", "PT-03", "PT-04", "PT-05", "PT-06"];

// ---------------------------------------------------------------------------
// Pré-processamento (motor_de_ia.pre_processamento)
// ---------------------------------------------------------------------------
export function sanitizarRelato(texto: string): string {
  if (!texto) return "";
  let t = texto;
  // CPF / CNPJ
  t = t.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_REMOVIDO]");
  t = t.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[CNPJ_REMOVIDO]");
  // E-mail
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL_REMOVIDO]");
  // Telefone
  t = t.replace(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g, "[TELEFONE_REMOVIDO]");
  // Matrícula
  t = t.replace(/\bmatr[ií]cula\s*:?\s*[\w-]+/gi, "matrícula [REMOVIDA]");
  // RG
  t = t.replace(/\brg\s*:?\s*[\d.\-x]+/gi, "RG [REMOVIDO]");
  return t;
}

// Substitui nomes próprios por marcadores funcionais quando o papel é declarado.
export function pseudonimizarNomes(texto: string): string {
  if (!texto) return "";
  let t = texto;
  const papeis: [RegExp, string][] = [
    [/\b(meu|minha|o|a)\s+(gestor|gestora|chefe|supervisor|supervisora|encarregado|encarregada|l[ií]der|coordenador|coordenadora|gerente|diretor|diretora)\s+([A-ZÁÂÃÉÊÍÓÔÕÚÇ][a-zà-ú]+(?:\s+[A-ZÁÂÃÉÊÍÓÔÕÚÇ][a-zà-ú]+)?)/g, "$1 $2 [GESTOR]"],
    [/\b(meu|minha|o|a)\s+(colega|companheiro|companheira|funcion[áa]rio|funcion[áa]ria)\s+([A-ZÁÂÃÉÊÍÓÔÕÚÇ][a-zà-ú]+(?:\s+[A-ZÁÂÃÉÊÍÓÔÕÚÇ][a-zà-ú]+)?)/g, "$1 $2 [COLEGA]"],
  ];
  for (const [re, rep] of papeis) t = t.replace(re, rep);
  return t;
}

export function preProcessar(texto: string): string {
  return pseudonimizarNomes(sanitizarRelato(texto)).trim();
}

// ---------------------------------------------------------------------------
// Prompt do motor de IA
// ---------------------------------------------------------------------------
export const SYSTEM_PROMPT = `Você é o MOTOR DE TRIAGEM do Canal de Denúncias de SST / NR-1 do Grupo AMO Saúde.
Sua saída é SEMPRE uma SUGESTÃO sujeita a validação humana obrigatória.

VOCÊ PODE: triagem inicial, identificar competência de tratamento, classificar risco grave ou imediato,
classificar pilares psicossociais da parte SST, separar escopos em denúncia mista, sugerir evidências,
recomendar roteamento, listar dados faltantes e informar nível de confiança.

VOCÊ NÃO PODE: julgar mérito, afirmar culpa, confirmar juridicamente que houve assédio, emitir diagnóstico
clínico, definir punição, encerrar caso, investigar, coletar depoimentos, presumir fatos não relatados,
identificar pessoas, ou substituir decisão humana.

LINGUAGEM: técnica, objetiva, impessoal, sem juízo de valor, sem termos clínicos e sem acusação.
Nunca trate o denunciante como sendo a pessoa citada no relato.

ORDEM DE DECISÃO (siga exatamente nesta sequência):
1. Há indicação de dano imediato, violência, ameaça grave ou necessidade urgente de proteção?
   -> risco_grave_imediato = SIM (e continue a classificação da competência).
2. O relato contém elementos ligados à organização, gestão, condições ou ergonomia do trabalho?
   -> existe componente SST/NR-1.
3. A apuração exige depoimentos, investigação de conduta, produção de prova, punição ou análise jurídica?
   -> existe componente de competência da empresa.
4. Existem os dois simultaneamente -> DENUNCIA_MISTA (separe os dois escopos).
5. Só componente SST analisável por evidências objetivas -> SST_NR1.
6. Só componente administrativo/disciplinar/jurídico/trabalhista/ético/criminal/RH/compliance -> EMPRESA_CLIENTE.
7. Faltam elementos mínimos para decidir competência ou urgência -> INFORMACOES_INSUFICIENTES.

CLASSIFICAÇÕES:
- SST_NR1 (CL-01): decorre da organização, condições, gestão ou ergonomia do trabalho e pode ser analisado
  por documentos, registros ou evidências objetivas. Responsável: AMO.
- EMPRESA_CLIENTE (CL-02): a apuração depende de investigação administrativa, disciplinar, trabalhista,
  jurídica, ética, criminal, de RH ou compliance. Responsável: empresa cliente. A AMO não investiga nem julga.
- DENUNCIA_MISTA (CL-03): contém simultaneamente fator técnico de SST e fato de apuração da empresa.
- INFORMACOES_INSUFICIENTES (CL-04): não permite identificar fato, contexto laboral, competência ou urgência.

RISCO GRAVE E IMEDIATO:
- SIM: risco concreto e atual de dano imediato à saúde mental, integridade psicológica ou segurança
  (violência iminente, ameaça grave, assédio coletivo crítico, ambiente extremamente hostil e atual,
  evento crítico com múltiplos trabalhadores). Prioridade obrigatoriamente CRITICA.
- NAO: sem indício de urgência ou dano imediato.
- INDETERMINADO: menciona medo, sofrimento ou risco, mas sem dados suficientes. Nunca conclua ausência de risco.

PILARES PSICOSSOCIAIS (aplicar somente à parte SST):
- PT-01 Ergonomia: posto, ferramentas, pausas, ritmo, layout, forma de execução.
- PT-02 Organização do Trabalho: distribuição, volume, ritmo, jornada, metas, acúmulo de funções, autonomia,
  processos, mudanças e planejamento.
- PT-03 Liderança e Gestão: modelo de gestão, comunicação, suporte, orientação, práticas de liderança.
- PT-04 Assédio e Clima de Respeito: clima hostil, humilhação, desrespeito, intimidação, isolamento, retaliação.
  LIMITE: aplicar somente ao impacto psicossocial e ao clima; NUNCA para confirmar juridicamente assédio.
- PT-05 Bem-Estar e Saúde: estresse, esgotamento, ansiedade, sofrimento mental, afastamento, avaliação ocupacional.
- PT-06 Questões Pessoais e Apoio Social: isolamento, falta de apoio, reintegração, conflito trabalho-vida ligado ao trabalho.
- PT-00 Não aplicável: nenhum fator técnico de SST identificado.

CONSISTÊNCIA OBRIGATÓRIA:
- PT-00 nunca coexiste com PT-01..PT-06.
- EMPRESA_CLIENTE sem componente SST usa somente ["PT-00"].
- SST_NR1 e DENUNCIA_MISTA exigem ao menos um pilar entre PT-01 e PT-06.
- INFORMACOES_INSUFICIENTES pode ter pilares vazios e EXIGE dados_faltantes preenchido.
- risco_grave_imediato = SIM implica prioridade = CRITICA.
- Prioridade padrão: INDETERMINADO -> ALTA; NAO -> MODERADA.

DOCUMENTOS SUGERIDOS (use o mapa de evidências conforme o tema identificado):
- Sobrecarga/excesso de demandas: escala de trabalho, controle de jornada, distribuição de tarefas, dimensionamento
  de equipe, registro de horas extras, metas do setor.
- Metas incompatíveis: painel de metas, histórico de atingimento, comunicação das metas, dimensionamento.
- Jornada prolongada: espelho de ponto, banco de horas, escala, acordo coletivo aplicável.
- Pausas insuficientes: registro de pausas, escala de revezamento, análise ergonômica, procedimento operacional.
- Acúmulo de funções: descrição de cargo, organograma, quadro de pessoal, registros de afastamento.
- Mudança organizacional sem planejamento: comunicados, plano de mudança, treinamento, atas, cronograma.
- Retorno ao trabalho após afastamento: ASO, restrições médicas, plano de reintegração, registro de acompanhamento.
- Condições ergonômicas: AET, PGR, laudos, registros de manutenção, fotos do posto.
- Falta de autonomia ou comunicação deficiente: fluxos de decisão, procedimentos, atas de reunião, canais de
  comunicação, pesquisa de clima, registros de feedback, treinamentos de liderança.

SAÍDA: responda SOMENTE com um objeto JSON válido, sem markdown, com exatamente estas chaves:
{
 "classificacao_principal": "SST_NR1"|"EMPRESA_CLIENTE"|"DENUNCIA_MISTA"|"INFORMACOES_INSUFICIENTES",
 "risco_grave_imediato": "SIM"|"NAO"|"INDETERMINADO",
 "prioridade": "CRITICA"|"ALTA"|"MODERADA"|"BAIXA",
 "pilares_psicossociais": ["PT-0X", ...],
 "parte_competencia_amo": string|null,
 "parte_competencia_empresa": string|null,
 "justificativa_classificacao": string,
 "trechos_relevantes": [string],
 "documentos_sugeridos": [string],
 "dados_faltantes": [string],
 "acao_recomendada": [string],
 "confianca": 0-100,
 "validacao_humana": "OBRIGATORIA"
}`;

// ---------------------------------------------------------------------------
// Validador determinístico do schema_saida_ia (allOf)
// ---------------------------------------------------------------------------
export interface SaidaIA {
  classificacao_principal: Competencia;
  risco_grave_imediato: Risco;
  prioridade: Prioridade;
  pilares_psicossociais: Pilar[];
  parte_competencia_amo: string | null;
  parte_competencia_empresa: string | null;
  justificativa_classificacao: string;
  trechos_relevantes: string[];
  documentos_sugeridos: string[];
  dados_faltantes: string[];
  acao_recomendada: string[];
  confianca: number;
  validacao_humana: "OBRIGATORIA";
}

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  saida: SaidaIA;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

export function validarSaidaIA(raw: unknown, prioridadeIndeterminado: Prioridade = "ALTA", prioridadeNao: Prioridade = "MODERADA"): ResultadoValidacao {
  const erros: string[] = [];
  const o = (raw ?? {}) as Record<string, unknown>;

  let competencia = o.classificacao_principal as Competencia;
  if (!COMPETENCIAS.includes(competencia)) {
    erros.push("classificacao_principal inválida");
    competencia = "INFORMACOES_INSUFICIENTES";
  }

  let risco = o.risco_grave_imediato as Risco;
  if (!RISCOS.includes(risco)) {
    erros.push("risco_grave_imediato inválido");
    risco = "INDETERMINADO";
  }

  let pilares = (Array.isArray(o.pilares_psicossociais) ? o.pilares_psicossociais : []).filter((p): p is Pilar =>
    PILARES.includes(p as Pilar)
  );
  pilares = [...new Set(pilares)];

  // PT-00 não coexiste com os demais
  if (pilares.includes("PT-00") && pilares.length > 1) {
    erros.push("PT-00 não pode coexistir com PT-01..PT-06");
    pilares = pilares.filter((p) => p !== "PT-00");
  }

  const parteAmo = typeof o.parte_competencia_amo === "string" && o.parte_competencia_amo.trim() ? o.parte_competencia_amo.trim() : null;
  const parteEmpresa = typeof o.parte_competencia_empresa === "string" && o.parte_competencia_empresa.trim() ? o.parte_competencia_empresa.trim() : null;
  const dadosFaltantes = arr(o.dados_faltantes);

  if (competencia === "SST_NR1") {
    if (!parteAmo) erros.push("SST_NR1 exige parte_competencia_amo");
    if (pilares.length === 0 || pilares.includes("PT-00")) erros.push("SST_NR1 exige ao menos um pilar PT-01..PT-06");
  }
  if (competencia === "EMPRESA_CLIENTE") {
    if (!parteEmpresa) erros.push("EMPRESA_CLIENTE exige parte_competencia_empresa");
    if (pilares.length !== 1 || pilares[0] !== "PT-00") {
      erros.push("EMPRESA_CLIENTE deve usar somente PT-00");
      pilares = ["PT-00"];
    }
  }
  if (competencia === "DENUNCIA_MISTA") {
    if (!parteAmo) erros.push("DENUNCIA_MISTA exige parte_competencia_amo");
    if (!parteEmpresa) erros.push("DENUNCIA_MISTA exige parte_competencia_empresa");
    if (pilares.length === 0 || pilares.includes("PT-00")) erros.push("DENUNCIA_MISTA exige ao menos um pilar PT-01..PT-06");
  }
  if (competencia === "INFORMACOES_INSUFICIENTES" && dadosFaltantes.length === 0) {
    erros.push("INFORMACOES_INSUFICIENTES exige dados_faltantes");
  }

  // Prioridade: normativa para risco SIM, convenção para os demais
  let prioridade = o.prioridade as Prioridade;
  if (!PRIORIDADES.includes(prioridade)) prioridade = "MODERADA";
  if (risco === "SIM") prioridade = "CRITICA";
  else if (prioridade === "CRITICA") prioridade = risco === "INDETERMINADO" ? prioridadeIndeterminado : prioridadeNao;

  let confianca = typeof o.confianca === "number" ? Math.round(o.confianca) : 0;
  if (confianca < 0) confianca = 0;
  if (confianca > 100) confianca = 100;

  const justificativa = typeof o.justificativa_classificacao === "string" ? o.justificativa_classificacao.trim() : "";
  if (!justificativa) erros.push("justificativa_classificacao vazia");

  return {
    valido: erros.length === 0,
    erros,
    saida: {
      classificacao_principal: competencia,
      risco_grave_imediato: risco,
      prioridade,
      pilares_psicossociais: pilares,
      parte_competencia_amo: parteAmo,
      parte_competencia_empresa: parteEmpresa,
      justificativa_classificacao: justificativa,
      trechos_relevantes: arr(o.trechos_relevantes),
      documentos_sugeridos: arr(o.documentos_sugeridos),
      dados_faltantes: dadosFaltantes,
      acao_recomendada: arr(o.acao_recomendada),
      confianca,
      validacao_humana: "OBRIGATORIA",
    },
  };
}

// ---------------------------------------------------------------------------
// Máquina de estados (maquina_de_estados)
// ---------------------------------------------------------------------------
export type Estado =
  | "RECEBIDA" | "VALIDACAO_DE_VINCULO" | "AGUARDANDO_TRIAGEM" | "EM_TRIAGEM" | "AGUARDANDO_COMPLEMENTACAO"
  | "AGUARDANDO_VALIDACAO_HUMANA" | "CLASSIFICADA" | "ALERTA_CRITICO_ATIVO" | "ENCAMINHADA_AMO"
  | "ENCAMINHADA_EMPRESA" | "EM_TRATATIVA_MISTA" | "AGUARDANDO_EVIDENCIAS" | "EM_ANALISE_TECNICA_AMO"
  | "EM_APURACAO_EMPRESA" | "MEDIDAS_DEFINIDAS" | "PLANO_DE_ACAO_ABERTO" | "EM_ACOMPANHAMENTO"
  | "AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO" | "ENCERRADA" | "ARQUIVADA";

export const TRANSICOES: Record<string, Estado[]> = {
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

export const ROTEAMENTO: Record<Competencia, Estado> = {
  SST_NR1: "ENCAMINHADA_AMO",
  EMPRESA_CLIENTE: "ENCAMINHADA_EMPRESA",
  DENUNCIA_MISTA: "EM_TRATATIVA_MISTA",
  INFORMACOES_INSUFICIENTES: "AGUARDANDO_COMPLEMENTACAO",
};

export function transicaoPermitida(de: Estado, para: Estado): boolean {
  return (TRANSICOES[de] || []).includes(para);
}

// ---------------------------------------------------------------------------
// SLA (slas.regras) — prazos em dias úteis
// ---------------------------------------------------------------------------
export const SLA_REGRAS: Record<string, { dias: number; label: string }> = {
  confirmacao_de_recebimento: { dias: 2, label: "Confirmação de recebimento" },
  triagem_inicial: { dias: 5, label: "Triagem inicial" },
  acionamento_empresa_caso_grave: { dias: 0, label: "Acionamento da empresa (caso grave)" },
  acionamento_empresa_demais_casos: { dias: 3, label: "Acionamento da empresa" },
  apuracao_tecnica_amo: { dias: 15, label: "Apuração técnica AMO" },
};

export function addDiasUteis(inicio: Date, dias: number, feriados: string[] = []): Date {
  const d = new Date(inicio);
  if (dias <= 0) return d;
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !feriados.includes(iso)) restantes--;
  }
  return d;
}
