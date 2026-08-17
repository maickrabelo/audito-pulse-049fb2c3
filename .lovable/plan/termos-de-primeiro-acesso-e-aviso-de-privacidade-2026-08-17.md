# Termos de primeiro acesso e Aviso de Privacidade

Implantar o aceite eletrônico obrigatório dos Documentos 02 (usuário da Empresa Cliente), 03 (usuário Grupo AMO) e 04 (Aviso de Privacidade ao manifestante), com evidências auditáveis, além da confirmação de ausência de conflito de interesse por caso.

## 1. Repositório de documentos versionados

Uma área central guarda cada documento com título, versão, data de vigência, conteúdo integral e um hash do conteúdo. Publicar uma nova versão nunca altera nem apaga as anteriores — o histórico e as evidências de aceite ficam intactos.

Carga inicial: Documentos 02, 03 e 04, versão 1.0, vigência 14/08/2026, com o texto integral dos arquivos enviados. O Documento 01 (Painel Administrativo) fica de fora nesta entrega; a estrutura já suporta cadastrá-lo depois sem nova programação.

## 2. Bloqueio de acesso ao Canal de Escuta

Após o login, antes de liberar qualquer funcionalidade, o sistema verifica se o usuário já aceitou a versão vigente do termo do seu grupo:

- Perfis da Empresa Cliente (usuário principal, Apurador/Tratador, Comitê Confidencial, DPO/Jurídico, Visualizador) → Documento 02.
- Perfis Grupo AMO (admin, triagem SST, apurador AMO, comitê, DPO, médico do trabalho) → Documento 03.

Enquanto não houver aceite, uma tela de bloqueio em modal exibe: título, versão, data de vigência e o conteúdo integral com rolagem. As caixas de confirmação começam desmarcadas; o botão "ACEITAR E CONTINUAR" só habilita depois de todas marcadas. Existe também "NÃO ACEITAR E SAIR", que encerra a sessão e mantém o acesso bloqueado.

Novo aceite é exigido quando: nova versão vigente do documento, mudança de perfil do usuário, ou solicitação manual registrada pela administração. O texto vigente fica sempre disponível para consulta no menu do usuário.

## 3. Evidências registradas

Cada aceite ou recusa grava: usuário (id, nome, e-mail), empresa vinculada, perfil e permissões no momento do ato, documento (título, versão, vigência, hash), data/hora com fuso, caixas marcadas, resultado (aceite/recusa), IP, navegador/dispositivo e identificador de sessão, além do motivo que gerou a solicitação de novo aceite. Os registros são somente-inclusão: não podem ser editados nem excluídos pela aplicação.

No painel master haverá uma listagem dessas evidências com filtros e exportação em CSV.

## 4. Conflito de interesse por caso

Ao abrir uma manifestação pela primeira vez, o usuário confirma ausência de conflito de interesse. Se declarar impedimento:

- o caso é bloqueado para aquele usuário (não abre mais o conteúdo);
- fica sinalizado para redirecionamento ao responsável adequado;
- o evento é registrado na trilha de auditoria.

## 5. Aviso de Privacidade ao manifestante (Doc 04)

No início do formulário/chatbot, antes do envio: resumo objetivo do Aviso, link abrindo a versão integral no mesmo ambiente, e caixa de ciência (não é consentimento geral). A autorização para contato continua separada e opcional — recusá-la não impede o registro.

O texto de orientação reforça: descrever apenas o necessário, sem CPF, documentos pessoais, diagnósticos ou dados pessoais de terceiros.

A manifestação enviada guarda a versão e o hash do Aviso exibido. Uma página pública passa a hospedar o Aviso integral com versão e vigência visíveis.

## 6. Registros de auditoria do Canal

Ampliar a trilha existente para cobrir visualizações, alterações, encaminhamentos, decisões, downloads, exportações, mudanças de perfil e acessos emergenciais, com autor, data/hora e caso relacionado.

## Detalhes técnicos

- Novas tabelas: `legal_documents` (código, versão, título, vigência, conteúdo, hash SHA-256, ativo) e `legal_acceptances` (usuário, documento_versão, perfil, checkboxes, resultado, IP/UA/sessão, motivo), com RLS: usuário lê os próprios registros; equipe AMO lê todos; sem update/delete. Tabela `case_conflict_declarations` (report_id, user_id, resultado, justificativa) com bloqueio via política de leitura em `reports`.
- Gate implementado em `RealAuthContext` + um componente `TermsGate` envolvendo as rotas autenticadas, na mesma linha do fluxo `must_change_password` já existente.
- Captura de IP e user-agent por edge function `record-legal-acceptance` (hash validado no servidor, cliente não define o resultado).
- Aviso ao manifestante integrado em `ReportWizard.tsx`/`ReportChatContent.tsx`; campos de versão/hash adicionados em `reports`.
- Página pública `/aviso-de-privacidade-canal` renderizando a versão vigente do Doc 04.
