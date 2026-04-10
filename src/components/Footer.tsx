import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram } from 'lucide-react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

const Footer = () => {
  const { brandLogo, isWhiteLabel } = useWhiteLabel();

  return (
    <footer className="bg-audit-dark text-white">
      <div className="audit-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            {isWhiteLabel && brandLogo ? (
              <img src={brandLogo} alt="Logo" className="h-10 object-contain mb-4" />
            ) : (
              <img src="/lovable-uploads/Logo_GrupoAMO.png" alt="Grupo AMO" className="h-10 brightness-0 invert mb-4" />
            )}
            <p className="text-white/60 text-sm mb-6">
              Sistema completo de canal de denúncias e ouvidoria inteligente para empresas.
            </p>
            <div className="flex gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Soluções</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/#beneficios" className="text-white/60 hover:text-white transition-colors">Canal de Denúncias</a></li>
              <li><a href="/#como-funciona" className="text-white/60 hover:text-white transition-colors">Ouvidoria Inteligente</a></li>
              <li><a href="/#beneficios" className="text-white/60 hover:text-white transition-colors">Gestão de Denúncias</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/#beneficios" className="text-white/60 hover:text-white transition-colors">Benefícios</a></li>
              <li><a href="/#como-funciona" className="text-white/60 hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="/#faq" className="text-white/60 hover:text-white transition-colors">Perguntas Frequentes</a></li>
              <li><Link to="/auth" className="text-white/60 hover:text-white transition-colors">Área do Cliente</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">contato@soia.com.br</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">+55 11 9 9602-9222</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-audit-secondary flex-shrink-0 mt-0.5" />
                <span className="text-white/60">São Paulo, SP - Brasil</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="audit-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} SOIA - Sistema de Ouvidoria Inteligente. Todos os direitos reservados.</p>
            <p>Desenvolvido com 💚 para empresas que cuidam das pessoas.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
