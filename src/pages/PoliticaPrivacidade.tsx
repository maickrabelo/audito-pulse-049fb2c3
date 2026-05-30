import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import usePageSEO from '@/hooks/usePageSEO';

const PoliticaPrivacidade = () => {
  usePageSEO({
    title: 'Política de Privacidade — SOIA | Agência Mundi',
    description: 'Política de Privacidade do canal de denúncias SOIA da Agência Mundi, em conformidade com a LGPD (Lei nº 13.709/2018).',
  });

  return (
    <LegalLayout title="Política de Privacidade" updatedAt="27 de maio de 2026">
      <p>
        Esta Política de Privacidade descreve como o <strong>Agência Mundi</strong>, por meio da
        plataforma <strong>SOIA — Sistema de Ouvidoria Inteligente</strong>, coleta, utiliza,
        armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de
        Dados Pessoais (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Papéis no tratamento</h2>
      <p>
        A empresa contratante (cliente) atua como <strong>Controladora</strong> dos dados
        coletados em seu canal de denúncias. A Agência Mundi atua como <strong>Operador</strong>,
        tratando dados em nome e conforme instruções da Controladora.
      </p>

      <h2>2. Dados coletados</h2>
      <h3>2.1 Denúncias anônimas</h3>
      <ul>
        <li>Conteúdo do relato (título, descrição, categoria);</li>
        <li>Anexos voluntariamente enviados pelo denunciante;</li>
        <li>Código de rastreamento (tracking code) gerado automaticamente;</li>
        <li>Data e hora do envio.</li>
      </ul>
      <h3>2.2 Denúncias identificadas (opcional)</h3>
      <ul>
        <li>Nome, e-mail e telefone do denunciante, quando voluntariamente informados.</li>
      </ul>
      <h3>2.3 Usuários gestores (empresa, SST, administradores)</h3>
      <ul>
        <li>Nome, e-mail corporativo, função, empresa vinculada;</li>
        <li>Credenciais de acesso (senha criptografada — bcrypt);</li>
        <li>Registros de acesso (logs) com IP, user-agent e timestamp.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Receber, registrar e tratar denúncias e manifestações;</li>
        <li>Permitir o acompanhamento da denúncia pelo denunciante por meio do código de rastreamento;</li>
        <li>Permitir a gestão das denúncias pelos responsáveis designados pela Controladora;</li>
        <li>Cumprir obrigações legais e regulatórias, inclusive a NR-01 quanto a riscos psicossociais;</li>
        <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
      </ul>

      <h2>4. Bases legais (art. 7º e 11 da LGPD)</h2>
      <ul>
        <li><strong>Cumprimento de obrigação legal/regulatória</strong> — canal de denúncias, NR-01;</li>
        <li><strong>Execução de contrato</strong> — entre Controladora e Operador;</li>
        <li><strong>Legítimo interesse</strong> — apuração de irregularidades e segurança;</li>
        <li><strong>Consentimento</strong> — quando o denunciante opta por se identificar.</li>
      </ul>

      <h2>5. Anonimato</h2>
      <p>
        Quando o denunciante opta pela denúncia anônima, a plataforma <strong>não coleta</strong>{' '}
        IP, identificadores de dispositivo ou metadados que permitam sua identificação. O
        acompanhamento ocorre exclusivamente por meio de código de rastreamento gerado no envio.
      </p>

      <h2>6. Compartilhamento</h2>
      <p>Os dados podem ser compartilhados com:</p>
      <ul>
        <li>Responsáveis indicados pela Controladora para apuração;</li>
        <li>Subprocessadores estritamente necessários à operação (infraestrutura em nuvem, e-mail transacional, gateway de IA, gateway de pagamento);</li>
        <li>Autoridades públicas, mediante requisição legal.</li>
      </ul>

      <h2>7. Subprocessadores</h2>
      <ul>
        <li><strong>Supabase / AWS</strong> — banco de dados, autenticação e storage;</li>
        <li><strong>Lovable AI Gateway</strong> — análise inteligente de denúncias;</li>
        <li><strong>Resend</strong> — envio de notificações por e-mail;</li>
        <li><strong>Stripe</strong> — processamento de pagamentos de assinatura.</li>
      </ul>

      <h2>8. Retenção</h2>
      <p>
        Os prazos de retenção são definidos pela Controladora em sua{' '}
        <a href="/politica-de-retencao">Política de Retenção</a>, observando as obrigações legais
        aplicáveis e o tempo estritamente necessário para o cumprimento das finalidades.
      </p>

      <h2>9. Direitos do titular (art. 18 LGPD)</h2>
      <p>O titular pode solicitar, a qualquer tempo:</p>
      <ul>
        <li>Confirmação da existência de tratamento;</li>
        <li>Acesso aos dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
        <li>Portabilidade;</li>
        <li>Eliminação dos dados tratados com consentimento;</li>
        <li>Informação sobre compartilhamento;</li>
        <li>Revogação do consentimento.</li>
      </ul>
      <p>
        As solicitações devem ser direcionadas ao Encarregado pelo e-mail{' '}
        <a href="mailto:dpo@agenciamundi.com">dpo@agenciamundi.com</a>.
      </p>

      <h2>10. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais detalhadas em nossa{' '}
        <a href="/politica-de-seguranca">Política de Segurança da Informação</a>, incluindo
        criptografia em trânsito (TLS 1.2+) e em repouso (AES-256), Row-Level Security (RLS),
        autenticação multifator (MFA TOTP) e registro de acessos.
      </p>

      <h2>11. Encarregado pelo Tratamento de Dados (DPO)</h2>
      <p>
        E-mail: <a href="mailto:dpo@agenciamundi.com">dpo@agenciamundi.com</a>
      </p>

      <h2>12. Alterações desta Política</h2>
      <p>
        Esta Política poderá ser atualizada a qualquer tempo. A versão vigente estará sempre
        disponível nesta página com a data de última atualização.
      </p>
    </LegalLayout>
  );
};

export default PoliticaPrivacidade;
