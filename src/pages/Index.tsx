import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/HeroSection';
import PainPointsSection from '@/components/landing/PainPointsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SSTHighlightSection from '@/components/landing/SSTHighlightSection';
import PricingSection from '@/components/commercial/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import SEOStructuredData from '@/components/SEOStructuredData';
import usePageSEO from '@/hooks/usePageSEO';
import { faqs } from '@/components/landing/FAQSection';

const Index = () => {
  usePageSEO({
    title: 'Sistema NR-01 | Levantamento de Riscos Psicossociais | SOIA',
    description: 'Sistema completo para NR-01 e levantamento de riscos psicossociais. Avaliação, mapeamento e gestão de riscos psicossociais no trabalho com inteligência artificial.',
  });

  return (
    <div className="flex flex-col min-h-screen">
      <SEOStructuredData faqs={faqs} />
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <PainPointsSection />
        <FeaturesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <SSTHighlightSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
