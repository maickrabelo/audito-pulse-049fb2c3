# Plano: Documentação LGPD + Páginas Legais no Site

## 1. Gerar 10 documentos LGPD (PT-BR)

Salvos em `/mnt/documents/lgpd-soia/` nos formatos `.docx` (via `docx-js`) e `.pdf` (via LibreOffice), mais um `lgpd-soia-pacote-completo.zip`:

1. Política de Privacidade
2. Termos de Uso
3. DPA — Data Processing Agreement
4. Política de Segurança da Informação
5. Plano de Resposta a Incidentes
6. Política de Retenção de Dados
7. Relatório de Pentest (template em branco)
8. RIPD/DPIA
9. Inventário de Dados (ROPA)
10. Fluxo de Tratamento de Dados

**Regra de preenchimento:** itens não formalizados (prazos exatos, região AWS, SLA, RPO/RTO, cláusulas contratuais, resultado de pentest) ficam em branco ou marcados como "a ser preenchido pelo controlador/jurídico".

**Dados confirmados:**
- Controlador: empresa cliente · Operador: Grupo AMO (SOIA)
- Encarregado/DPO: **dpo@agenciamundi.com**

## 2. Publicar 4 páginas legais no site

Novas páginas React em `src/pages/`:
- `/politica-de-privacidade` → `PoliticaPrivacidade.tsx`
- `/termos-de-uso` → `TermosDeUso.tsx`
- `/politica-de-seguranca` → `PoliticaSeguranca.tsx`
- `/politica-de-retencao` → `PoliticaRetencao.tsx`

Cada página: `Navbar` + conteúdo semântico (mesmo texto dos .docx) + `Footer` + SEO via `usePageSEO`.

## 3. Atualizar `src/App.tsx`

Registrar as 4 novas rotas.

## 4. Atualizar `src/components/Footer.tsx`

Adicionar coluna "Legal" com os 4 links (via `react-router-dom` `Link`) e exibir contato do Encarregado: `dpo@agenciamundi.com`.

## 5. Atualizar `src/pages/ReportForm.tsx`

Trocar os `href="#"` de Política de Privacidade e Termos de Uso pelas rotas reais.

## Entregáveis

- 10 `.docx` + 10 `.pdf` + 1 `.zip` em `/mnt/documents/lgpd-soia/`
- 4 páginas legais acessíveis publicamente
- Rodapé com seção Legal + contato do DPO
