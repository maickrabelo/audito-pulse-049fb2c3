import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/HeroSection';
import PainPointsSection from '@/components/landing/PainPointsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import SEOStructuredData from '@/components/SEOStructuredData';
import usePageSEO from '@/hooks/usePageSEO';
import { faqs } from '@/components/landing/FAQSection';

const Index = () => {
  usePageSEO({
    title: 'Canal de Denúncias | Sistema de Ouvidoria Inteligente | SOIA',
    description: 'Sistema completo de canal de denúncias e ouvidoria. Receba, gerencie e resolva denúncias com inteligência artificial.',
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
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
