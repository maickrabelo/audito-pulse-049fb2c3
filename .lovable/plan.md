## Problema

Quando o denunciante informa o nome do acusado (ex: "Sandra Brito, setor de qualidade"), a IA Ana está tratando o denunciante como se fosse o acusado ("Agradeço por compartilhar, Sandra Brito..."). Isso é um erro grave de contexto que compromete a confidencialidade e a qualidade da denúncia.

## Causa

O system prompt em `supabase/functions/chat-report/index.ts` não deixa explícito para o modelo (Gemini 2.5 Flash) que:
- Quem escreve é sempre o DENUNCIANTE
- Nomes citados nas mensagens são de ACUSADOS, TESTEMUNHAS ou TERCEIROS — nunca do usuário
- A IA nunca deve se dirigir ao usuário usando um nome mencionado na conversa

## Correção

Editar apenas o system prompt em `supabase/functions/chat-report/index.ts` reforçando regras de identidade e tratamento:

1. **Regra de identidade** (bem no topo, alta prioridade):
   - "O usuário desta conversa é SEMPRE o denunciante (a vítima ou testemunha do fato)."
   - "Qualquer nome, cargo ou setor citado pelo usuário refere-se a OUTRAS pessoas: acusados, testemunhas ou envolvidos. NUNCA são o próprio usuário."
   - "NUNCA se dirija ao usuário usando um nome mencionado na conversa. Não use vocativos com nome próprio."

2. **Regra de tratamento**:
   - Tratar o usuário sempre como "você", sem nome
   - Ao confirmar informações sobre o acusado, usar formulações como "Entendi, então a pessoa envolvida seria [Nome], do setor [X]. Correto?" — deixando claro que é sobre um terceiro

3. **Exemplos corretos e incorretos** adicionados ao prompt para reforçar (few-shot):
   - ❌ Errado: "Agradeço por compartilhar, Sandra Brito..."
   - ✅ Certo: "Obrigada por informar. Registrei que a conduta envolveu Sandra Brito, do setor de qualidade. Há mais algo que gostaria de acrescentar?"

4. **Reforço de anonimato**: lembrar a IA de que ela não sabe (e não deve assumir) a identidade do denunciante, mesmo que a denúncia seja identificada — o nome do denunciante nunca aparece na conversa como remetente.

## Escopo

- Arquivo único: `supabase/functions/chat-report/index.ts` (apenas o bloco `content` do system message)
- Nenhuma mudança de modelo, fluxo, UI, banco ou lógica de negócio
- Deploy automático da edge function após a edição

## Detalhes técnicos

Modelo permanece `google/gemini-2.5-flash`. O prompt continuará em português, manterá o fluxo de 7 etapas já existente, e apenas ganhará uma nova seção "IDENTIDADE DO USUÁRIO" no topo + exemplos negativos. Isso é suficiente para o Gemini corrigir o comportamento sem necessidade de fine-tuning ou troca de modelo.