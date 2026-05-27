import React from 'react';
import LegalLayout from '@/components/LegalLayout';
import usePageSEO from '@/hooks/usePageSEO';

const TermosDeUso = () => {
  usePageSEO({
    title: 'Termos de Uso — SOIA | Grupo AMO',
    description: 'Termos de Uso da plataforma SOIA, canal de denúncias e ouvidoria do Grupo AMO.',
  });

  return (
    <LegalLayout title="Termos de Uso" updatedAt="27 de maio de 2026">
      <p>
        Estes Termos regem o uso da plataforma <strong>SOIA — Sistema de Ouvidoria Inteligente</strong>,
        de titularidade do <strong>Grupo AMO</strong>. Ao acessar ou utilizar a plataforma, o usuário
        concorda integralmente com estes Termos e com a{' '}
        <a href="/politica-de-privacidade">Política de Privacidade</a>.
      </p>

      <h2>1. Definições</h2>
      <ul>
        <li><strong>Plataforma</strong>: sistema SOIA, incluindo site, painéis e APIs.</li>
        <li><strong>Controladora</strong>: empresa cliente que contrata o canal de denúncias.</li>
        <li><strong>Operador</strong>: Grupo AMO, responsável pela operação técnica.</li>
        <li><strong>Usuário</strong>: qualquer pessoa que acesse a plataforma, incluindo denunciantes, gestores e administradores.</li>
        <li><strong>Denunciante</strong>: pessoa que envia manifestação por meio do canal, de forma anônima ou identificada.</li>
      </ul>

      <h2>2. Perfis de acesso</h2>
      <ul>
        <li><strong>Administrador Master</strong>: gestão global da plataforma;</li>
        <li><strong>SST</strong>: gestores de saúde e segurança que administram empresas-cliente;</li>
        <li><strong>Empresa</strong>: usuários da Controladora com acesso ao painel de denúncias;</li>
        <li><strong>Denunciante anônimo</strong>: acesso público ao formulário e ao acompanhamento via código.</li>
      </ul>

      <h2>3. Cadastro e credenciais</h2>
      <p>
        O usuário é responsável pela veracidade das informações fornecidas e pela guarda de
        suas credenciais. É vedado compartilhar login e senha. Suspeitas de uso indevido devem
        ser comunicadas imediatamente ao Encarregado.
      </p>

      <h2>4. Uso adequado</h2>
      <p>O usuário compromete-se a não:</p>
      <ul>
        <li>Utilizar o canal para fins ilícitos, difamatórios ou caluniosos;</li>
        <li>Enviar conteúdo falso de má-fé;</li>
        <li>Tentar contornar mecanismos de segurança, autenticação ou anonimato;</li>
        <li>Realizar engenharia reversa, scraping massivo ou ataques à infraestrutura;</li>
        <li>Violar direitos de terceiros, incluindo dados pessoais e propriedade intelectual.</li>
      </ul>

      <h2>5. Denúncias</h2>
      <p>
        A plataforma assegura ao denunciante o direito ao anonimato e à proteção contra
        retaliação. A Controladora é responsável pela apuração e tratamento da denúncia. O
        Grupo AMO atua exclusivamente como Operador, não interferindo no mérito.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        Todo o software, marca, logotipo, layout e conteúdo da plataforma pertencem ao Grupo
        AMO ou a seus licenciadores. É vedada qualquer reprodução, distribuição ou modificação
        sem autorização escrita.
      </p>

      <h2>7. Disponibilidade e suporte</h2>
      <p>
        Envidamos esforços para manter a plataforma disponível 24/7. Eventuais janelas de
        manutenção, indisponibilidades programadas ou interrupções decorrentes de caso
        fortuito/força maior não geram responsabilidade do Grupo AMO.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        O Grupo AMO não responde por: (i) decisões tomadas pela Controladora a partir das
        denúncias; (ii) conteúdo enviado por denunciantes; (iii) danos indiretos, lucros
        cessantes ou perda de oportunidade.
      </p>

      <h2>9. Cancelamento e suspensão</h2>
      <p>
        O Grupo AMO pode suspender ou encerrar o acesso de qualquer usuário em caso de
        descumprimento destes Termos, sem prejuízo das medidas legais cabíveis.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Estes Termos podem ser alterados a qualquer tempo. A versão vigente estará sempre
        disponível nesta página.
      </p>

      <h2>11. Foro e legislação aplicável</h2>
      <p>
        Aplica-se a legislação brasileira. Fica eleito o foro da comarca da sede do Grupo AMO,
        com renúncia a qualquer outro, por mais privilegiado que seja.
      </p>

      <h2>12. Contato</h2>
      <p>
        Dúvidas sobre estes Termos: <a href="mailto:contato@soia.com.br">contato@soia.com.br</a><br />
        Encarregado (DPO): <a href="mailto:dpo@agenciamundi.com">dpo@agenciamundi.com</a>
      </p>
    </LegalLayout>
  );
};

export default TermosDeUso;
