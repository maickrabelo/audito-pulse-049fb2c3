
# Fluxo de Ouvidoria NR-1 / SST — Implementação Completa

Reestrutura a ouvidoria para seguir o fluxograma: integração SOC → validação CPF → coleta minimizada → IA de triagem → validação humana AMO → rotas 4A/4B/4C/4D → painel executivo anonimizado.

## Decisões confirmadas
- SOC: sync **manual** por empresa via botão no painel SST.
- Credenciais SOC: **globais** (secrets `SOC_EMPRESA`, `SOC_CODIGO`, `SOC_CHAVE`).
- Validação AMO: reutiliza role **admin** (master dashboard ganha aba "Triagem").
- Entrega **única**.

---

## 1. Banco de dados (migração)

### Novas tabelas
- `soc_employees` — funcionários importados do SOC. Um por CPF+empresa. Campos: `company_id`, `cpf` (hash + últimos 4 dígitos para exibir), `nome_hash`, `unidade`, `ghe` (derivado de setor), `cargo`, `cbo`, `setor`, `situacao`, `matricula`, `synced_at`.
  - CPF armazenado como hash (sha256) — nunca em claro. Coluna extra `cpf_last4` só para debug.
- `soc_sync_logs` — histórico de sincronizações (empresa, iniciado_em, total, sucesso/erro).
- Extensão em `reports`:
  - `ai_classification` enum: `4A_sst`, `4B_out_of_scope`, `4C_mixed`, `4D_grave_immediate`, `pending_ai`
  - `amo_validated_classification` (mesma enum, null até validar)
  - `amo_validated_by` (uuid → auth.users), `amo_validated_at`
  - `amo_validation_notes` (text)
  - `unidade`, `ghe`, `cargo` (snapshot no momento da denúncia, minimizado)
  - `escalation_sent_at` (timestamp para 4D)
  - Remove/oculta uso de `reporter_name`/campos identificatórios no fluxo público.

### RLS
- `soc_employees`: só admin e edge functions (service_role). Empresa **NÃO lê**.
- `reports` painel empresa: policy passa a expor apenas colunas agregadas/minimizadas via view `reports_minimized` (sem relato bruto, sem nomes, sem anexos por padrão).
- Nova view `reports_executive` só com contagens/status por unidade/GHE/cargo agregados.

---

## 2. Secrets
- `SOC_EMPRESA`, `SOC_CODIGO`, `SOC_CHAVE` (add_secret).
- `CPF_HASH_SALT` (generate_secret, 64 chars).

---

## 3. Edge Functions (novas)

- **`soc-sync-company`** — recebe `company_id`, chama `https://ws1.soc.com.br/WebSoc/exportadados` com `tipoSaida=json&ativo=Sim`, hasheia CPFs, faz upsert em `soc_employees`, grava log.
- **`validate-cpf-link`** — recebe `{ cpf, company_id }`, hasheia, busca em `soc_employees`, retorna `{ valid: true, unidade, ghe, cargo }` sem devolver identidade. Rate-limited.
- **`classify-report-ai`** — chamada após `submit-report`; usa Lovable AI (`google/gemini-2.5-flash`) com prompt de triagem retornando JSON `{ classification: 4A|4B|4C|4D, rationale, has_grave_risk }`. Grava em `ai_classification`.
- **`escalate-report`** — disparada quando `amo_validated_classification = 4D`; envia e-mail (Resend) para lista de responsáveis da empresa + AMO.
- Ajustes em `submit-report`: aceita `unidade/ghe/cargo` já resolvidos, nunca grava CPF, chama `classify-report-ai` em background.

---

## 4. Frontend

### Fluxo do denunciante (`/denuncia/:slug`)
Substitui o chat atual por wizard em 4 passos:
1. **Aviso + CPF** — banner de confidencialidade, campo CPF único, botão "Validar vínculo".
2. **Confirmação de vínculo** — mostra "Vínculo confirmado com [Empresa]. Unidade/GHE/Cargo identificados." (sem nome).
3. **Relato** — categoria, descrição, anexos opcionais, reforço de anonimato.
4. **Protocolo** — número gerado, orientação de acompanhamento.

Chat com Ana permanece disponível como modo alternativo dentro do passo 3.

### Painel Executivo da Empresa (`/dashboard`)
Refatora para exibir apenas:
- Contadores por status/categoria/gravidade
- Agregados por Unidade / GHE / Cargo (tabela e gráfico)
- Prazos e SLAs
Oculta: CPF, nomes, relato bruto, anexos, testemunhas. Detalhe de denúncia mostra "Relatório Confidencial Minimizado" (protocolo, resumo, gravidade, providências, prazo).

Botão "Ver dados completos" só aparece para roles `dpo`/`compliance` (novo — ver §5) e exige justificativa gravada em `report_access_audit` (nova tabela leve).

### Painel SST (`/sst-dashboard`)
Adiciona:
- Botão "Sincronizar SOC" por empresa (chama `soc-sync-company`, mostra progresso).
- Coluna "Última sync" e "# colaboradores".

### Master Dashboard (`/master-dashboard`)
Nova aba **"Triagem AMO"**:
- Fila de denúncias com `amo_validated_classification IS NULL`.
- Mostra classificação da IA + rationale.
- Ações: **Confirmar**, **Reclassificar** (4A/4B/4C/4D) com nota.
- Após validação, executa rota:
  - 4A → mantém no fluxo AMO, exibe para empresa como minimizado + habilita plano de ação.
  - 4B → marca "fora de escopo", libera para empresa tratar internamente.
  - 4C → divide em dois `reports` filhos (parte SST + parte não-SST).
  - 4D → chama `escalate-report`.

---

## 5. Roles adicionais (LGPD — menor privilégio)
Extende enum `app_role` com: `apurador`, `comite`, `dpo`.
- `apurador` — vê detalhes minimizados sem identificação.
- `comite` — acesso adicional só com justificativa registrada.
- `dpo` — acesso ampliado documentado.

Painel de gestão de usuários da empresa ganha atribuição desses papéis (opcional — pode ficar como próxima fase se preferir; incluído aqui porque o fluxograma exige).

---

## Detalhes técnicos

**Hash de CPF:** `sha256(cpf_digits + CPF_HASH_SALT)` — mesmo hash em `soc_employees` e no lookup, evita armazenar CPF em claro.

**Parse SOC:** SOC entrega array JSON com os campos listados na especificação. Mapeamento:
- `unidade` ← `NOMEUNIDADE`
- `ghe` ← `NOMESETOR` (fallback, já que Exporta Dados não expõe GHE diretamente — comentado no código para trocar por campo GHE-específico se disponível em outro Exporta Dados)
- `cargo` ← `NOMECARGO`, `cbo` ← `CBOCARGO`

**IA de triagem — prompt resumido:**
> "Classifique a denúncia em 4A (SST/NR-1: assédio, riscos ergonômicos, psicossociais, saúde ocupacional), 4B (fora de SST: fraude financeira, questões contratuais, ética não-SST), 4C (mista) ou 4D (risco grave/imediato: violência física, ameaça, suicídio, acidente grave em curso). Retorne JSON."

**Escalonamento 4D:** e-mail para `company.emergency_contacts` (novo campo jsonb) + AMO admins.

**Auditoria:** nova tabela `report_access_audit` (user_id, report_id, accessed_at, justification) — obrigatória para roles `comite`/`dpo`.

---

## Ordem de execução

1. Migração DB (novas tabelas, enums, colunas, views, RLS).
2. Secrets SOC + salt CPF.
3. Edge functions (`soc-sync-company`, `validate-cpf-link`, `classify-report-ai`, `escalate-report`, ajuste em `submit-report`).
4. Frontend denunciante (wizard CPF → validação → relato).
5. Painel SST (botão sync).
6. Master dashboard (aba Triagem AMO).
7. Painel empresa (minimização + view executiva).
8. Roles extra + auditoria de acesso.

## Fora do escopo desta entrega
- UI de gestão dos e-mails de escalonamento 4D (campo criado, edição via SQL por enquanto).
- Sync automático agendado do SOC (só manual).
- Painel de auditoria de acessos (dados gravados, visualização em próxima entrega).
