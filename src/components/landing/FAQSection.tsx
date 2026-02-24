import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const faqs = [
  {
    question: 'O que é levantamento de riscos psicossociais?',
    answer: 'O levantamento de riscos psicossociais é o processo de identificação, avaliação e documentação dos fatores no ambiente de trabalho que podem afetar a saúde mental dos colaboradores. Inclui riscos como assédio moral, sobrecarga de trabalho, falta de autonomia, conflitos interpessoais e insegurança no emprego. A NR-01 exige que as empresas realizem esse levantamento de forma sistemática e documentada. O SOIA automatiza todo esse processo com questionários validados cientificamente e análise por inteligência artificial.'
  },
  {
    question: 'Como o SOIA funciona como sistema NR-01?',
    answer: 'O SOIA é um sistema NR-01 completo que atende todas as exigências da norma regulamentadora para gestão de riscos psicossociais. A plataforma oferece: levantamento de riscos psicossociais com o questionário HSE-IT (35 indicadores em 7 categorias), geração automática de relatórios e planos de ação, canal de denúncias anônimo para reportar situações de risco, pesquisa de clima organizacional, avaliação de burnout, e dashboards com indicadores em tempo real. Tudo documentado e pronto para auditorias.'
  },
  {
    question: 'Quais riscos psicossociais a NR-01 exige mapear?',
    answer: 'A NR-01 exige o mapeamento de riscos psicossociais nas seguintes categorias: demandas de trabalho (carga excessiva, prazos irreais), controle sobre o trabalho (autonomia, participação nas decisões), suporte de gestores e colegas, relacionamentos interpessoais (conflitos, assédio), papel na organização (ambiguidade, conflito de papéis), mudanças organizacionais e condições de trabalho. O SOIA cobre todas essas categorias com o instrumento HSE-IT, validado internacionalmente.'
  },
  {
    question: 'O que é a NR-01 e como o SOIA ajuda a cumpri-la?',
    answer: 'A NR-01 é a Norma Regulamentadora que estabelece disposições gerais sobre segurança e saúde no trabalho, incluindo a gestão de riscos psicossociais (assédio, estresse, burnout). O SOIA oferece ferramentas completas para identificar, documentar e gerenciar esses riscos, garantindo conformidade total com a norma e gerando relatórios para auditorias.'
  },
  {
    question: 'Como funciona o anonimato das denúncias?',
    answer: 'O SOIA foi projetado para garantir anonimato absoluto. As denúncias são criptografadas, não armazenamos IPs ou metadados identificáveis, e o colaborador recebe um código de acompanhamento que não está vinculado a nenhuma informação pessoal. Nem mesmo os administradores podem identificar quem fez a denúncia.'
  },
  {
    question: 'Quanto tempo leva para implementar o sistema NR-01 do SOIA?',
    answer: 'A implementação do sistema NR-01 é feita em até 48 horas úteis. Configuramos a plataforma com a identidade visual da sua empresa, criamos os acessos dos gestores e disponibilizamos materiais de comunicação. O levantamento de riscos psicossociais pode ser iniciado imediatamente após a configuração.'
  },
  {
    question: 'Como a inteligência artificial analisa os riscos psicossociais?',
    answer: 'Nossa IA utiliza processamento de linguagem natural para classificar automaticamente as denúncias por categoria (assédio, discriminação, fraude, etc.), avaliar a urgência, identificar padrões recorrentes de riscos psicossociais e sugerir ações. Isso acelera a triagem e garante que casos críticos sejam priorizados imediatamente.'
  },
  {
    question: 'A pesquisa de clima é personalizável?',
    answer: 'Sim, totalmente. Você pode criar pesquisas com diferentes tipos de perguntas (escala Likert, NPS, múltipla escolha, texto livre), definir periodicidade, segmentar por departamentos e personalizar as questões de acordo com as necessidades da sua empresa. Também oferecemos templates baseados em melhores práticas do mercado.'
  },
  {
    question: 'Quais relatórios de riscos psicossociais o sistema gera?',
    answer: 'O SOIA gera relatórios detalhados incluindo: levantamento completo de riscos psicossociais por categoria e departamento, visão geral de denúncias por período/categoria/status, análise de clima organizacional com NPS, planos de ação conforme NR-01, identificação de áreas de risco, tendências ao longo do tempo, e relatórios de compliance para auditorias. Todos podem ser exportados em PDF ou Excel.'
  },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="faq" className="py-20 bg-background" aria-label="Perguntas frequentes sobre sistema NR-01 e riscos psicossociais">
      <div className="audit-container" ref={ref}>
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="text-audit-secondary font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
              Perguntas Frequentes sobre Riscos Psicossociais e NR-01
            </h2>
            <p className="text-muted-foreground text-lg">
              Tire suas dúvidas sobre o sistema NR-01 e levantamento de riscos psicossociais.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className={`bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/30 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: isVisible ? `${idx * 100 + 200}ms` : '0ms' }}
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
