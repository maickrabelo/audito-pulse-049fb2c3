import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOStructuredDataProps {
  faqs?: FAQItem[];
}

const SEOStructuredData: React.FC<SEOStructuredDataProps> = ({ faqs = [] }) => {
  const siteUrl = 'https://honest-eye-reports.lovable.app';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SOIA',
    description: 'Sistema NR-01 para levantamento e gestão de riscos psicossociais no trabalho',
    url: siteUrl,
    logo: `${siteUrl}/lovable-uploads/Logo_SOIA.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@soia.com.br',
      contactType: 'sales',
      availableLanguage: 'Portuguese',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SOIA - Sistema NR-01 de Riscos Psicossociais',
    url: siteUrl,
    description: 'Sistema completo para NR-01 e levantamento de riscos psicossociais',
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SOIA - Sistema NR-01',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Plataforma completa para gestão de riscos psicossociais conforme NR-01, canal de denúncias anônimo, pesquisa de clima organizacional e avaliação de burnout.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Teste grátis por 7 dias',
    },
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
};

export default SEOStructuredData;
