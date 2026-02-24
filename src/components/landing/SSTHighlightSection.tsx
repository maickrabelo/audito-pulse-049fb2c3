import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const SSTHighlightSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  const scrollToContact = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={ref}
      className="py-16 px-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden"
      aria-label="Solução para empresas de SST"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
            <Shield className="h-4 w-4" />
            <span>Para empresas de Saúde e Segurança do Trabalho</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Tem empresa de SST e quer fazer a gestão dos{' '}
            <span className="text-emerald-200">Riscos Psicossociais (NR-01)</span>{' '}
            para seus clientes?
          </h2>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl mx-auto">
            Temos a solução completa. Preços especiais e plataforma White Label para você oferecer com a sua marca.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => window.location.href = '/teste-gratis-sst'}
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold px-8 py-6 text-lg group"
            >
              Teste grátis por 7 dias
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de agendar uma demonstração do SOIA para minha empresa de SST.', '_blank')}
              className="bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-white/30 font-semibold px-8 py-6 text-lg group"
            >
              Solicitar Demonstração
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SSTHighlightSection;
