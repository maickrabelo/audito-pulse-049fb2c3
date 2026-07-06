## Cadastro em Lote de Empresas (Painel SST)

### Objetivo
Permitir que a gestora SST cole uma tabela (copiada do Excel/Sheets) com várias empresas e cadastre todas de uma vez como "pendentes". O login da empresa só é gerado depois, quando a gestora informar o e-mail do responsável.

---

### 1. Novo botão no `SSTDashboard`
- Adicionar botão **"Cadastrar em Lote"** ao lado do atual "Cadastrar Empresa".
- Abre um novo dialog: `BulkAddCompaniesDialog`.

### 2. Dialog de colagem em lote (`BulkAddCompaniesDialog`)
- Textarea grande onde a gestora cola o conteúdo copiado (linhas separadas por quebra, colunas por TAB — formato padrão do Excel/Sheets).
- Formato esperado do cabeçalho (primeira linha, ignorada se presente):
  `Endereço  Cidade  UF  CEP  CNPJ  Razão Social`
- Parser:
  - Split por `\n`, cada linha split por `\t`.
  - Ignora linhas vazias e a linha de cabeçalho.
  - Extrai: endereço, cidade, UF, CEP, CNPJ (só dígitos → também vira `slug`), razão social (nome).
  - Monta `address` como `"{endereço}, {cidade}/{UF} - CEP {CEP}"`.
- Preview: tabela mostrando as linhas interpretadas antes de confirmar, com status por linha (ok / erro de parsing / CNPJ duplicado).
- Botão **"Cadastrar todas"**:
  - Para cada linha válida, insere em `companies` com:
    - `name`, `cnpj`, `address`, `slug` (= CNPJ só dígitos)
    - `subscription_status: 'pending'` (novo estado, sem login criado ainda)
    - `email: null`
  - Cria vínculo em `company_sst_assignments` com o `sst_manager_id` da gestora.
  - Mostra resumo ao final: X cadastradas, Y ignoradas (com motivo).
- Fecha e recarrega a lista.

### 3. Marcação visual "Pendente" na lista
- No `SSTDashboard`, empresas com `subscription_status === 'pending'` ganham:
  - Badge "Pendente cadastro" (cor de alerta).
  - Card destacado (borda amarela) para chamar atenção.
  - O toggle Ativa/Inativa fica desabilitado enquanto estiver pendente.
  - Botão principal do card muda para **"Completar cadastro"** (em vez de "Ver Dashboard").

### 4. Dialog de conclusão (`CompletePendingCompanyDialog`)
- Aberto ao clicar em "Completar cadastro".
- Mostra dados da empresa (nome, CNPJ, endereço) somente-leitura.
- Campo obrigatório: **E-mail do responsável**.
- Botão **"Gerar acesso"**:
  - Atualiza `companies`: `email = <informado>`, `subscription_status = 'active'`.
  - Chama a edge function existente `create-company-user` com `{ company_id, email, cnpj, company_name }` — ela já cria o usuário com senha = CNPJ (só dígitos) e força troca no primeiro acesso, seguindo o padrão atual do projeto.
  - Toast de sucesso mostrando: `login: <email>` / `senha inicial: <CNPJ digits> (trocar no primeiro acesso)`.
  - Fecha e recarrega lista.

### 5. Filtro/contador
- Adicionar um card de estatística "Pendentes" ao lado de "Empresas / Denúncias / Ativas".
- (Opcional, sem novo componente) o `filteredCompanies` já cobre a busca por nome/CNPJ, mantido igual.

---

### Detalhes técnicos
- **Sem migração de schema**: `subscription_status` é `text`, então o valor `'pending'` funciona sem alteração de banco. O código do dashboard trata `pending` explicitamente (não conta como ativa, badge próprio, botão diferente).
- **Sem novas edge functions**: reaproveita `create-company-user` já existente.
- **Sem alteração de business logic fora do fluxo SST**: nenhuma mudança em relatórios, dashboards de empresa, etc.
- **Arquivos novos**:
  - `src/components/sst/BulkAddCompaniesDialog.tsx`
  - `src/components/sst/CompletePendingCompanyDialog.tsx`
- **Arquivos alterados**:
  - `src/pages/SSTDashboard.tsx` (botão em lote, badge/estado pendente, botão "Completar cadastro", card de contagem de pendentes).

### Fora de escopo
- Não altera o fluxo do dialog "Cadastrar Empresa" individual atual.
- Não altera edge functions, RLS, ou schema do banco.
- Não altera páginas públicas de report ou dashboards da empresa final.
