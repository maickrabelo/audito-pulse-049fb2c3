import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import heroIllustration from '@/assets/hero-illustration.png';

const HeroSection = () => {
  const scrollToContact = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-audit-dark via-audit-primary to-audit-accent" aria-label="Sistema NR-01 para levantamento de riscos psicossociais">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-audit-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-audit-accent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-audit-secondary/20 rounded-full blur-3xl" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="audit-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
              <Shield className="h-4 w-4" />
              <span>Conformidade total com a NR-01</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Sistema NR-01 para
              <br />
              <span className="text-audit-secondary">Levantamento de Riscos Psicossociais</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Plataforma completa para gestão de riscos psicossociais, canal de denúncias e pesquisa de clima organizacional conforme a NR-01.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/teste-gratis-sst'}
                className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold px-8 py-6 text-lg group"
              >
                Gestora SST? Teste grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de solicitar uma demonstração do SOIA.', '_blank')}
                className="bg-white text-audit-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg group"
              >
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '98%', label: 'Taxa de Resolução' },
                { value: '<24h', label: 'Tempo de Resposta' },
                { value: '100%', label: 'Anonimato Garantido' },
                { value: '+500', label: 'Empresas Atendidas' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <img 
              src={heroIllustration} 
              alt="Sistema NR-01 para levantamento e gestão de riscos psicossociais no trabalho"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
