Implementação completa da parametrização `amo_canal_denuncias_sst_nr1` v1.0.0 sobre o sistema atual.

## Situação atual (verificada)
- `classify-report-ai` usa apenas 4 rótulos (`4A_sst`, `4B_out_of_scope`, `4C_mixed`, `4D_grave_immediate`) e grava em `reports.ai_classification` / `ai_classification_rationale`.
- `reports` tem `status`/`urgency` livres em texto, sem máquina de estados, sem SLA, sem subtratativas, sem pilares psicossociais.
- Perfis existentes: `admin`, `company`, `sst`, `pending`, `partner`, `affiliate`, `apurador`, `comite`, `dpo`.
- Já existem: validação de vínculo por CPF (hash), `soc_employees`, `report_access_audit`, escalonamento 4D.

---

## 1. Banco de dados

**Novos enums**
- `competencia_denuncia`: SST_NR1, EMPRESA_CLIENTE, DENUNCIA_MISTA, INFORMACOES_INSUFICIENTES
- `risco_imediato`: SIM, NAO, INDETERMINADO
- `prioridade_denuncia`: CRITICA, ALTA, MODERADA, BAIXA
- `pilar_psicossocial`: PT-00 … PT-06
- `estado_denuncia`: os 20 estados da máquina (RECEBIDA … ARQUIVADA)
- `app_role` += `triador_sst`, `medico_trabalho`

**Colunas novas em `reports`**
`estado`, `competencia`, `risco_grave_imediato`, `prioridade`, `pilares` (array), `parte_amo`, `parte_empresa`, `confianca_ia`, `dados_faltantes` (jsonb), `documentos_sugeridos` (jsonb), `trechos_relevantes` (jsonb), `acao_recomendada` (jsonb), `versao_classificacao`, `classificado_por`, `classificado_em`, `justificativa_humana`, `triador_id`.

**Tabelas novas**
- `subtratativas` (denúncia mista: escopo AMO / EMPRESA, responsável, estado, prazo, conclusão)
- `classificacao_versoes` (versionamento imutável de cada classificação IA/humana, com autor e justificativa)
- `solicitacoes_evidencia` (documento pedido, responsável, prazo, status, anexo vinculado)
- `analises_tecnicas` (parecer AMO: pilares confirmados, evidências avaliadas, conclusão, recomendações)
- `planos_acao` (ação, responsável, prazo, status, evidência de conclusão, tipo corretivo/preventivo)
- `sla_prazos` (evento, início, limite, pausas, retomadas, conclusão, atraso)
- `comunicacoes` (destinatário, canal, template, data, status de entrega)
- `eventos_auditoria` (ator, ação, entidade, antes/depois, IP, timestamp) — insert-only
- `parametros_canal` (parametrização PD-001..PD-015 por empresa, com defaults globais)
- `feriados` (calendário de dias úteis por empresa/UF)

**Migração de dados**: 4A→SST_NR1 (PT-02 default), 4B→EMPRESA_CLIENTE (PT-00), 4C→DENUNCIA_MISTA, 4D→SST_NR1 + risco SIM + prioridade CRITICA. Status atual mapeado para estados (`pendente`→AGUARDANDO_TRIAGEM, `em_andamento`→EM_ANALISE_TECNICA_AMO, `resolvido`→ENCERRADA).

**RLS por perfil** conforme §perfis_e_permissoes: triador vê fila e classifica; comitê vê acompanhamento com log de acesso; empresa vê só a subtratativa dela e dados minimizados; médico do trabalho vê apenas casos PT-05 encaminhados; nenhum perfil não-AMO lê CPF/hash.

---

## 2. Motor de IA (`classify-report-ai` reescrito)

- **Pré-processamento** obrigatório antes do envio: remoção de CPF, telefone, e-mail, matrícula; substituição de nomes por `[GESTOR]`, `[COLEGA]`, `[DENUNCIANTE]`; sem resumo prévio.
- **Prompt** implementando a `ordem_de_decisao` de 7 passos, as 4 classificações CL-01..CL-04, critérios de risco grave/imediato, os 7 pilares com seus limites (PT-04 nunca confirma assédio juridicamente), o `mapa_de_evidencias` (9 grupos) e a linguagem obrigatória (técnica, sem diagnóstico, sem julgamento de mérito).
- **Saída em JSON schema estrito** exatamente igual a `schema_saida_ia` (13 campos obrigatórios, `validacao_humana: "OBRIGATORIA"`).
- **Validador determinístico em código** aplicando o `allOf`: SST_NR1 e MISTA exigem ≥1 pilar e proíbem PT-00; EMPRESA_CLIENTE só PT-00; INFORMACOES_INSUFICIENTES exige `dados_faltantes`; risco SIM força prioridade CRITICA. Saída inválida → estado AGUARDANDO_VALIDACAO_HUMANA com flag de falha, nunca encaminhamento automático.
- Risco SIM → `ALERTA_CRITICO_ATIVO` + `escalate-report` imediato, sem interromper a classificação.
- Modelo: `google/gemini-3.6-flash` via Lovable AI.

---

## 3. Máquina de estados (`report-transition`)
Edge function única que valida cada transição contra a tabela de transições da spec e aplica os 5 bloqueios (sem encerrar com subtratativa aberta, sem validação humana, sem evidências, sem alteração silenciosa de classificação, sem reabertura sem justificativa). Toda transição grava `eventos_auditoria` e abre/fecha prazos de SLA.

## 4. Motor de SLA (`sla-runner`, cron)
Prazos normativos: recebimento 2 du, triagem 5 du, empresa caso grave imediato, empresa demais 3 du, apuração AMO 15 du após evidências. Calendário de dias úteis configurável, pausa auditada, alerta pré-vencimento e marcação automática de atraso.

## 5. Frontend
- **Triagem (`TriagemAMO.tsx`)** reescrita: fila por prioridade, sugestão da IA lado a lado com formulário humano (competência, risco, prioridade, pilares, justificativa obrigatória), botões Confirmar / Reclassificar / Solicitar complementação. Cada gravação cria nova versão.
- **Detalhe da denúncia**: abas Classificação, Subtratativas, Evidências, Análise técnica, Plano de ação, Linha do tempo/Auditoria.
- **Painel empresa**: só a parte de competência da empresa, minimizada; sem CPF, sem identidade anônima; confirmação de recebimento e registro de providências.
- **Painel psicossocial**: indicadores por pilar/unidade/GHE com supressão quando o grupo for pequeno (PD-013, mínimo 5 pessoas).
- **Formulário do denunciante**: campos faltantes da spec (data/período, local, pessoas envolvidas, testemunhas, evidências disponíveis, risco imediato informado, autorização de contato, aceite de política e declaração de boa-fé).
- **Master → Parametrização**: tela para os 15 itens PD-001..PD-015.

## 6. Defaults adotados (PD-001..PD-015)
Confiança mínima 70% (abaixo disso sinaliza baixa confiança); ALTA para risco INDETERMINADO, MODERADA para NAO, BAIXA só por decisão humana; prazo de complementação 7 dias corridos com 2 lembretes; anexos até 20 MB, máx. 10, PDF/imagem/áudio/office; feriados nacionais; 1 aprovador (ADMIN_CANAL_AMO ou COMITE) para encerramento; retenção 5 anos para denúncias e 6 meses para hash de CPF; notificação por e-mail; supressão de indicadores com <5 pessoas no grupo. Todos editáveis na tela de parametrização.

---

## Ordem de execução
1. Migração (enums, colunas, tabelas, RLS, grants, migração dos dados 4A-4D).
2. Motor de IA + validador de schema.
3. Máquina de estados + auditoria.
4. SLA + notificações.
5. Telas: triagem, detalhe, empresa, psicossocial, parametrização.
6. Formulário do denunciante completo.
7. Casos de teste de homologação da spec rodados sobre denúncias sintéticas.

## Fora do escopo
- Integração de WhatsApp/SMS (só e-mail e notificação interna).
- Antivírus de anexos (validação de tipo/tamanho apenas).
- MFA/provedor de identidade externo (PD-014 fica como parâmetro documentado).
