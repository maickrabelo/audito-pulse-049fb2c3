import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import usePageSEO from '@/hooks/usePageSEO';

const PoliticaRetencao = () => {
  usePageSEO({
    title: 'Política de Retenção de Dados — Ouvidoria AMO | Agência Mundi',
    description: 'Política de Retenção de Dados da plataforma Ouvidoria AMO, com prazos e critérios de eliminação em conformidade com a LGPD.',
  });

  return (
    <LegalLayout title="Política de Retenção de Dados" updatedAt="27 de maio de 2026">
      <p>
        Esta Política estabelece os prazos de retenção e os critérios de eliminação dos dados
        pessoais tratados pela plataforma Ouvidoria AMO, em observância aos princípios da necessidade
        e da finalidade (art. 6º, III e VI, da LGPD).
      </p>

      <h2>1. Princípios gerais</h2>
      <ul>
        <li>Os dados são mantidos pelo tempo estritamente necessário ao cumprimento das finalidades;</li>
        <li>Decorridos os prazos, os dados são eliminados, anonimizados ou bloqueados;</li>
        <li>A Controladora (empresa cliente) define prazos específicos quando houver previsão legal ou regulatória aplicável.</li>
      </ul>

      <h2>2. Tabela de retenção</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria de dado</th>
            <th>Finalidade</th>
            <th>Prazo de retenção</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Denúncias (relato, categoria, status)</td>
            <td>Apuração e cumprimento de obrigação legal</td>
            <td>Conforme definido pela Controladora — mínimo recomendado: 5 anos após o encerramento</td>
          </tr>
          <tr>
            <td>Anexos de denúncias</td>
            <td>Prova documental da apuração</td>
            <td>Mesmo prazo da denúncia associada</td>
          </tr>
          <tr>
            <td>Dados de denunciante identificado</td>
            <td>Comunicação e retorno</td>
            <td>A definir pela Controladora — recomenda-se anonimização após o encerramento</td>
          </tr>
          <tr>
            <td>Perfis de usuários gestores</td>
            <td>Operação do canal</td>
            <td>Enquanto durar o vínculo + período legal aplicável</td>
          </tr>
          <tr>
            <td>Logs de acesso (access_logs)</td>
            <td>Segurança e auditoria</td>
            <td>Mínimo 6 meses (art. 15 do Marco Civil da Internet)</td>
          </tr>
          <tr>
            <td>Dados de cobrança e assinatura</td>
            <td>Obrigações fiscais</td>
            <td>5 anos (prazo prescricional fiscal)</td>
          </tr>
          <tr>
            <td>Comunicações por e-mail (transacionais)</td>
            <td>Auditoria de entrega</td>
            <td>12 meses</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Eliminação e anonimização</h2>
      <p>
        Ao término do prazo, os dados são eliminados de forma segura ou anonimizados de modo
        irreversível, garantindo que não seja possível reidentificar o titular.
      </p>

      <h2>4. Backups</h2>
      <p>
        Cópias de segurança seguem ciclo de retenção definido pela infraestrutura, e os dados
        nelas contidos são eliminados nos ciclos subsequentes após a eliminação na base
        primária.
      </p>

      <h2>5. Exceções</h2>
      <p>Dados podem ser conservados além dos prazos quando:</p>
      <ul>
        <li>Houver obrigação legal ou regulatória;</li>
        <li>Forem necessários para o exercício regular de direitos em processo judicial, administrativo ou arbitral;</li>
        <li>Em forma anonimizada, para estudos estatísticos por órgão de pesquisa.</li>
      </ul>

      <h2>6. Solicitações</h2>
      <p>
        Solicitações de eliminação antecipada devem ser direcionadas ao Encarregado:{' '}
        <a href="mailto:dpo@agenciamundi.com">dpo@agenciamundi.com</a>
      </p>
    </LegalLayout>
  );
};

export default PoliticaRetencao;
