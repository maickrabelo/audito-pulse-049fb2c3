# Trocar "denúncia" por "manifestação" e simplificar a classificação (4A/4B/4C + tag Risco Grave)

## 1. Terminologia: "denúncia" -> "manifestação"

Substituir em todo o texto visível ao usuário, com concordância correta (a manifestação, as manifestações, o manifestante / a pessoa manifestante no lugar de denunciante):

- Páginas: `Index`, `CompanyReport`, `ReportForm`, `ReportChat`, `ReportSuccess`, `Reports`, `Dashboard`, `MasterDashboard`, `SSTDashboard`, `TriagemAMO`, `CompanyProfile`, `TrialSignup`.
- Componentes: `ReportWizard`, `ReportChatContent`, `TrackReportModal`, `AnonymousReportButton`, `LoginCard`, `AuthForm`, `Footer`, `DownloadReportButton`, `SEOStructuredData`, seções da landing (Features, FAQ, HowItWorks), `master/AiUsageCard`, `master/ParametrosCanalCard`.
- Textos de IA e e-mails (edge functions): `chat-report`, `classify-report-ai`, `submit-report`, `send-notification-email`, `escalate-report`, `report-transition`, `sla-runner`, `analyze-reports`, `_shared/nr1-spec.ts`.
- Metadados de SEO no `index.html` e títulos/descrições de página.
- Rótulos em `src/lib/nr1.ts` (ex.: "Denúncia mista" -> "Manifestação mista") e `src/lib/companyRoles.ts`.

Não serão alterados (são identificadores internos, mudá-los quebraria dados existentes): valores de enum no banco (`DENUNCIA_MISTA`, `competencia_denuncia`, etc.), nomes de tabelas/colunas, nomes de rotas e de edge functions.

As páginas jurídicas (Política de Privacidade, Termos de Uso, Política de Segurança, Política de Retenção) também terão o termo trocado, mantendo o sentido legal. Os PDFs/DOCX já gerados anteriormente não serão regerados nesta etapa (posso fazer depois, se quiser).

## 2. Classificação: remover 4D, manter tag "Risco Grave"

Hoje o sistema grava `4D_grave_immediate` sempre que a IA marca `risco_grave_imediato = SIM`, sobrescrevendo a competência real (4A/4B/4C).

Mudanças:

- A classificação passa a refletir apenas a competência: `4A_sst`, `4B_out_of_scope`, `4C_mixed` (e `pending_ai` enquanto não classificada).
- O risco grave continua sendo gravado no campo próprio (`risco_grave_imediato`) e passa a aparecer como **tag "Risco Grave"** ao lado da classificação, na Triagem AMO, no dashboard da empresa e na lista por categoria do Master.
- O alerta crítico por e-mail e o estado `ALERTA_CRITICO_ATIVO` continuam funcionando exatamente como hoje — passam a ser disparados pela tag de risco, não pela classificação 4D.
- Na Triagem, quem valida pode marcar/desmarcar a tag "Risco Grave" independentemente de escolher 4A/4B/4C.

### Detalhes técnicos

- `classify-report-ai/index.ts` e `report-transition/index.ts`: remover o ramo que mapeia risco SIM para `4D_grave_immediate`; mapear sempre pela competência.
- `MasterDashboard.tsx`: remover o filtro/categoria "4D — Grave/imediato"; adicionar badge vermelha "Risco Grave" quando `risco_grave_imediato = 'SIM'`; ajustar o texto dos Contatos de Emergência (de "4D" para "risco grave e iminente").
- `TriagemAMO.tsx`: badge "Risco Grave" em destaque; o seletor de risco continua controlando a tag.
- `escalate-report/index.ts`: e-mail deixa de citar "4D".
- Banco: o valor `4D_grave_immediate` permanece no enum para não quebrar registros antigos, mas deixa de ser gravado. Registros existentes com 4D serão migrados para a competência correspondente (`competencia` já gravada) mantendo `risco_grave_imediato = SIM`.
