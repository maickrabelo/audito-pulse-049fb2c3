import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import usePageSEO from '@/hooks/usePageSEO';

const PoliticaSeguranca = () => {
  usePageSEO({
    title: 'Política de Segurança da Informação — SOIA | Agência Mundi',
    description: 'Política de Segurança da Informação da plataforma SOIA, com medidas técnicas e organizacionais em conformidade com a LGPD.',
  });

  return (
    <LegalLayout title="Política de Segurança da Informação" updatedAt="27 de maio de 2026">
      <p>
        Esta Política descreve as medidas técnicas e organizacionais adotadas pela Agência Mundi
        para proteger as informações tratadas na plataforma SOIA, em conformidade com o art. 46
        da LGPD.
      </p>

      <h2>1. Princípios</h2>
      <ul>
        <li>Confidencialidade, integridade e disponibilidade;</li>
        <li>Privacidade desde a concepção (Privacy by Design);</li>
        <li>Minimização de dados;</li>
        <li>Princípio do menor privilégio.</li>
      </ul>

      <h2>2. Criptografia</h2>
      <ul>
        <li><strong>Em trânsito:</strong> TLS 1.2 ou superior em todas as conexões;</li>
        <li><strong>Em repouso:</strong> AES-256 no banco de dados e no storage de anexos;</li>
        <li><strong>Senhas:</strong> hash bcrypt com salt, nunca armazenadas em texto claro.</li>
      </ul>

      <h2>3. Controle de acesso</h2>
      <ul>
        <li>Autenticação por e-mail e senha com política de complexidade;</li>
        <li>Autenticação multifator (MFA TOTP) disponível para todos os perfis privilegiados;</li>
        <li>Segregação de papéis: Master, SST, Empresa e acesso público de denunciante;</li>
        <li><strong>Row-Level Security (RLS)</strong> aplicada em todas as tabelas com dados sensíveis;</li>
        <li>Tokens JWT de curta duração e rotação de refresh tokens.</li>
      </ul>

      <h2>4. Registro de acessos (logs)</h2>
      <p>
        A plataforma registra eventos de autenticação e acesso a dados sensíveis (tabela
        <code> access_logs</code>) por meio do hook <code>useAccessLogger</code>, contendo
        identificador de usuário, papel, IP, user-agent e timestamp. Logs são retidos pelo
        prazo definido na Política de Retenção.
      </p>

      <h2>5. Infraestrutura</h2>
      <ul>
        <li>Hospedagem em provedor cloud certificado (ISO 27001, SOC 2);</li>
        <li>Backups automatizados diários com retenção configurada;</li>
        <li>Buckets de storage privados por padrão; buckets públicos somente para ativos institucionais;</li>
        <li>Edge functions executadas em ambiente isolado, com segredos gerenciados via cofre.</li>
      </ul>

      <h2>6. Segurança no desenvolvimento</h2>
      <ul>
        <li>Revisão de código obrigatória;</li>
        <li>Validação de entrada com schemas (Zod) no front-end e em edge functions;</li>
        <li>Gerenciamento de dependências com auditoria automatizada;</li>
        <li>Ambientes segregados (desenvolvimento, homologação, produção).</li>
      </ul>

      <h2>7. Anonimato do denunciante</h2>
      <p>
        Quando o denunciante opta pelo modo anônimo, a aplicação não coleta nem armazena IP,
        identificadores de dispositivo ou metadados de navegação. O vínculo com a denúncia é
        feito exclusivamente pelo <strong>código de rastreamento</strong> entregue ao
        denunciante no momento do envio.
      </p>

      <h2>8. Gestão de incidentes</h2>
      <p>
        Incidentes de segurança são tratados conforme o <strong>Plano de Resposta a
        Incidentes</strong>, com notificação à ANPD e aos titulares em prazo razoável, nos
        termos do art. 48 da LGPD.
      </p>

      <h2>9. Testes de segurança</h2>
      <p>
        Avaliações periódicas de vulnerabilidades e testes de intrusão (pentest) podem ser
        conduzidos por terceiros independentes. O relatório consolidado é mantido em caráter
        confidencial e disponibilizado mediante NDA.
      </p>

      <h2>10. Conscientização</h2>
      <p>
        Colaboradores com acesso a dados pessoais recebem orientação sobre LGPD, sigilo e boas
        práticas de segurança, com termos de confidencialidade assinados.
      </p>

      <h2>11. Contato</h2>
      <p>
        Comunicações de segurança: <a href="mailto:dpo@agenciamundi.com">dpo@agenciamundi.com</a>
      </p>
    </LegalLayout>
  );
};

export default PoliticaSeguranca;
