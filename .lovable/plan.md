# Contrato de Prestação de Serviços: Agência Mundi x Grupo AMO (Ouvidoria AMO)

## Entrega
Um contrato completo em português, com redação jurídica formal, em **DOCX (editável) e PDF**, salvo em Arquivos. Nada muda no app.

## Partes
- **CONTRATADA:** Agência Mundi, que fornece e opera a plataforma.
- **CONTRATANTE:** Grupo AMO, que usa a plataforma com as empresas-clientes dele.
- Razão social, CNPJ, endereço e representantes ficam como campos para preencher, por exemplo [CNPJ], salvo se você me passar esses dados antes.

## Estrutura das cláusulas
1. **Definições:** Plataforma, Empresa Cadastrada, Manifestação, Usuário Master, Custos Variáveis, Dados Pessoais e outros termos.
2. **Objeto:** licença de uso (SaaS), sem exclusividade e sem transferir a propriedade da plataforma "Ouvidoria AMO".
3. **Funcionalidades contratadas, em detalhe:**
   - Canal de manifestações por empresa (link/QR pelo CNPJ), com opção anônima e código de acompanhamento.
   - Assistente virtual "Ana", com triagem por IA (4A, 4B, 4B-CR, 4C e informação insuficiente), sinalização de urgência e revisão humana obrigatória.
   - Integração com o SOC: sincronização de colaboradores e validação de vínculo por CPF, guardado em hash.
   - Painéis Master, Gestora SST, Empresa, Triagem AMO e Usuários Internos, com prazos (SLA), planos de ação e trilha de auditoria.
   - Perfis por empresa: Principal, Apurador, Comitê, DPO, Visualizador e Gestor de Usuários.
   - Integração com o app parceiro (webhook assinado e API), convites por e-mail e notificações.
   - Aceite dos termos legais registrado como evidência e declaração de conflito de interesse.
   - Cadastro em lote de empresas e painel de consumo de IA.
4. **Preço e forma de cálculo:**
   - **R$ 1,00 por empresa cadastrada** e ativa na base, contada no último dia do mês.
   - **Mais os custos variáveis** de uso das APIs (IA, e-mail e outras), apurados no fechamento do mês pelo valor que aparece no painel do Usuário Master, que vale como fonte oficial da medição.
   - Ciclo de faturamento: fechamento, envio do demonstrativo, prazo para contestar, vencimento, multa, juros e reajuste anual (IPCA).
5. **Obrigações da Contratada:** disponibilidade, suporte, manutenção, backups e segurança.
6. **Obrigações da Contratante:** uso correto, conteúdo, cadastros, gestão de usuários e pagamento.
7. **Nível de serviço (SLA):** meta de disponibilidade, janelas de manutenção e prazos de atendimento por gravidade.
8. **Proteção de dados (LGPD):** a Contratante é controladora e a Contratada é operadora. Inclui subprocessadores (infraestrutura em nuvem e IA, Resend), transferência internacional, aviso de incidentes, retenção e descarte, com referência ao Acordo de Tratamento de Dados (DPA) já elaborado.
9. **Confidencialidade.**
10. **Propriedade intelectual.**
11. **Limitação de responsabilidade:** a IA é apenas um apoio e a decisão final é sempre humana.
12. **Vigência e rescisão:** 12 meses com renovação automática, aviso prévio, rescisão por descumprimento e devolução/exportação dos dados.
13. **Anticorrupção.**
14. **Disposições gerais e foro.**
15. **Assinaturas e testemunhas.**
- **Anexos:** I (descrição técnica da plataforma), II (tabela de preços e exemplo de cálculo), III (SLA), IV (referência ao DPA).

## Detalhes técnicos
- O DOCX será gerado com docx-js (A4, Arial, cláusulas numeradas e tabelas nos anexos), depois validado e convertido para PDF pelo LibreOffice.
- Todas as páginas serão revisadas visualmente antes da entrega.
- Arquivos: `/mnt/documents/contrato-agencia-mundi-grupo-amo.docx` e `.pdf`.

## Pontos a confirmar (se não confirmados, entram como campos para preencher)
- Dados das partes (CNPJ, endereço, representantes).
- Dia de vencimento da fatura, foro (sugestão: São Paulo/SP) e vigência (sugestão: 12 meses).
