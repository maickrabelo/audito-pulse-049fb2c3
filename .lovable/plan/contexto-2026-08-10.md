Atualizar documentos LGPD com dados confirmados de subprocessadores

## Contexto
O DPO precisa das informações reais de hospedagem, IA e subprocessadores do app. Os dados foram confirmados na infraestrutura do projeto e agora precisam ser refletidos nos documentos oficiais.

## Dados confirmados para inserção nos documentos
- **Hospedagem e infraestrutura:** Lovable Cloud (backend Supabase, infraestrutura AWS), região `us-east-2` — armazenamento nos Estados Unidos.
- **Chatbot/IA:** Lovable AI Gateway (modelos Google Gemini/OpenAI via gateway Lovable) — processamento nos Estados Unidos.
- **E-mail transacional:** Resend — Estados Unidos.
- **Pagamentos:** Stripe — Estados Unidos.

## Alterações propostas

1. **Atualizar `src/pages/PoliticaPrivacidade.tsx`**
   - Substituir o item 7 "Subprocessadores" por uma lista com nome do fornecedor, função e país de processamento/armazenamento.
   - Garantir que o texto não mencione "Supabase" diretamente ao usuário final (usar "Lovable Cloud"), conforme diretriz de comunicação do projeto.

2. **Gerar DPA (Data Processing Agreement)**
   - Criar documento DOCX + PDF em `/mnt/documents/dpa-ouvidoria-amo.docx` e `/mnt/documents/dpa-ouvidoria-amo.pdf`.
   - Incluir: partes (Controladora/Empresa contratante, Operadora/Agência Mundi, subprocessadores), escopo do tratamento, medidas de segurança, direitos do titular, fluxo de dados internacional (EUA) e cláusulas contratuais/lgpd.

3. **Atualizar Termos de Uso (se necessário)**
   - Verificar se `src/pages/TermosDeUso.tsx` precisa de menção atualizada aos subprocessadores internacionais.

## Entregáveis
- Página de Política de Privacidade atualizada no app.
- DPA em DOCX e PDF disponível para download.
- (Opcional) Link na página `/politica-de-privacidade` apontando para o DPA.

## Como validar
- Revisar a página `/politica-de-privacidade` no preview.
- Baixar e abrir o DPA PDF para conferir seção de subprocessadores.
