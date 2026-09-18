# Integração com o outro app: gestor de usuários da empresa

Objetivo: o outro app cria um "gestor de usuários" aqui via webhook; esse gestor só vê uma tela de cadastro de usuários da empresa dele; os usuários criados recebem convite por e-mail; e o outro app é avisado automaticamente do status de cada usuário.

## Fluxo geral

```text
Outro app  --(1) webhook criar gestor-->  Ouvidoria AMO
                                            |
                                    e-mail de boas-vindas
                                    (link para criar senha)
                                            |
                              Gestor entra em /gestor-usuarios
                                            |
                          cria Apurador / Comitê / DPO / Visualizador
                                            |
                                   convite por e-mail a cada um
                                            |
Outro app  <--(4) webhook de status--  ativo / pendente
```

## 1. Webhook de entrada (criar o gestor)

Novo endpoint `partner-create-manager`, protegido por chave de acesso (cabeçalho `x-api-key`), no mesmo padrão das APIs que o parceiro já usa.

Recebe: identificador da empresa já cadastrada aqui, nome, e-mail e (opcional) o identificador do usuário no outro app.

O que faz:
- valida a chave e confere se a empresa existe;
- se o e-mail já existir, devolve o registro existente em vez de duplicar;
- cria o usuário com o papel de gestor de usuários, vinculado à empresa;
- marca o cadastro como **pendente** e envia o e-mail de boas-vindas com link para criar a senha;
- responde com o identificador do usuário e o status.

## 2. Painel exclusivo do gestor

Nova tela `/gestor-usuarios`, a única acessível para esse papel:
- lista os usuários da empresa com nome, e-mail, tipo e status (Pendente / Ativo);
- botão para convidar novo usuário (nome, e-mail, tipo);
- reenviar convite e remover usuário.

Restrições: sem acesso ao canal de ouvidoria, às manifestações, a relatórios ou a qualquer outro painel. Se tentar abrir outra página, é devolvido ao painel dele.

Tipos permitidos: Apurador, Comitê de Ética, DPO e Visualizador — mantendo a regra atual de **1 usuário por tipo por empresa**.

## 3. Convite por e-mail

Em vez de gerar senha na tela (como hoje), o usuário criado passa a receber um e-mail com link seguro e prazo de validade para definir a própria senha. Ao concluir, o status vira **Ativo**.
- Pendente: convite enviado, senha ainda não criada.
- Ativo: senha criada e primeiro acesso concluído.

Os convites saem pelo mesmo serviço de e-mail já usado hoje.

## 4. Retorno automático ao outro app (webhook de saída)

A cada mudança relevante (usuário convidado, ativado, reenviado, removido) enviamos uma chamada ao endereço que o outro app informar, com: empresa, nome, e-mail, tipo de usuário, status e data.

- Endereço de destino e chave de assinatura ficam guardados como configuração segura.
- Cada envio é assinado, registrado e reenviado automaticamente algumas vezes em caso de falha.
- Também deixamos uma consulta sob demanda (lista de usuários e status por empresa) como rede de segurança, caso o outro app perca um aviso.

## Detalhes técnicos

- **Banco**: novo valor `gestor_usuarios` no enum `app_role`; nova tabela `company_user_invites` (company_id, user_id, email, role, status, token_hash, expires_at, invited_by, external_user_id, timestamps) com RLS restrita ao gestor da própria empresa, ao usuário principal e ao master; nova tabela `integration_webhook_deliveries` (evento, payload, status, tentativas, resposta) para auditoria dos envios.
- **Edge functions**:
  - `partner-create-manager` (entrada, `x-api-key`, `verify_jwt = false`);
  - `manage-company-invites` (JWT do gestor/usuário principal: list, invite, resend, revoke) — reaproveita as validações de papel de `manage-company-users`, trocando senha gerada por convite;
  - `accept-invite` (público, valida token e define senha, marca `status = active`);
  - `notify-partner-user-status` (envio assinado com HMAC + retries), chamada pelas demais.
- **Segredos novos**: `PARTNER_WEBHOOK_URL` e `PARTNER_WEBHOOK_SECRET` (serão solicitados na implementação).
- **Frontend**: `src/pages/CompanyUserManager.tsx` (painel do gestor), `src/pages/AcceptInvite.tsx` (criar senha), rotas em `App.tsx` e redirecionamento do papel `gestor_usuarios` em `RealAuthContext.tsx`.
- **Compatibilidade**: `manage-company-users` e `CompanyUsers.tsx` continuam funcionando para o usuário principal; o status Pendente/Ativo passa a aparecer também lá.
- **Entrega ao parceiro**: documentação com URLs, formato das chamadas e exemplos de payload do webhook de saída.
