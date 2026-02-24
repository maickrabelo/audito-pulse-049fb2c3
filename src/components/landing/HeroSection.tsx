import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-audit-dark via-audit-primary to-audit-accent">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-audit-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-audit-accent rounded-full blur-3xl" />
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="audit-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
            <Shield className="h-4 w-4" />
            <span>Canal de Ouvidoria</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-10 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Sistema de Ouvidoria
            <br />
            <span className="text-audit-secondary">Grupo AMO</span>
          </h1>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/auth'}
              className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold px-10 py-6 text-lg group"
            >
              Área do Cliente
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
