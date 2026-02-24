
## Sistema de Logs de Acesso no Painel Master

### Objetivo
Criar uma aba "Logs" no painel administrativo (`/master-dashboard`) que registra e exibe todas as atividades de acesso e erros do sistema em tempo real, incluindo: usuário, horário, rota acessada, ação realizada e erros ocorridos.

---

### Como os logs serão capturados

O sistema será composto por três camadas de captura:

**1. Logs de Login/Logout** — registrados no `RealAuthContext.tsx` a cada evento `SIGNED_IN` e `SIGNED_OUT`.

**2. Logs de Navegação entre Páginas** — um hook global `useAccessLogger` captura mudanças de rota via `react-router-dom` e envia o log ao banco.

**3. Logs de Erros de Página** — um componente `ErrorBoundary` captura falhas de carregamento (como o travamento do formulário HSE-IT) e registra automaticamente o erro com stack trace.

---

### Estrutura do Banco de Dados

Uma nova tabela `access_logs` será criada via migration:

```text
access_logs
├── id              (uuid, PK)
├── user_id         (uuid, nullable — anônimo para não autenticados)
├── user_email      (text, nullable — desnormalizado para facilitar leitura)
├── user_role       (text, nullable)
├── event_type      (text) — 'login' | 'logout' | 'page_view' | 'error' | 'api_error'
├── page_path       (text, nullable) — rota acessada ex: /hseit/form/xxx
├── error_message   (text, nullable) — mensagem do erro se houver
├── error_stack     (text, nullable) — stack trace do erro
├── metadata        (jsonb, nullable) — dados extras (ex: browser, device)
└── created_at      (timestamptz, default now())
```

**RLS:** Somente admins podem fazer SELECT. O INSERT usa a service role via edge function para garantir que qualquer evento (inclusive de usuários não autenticados) seja registrado.

---

### Arquitetura da Solução

```text
Navegador do usuário
        │
        ├─► useAccessLogger (hook global no App.tsx)
        │       └─► captura mudanças de rota e registra page_view
        │
        ├─► RealAuthContext.tsx
        │       └─► captura login/logout e registra eventos de auth
        │
        └─► ErrorBoundary (wrapper nas páginas)
                └─► captura erros de render e registra event_type=error
                        │
                        ▼
              Edge Function: log-access
                  (aceita eventos do frontend, salva na tabela access_logs
                   usando service role — sem necessidade de auth do usuário)
                        │
                        ▼
              Tabela: access_logs (banco de dados)
                        │
                        ▼
              Aba "Logs" no MasterDashboard
                  (filtros por tipo, busca por email, paginação)
```

---

### Componentes a Criar / Modificar

**Novos arquivos:**
- `supabase/functions/log-access/index.ts` — edge function que recebe eventos e grava na tabela usando service role (necessário para registrar eventos de usuários anônimos também)
- `src/hooks/useAccessLogger.ts` — hook que escuta mudanças de rota e dispara logs de `page_view`
- `src/components/admin/AccessLogsTab.tsx` — componente da aba de logs no MasterDashboard

**Arquivos modificados:**
- `src/App.tsx` — adiciona o hook `useAccessLogger` globalmente dentro do provider de autenticação
- `src/contexts/RealAuthContext.tsx` — adiciona chamada de log nos eventos `SIGNED_IN` e `SIGNED_OUT`
- `src/pages/MasterDashboard.tsx` — adiciona a nova aba "Logs" na lista de tabs

---

### Interface da Aba Logs

A tela exibirá:
- Filtro por tipo de evento: Todos | Login | Logout | Navegação | Erro
- Campo de busca por email do usuário
- Filtro de período (hoje / últimos 7 dias / últimos 30 dias)
- Tabela com colunas: **Horário | Usuário | Perfil | Evento | Página | Erro**
- Linhas de erro destacadas em vermelho claro
- Paginação (50 registros por página)
- Botão de exportar CSV

---

### Segurança e Performance

- A edge function `log-access` usará a **SUPABASE_SERVICE_ROLE_KEY** para escrever, portanto nenhuma permissão especial é necessária para o usuário logado
- O frontend enviará os logs de forma **assíncrona e sem bloquear** a navegação (fire-and-forget)
- Erros no próprio sistema de log são silenciados para não impactar a experiência do usuário
- A tabela terá um índice em `created_at` para queries rápidas
- Logs antigos podem ser purgados automaticamente com uma function agendada (não incluído nesta implementação inicial)

---

### Ordem de Implementação

1. Migration SQL — cria tabela `access_logs` com RLS
2. Edge Function `log-access` — recebe e salva eventos
3. Hook `useAccessLogger` — captura navegações de página
4. Modificar `RealAuthContext` — adicionar logs de login/logout
5. Modificar `App.tsx` — registrar o hook globalmente
6. Criar componente `AccessLogsTab` — interface visual da aba
7. Modificar `MasterDashboard` — adicionar a nova aba "Logs"
