
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell, Shield, ClipboardList, BookOpen, HelpCircle } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, role, signOut, profile } = useRealAuth();
  const { brandLogo, isWhiteLabel } = useWhiteLabel();
  const { resetTour } = useOnboarding('sst-dashboard');
  const isLoggedIn = !!user;

  const handleResetTour = () => {
    resetTour();
    toast.success('Tutorial reiniciado! Navegue pelas páginas para revê-lo.');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="audit-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              {isWhiteLabel && brandLogo ? (
                <img 
                  src={brandLogo} 
                  alt="Logo" 
                  className="h-10 object-contain"
                />
              ) : (
                <img 
                  src="/lovable-uploads/Logo_SOIA.png" 
                  alt="SOIA Logo" 
                  className="h-8"
                />
              )}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
              {role === 'sst' && (
                <div className="flex items-center gap-1">
                  <Link to="/sst-portal">
                    <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2 border-primary/30 text-primary hover:bg-primary/5">
                      <BookOpen className="h-4 w-4" />
                      Portal do Parceiro
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={handleResetTour}
                    title="Rever tutorial"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3">
                      <div className="hidden md:block text-sm text-right">
                        <div className="font-medium">{profile?.full_name || 'Usuário'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-audit-accent flex items-center justify-center text-white">
                        {(profile?.full_name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/master-dashboard" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Painel Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/user-management" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Gestão de Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/climate-dashboard" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Pesquisa de Clima
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {role === 'company' && (
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    {role === 'sst' && (
                      <DropdownMenuItem asChild>
                        <Link to="/sst-dashboard">Dashboard SST</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <a href="/#sistema-nr01" className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Soluções
                </a>
                <a href="/#beneficios" className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Benefícios
                </a>
                <a href="/#faq" className="hidden lg:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
                <a href="/#contato" className="hidden sm:inline-flex">
                  <Button variant="ghost">
                    Contato
                  </Button>
                </a>
                <Link to="/auth">
                  <Button className="bg-audit-primary hover:bg-audit-primary/90">
                    Área do Cliente
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
