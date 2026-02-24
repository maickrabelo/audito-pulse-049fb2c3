import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Mail, Phone } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section id="contato" className="py-20 bg-gradient-to-br from-audit-accent via-audit-primary to-audit-dark" aria-label="Implemente seu sistema NR-01 de riscos psicossociais">
      <div className="audit-container" ref={ref}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Implemente seu sistema NR-01 de riscos psicossociais
          </h2>
          <p className={`text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: isVisible ? '100ms' : '0ms' }}
          >
            Agende uma demonstração gratuita e descubra como o SOIA pode transformar a gestão de riscos e a cultura da sua organização.
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: isVisible ? '200ms' : '0ms' }}
          >
            <Button 
              size="lg" 
              className="bg-white text-audit-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg group w-full sm:w-auto"
              onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de agendar uma demonstração do SOIA.', '_blank')}
            >
              Agendar Demonstração
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="bg-audit-accent hover:bg-audit-accent/80 text-white font-semibold px-8 py-6 text-lg w-full sm:w-auto"
              onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de saber mais sobre o SOIA.', '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
          </div>

          <div className={`grid sm:grid-cols-3 gap-6 text-white/80 text-sm transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: isVisible ? '300ms' : '0ms' }}
          >
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <span>contato@soia.com.br</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+55 11 9 9602-9222</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+55 34 9 9199-3722</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
