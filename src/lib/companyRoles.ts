export const COMPANY_MEMBER_ROLES = [
  "apurador",
  "comite",
  "dpo",
  "visualizador",
] as const;

export type CompanyMemberRole = (typeof COMPANY_MEMBER_ROLES)[number];
export type CompanyScopeRole = CompanyMemberRole | "company";

export const COMPANY_ROLE_LABELS: Record<CompanyScopeRole, string> = {
  company: "Usuário principal",
  apurador: "RH / Apurador",
  comite: "Comitê de Ética",
  dpo: "DPO interno",
  visualizador: "Visualizador",
};

export const COMPANY_ROLE_DESCRIPTIONS: Record<CompanyScopeRole, string> = {
  company:
    "Acesso total à empresa, inclusive dados pessoais e gestão dos demais usuários.",
  apurador:
    "Acompanha e apura manifestações: pode alterar status e registrar atualizações. Dados pessoais mascarados.",
  comite:
    "Comitê de Ética: visualiza manifestações e registra pareceres/validação de encerramento. Dados pessoais mascarados.",
  dpo: "DPO interno: leitura das manifestações com acesso a dados pessoais, sem alterar andamento.",
  visualizador:
    "Somente leitura de manifestações e indicadores. Dados pessoais mascarados.",
};

/** Papéis que enxergam o dashboard da empresa */
export const isCompanyScopeRole = (role?: string | null): boolean =>
  !!role && (role === "company" || (COMPANY_MEMBER_ROLES as readonly string[]).includes(role));

/** Papéis que podem alterar status / registrar atualizações */
export const canWriteReports = (role?: string | null): boolean =>
  role === "company" || role === "apurador" || role === "comite" || role === "admin";

/** Papéis que podem ver dados pessoais do manifestante */
export const canViewPersonalData = (role?: string | null): boolean =>
  role === "company" || role === "dpo" || role === "admin";

export const maskPersonalData = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (trimmed.length <= 2) return "••";
  return `${trimmed[0]}${"•".repeat(Math.min(trimmed.length - 1, 8))}`;
};
