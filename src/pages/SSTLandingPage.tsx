import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';

interface SSTManagerInfo {
  name: string;
  logo_url: string | null;
  slug: string;
}

const SSTLandingPage = () => {
  const { sstSlug } = useParams<{ sstSlug: string }>();
  const [sstManager, setSstManager] = useState<SSTManagerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSST = async () => {
      if (!sstSlug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sst_managers')
          .select('name, logo_url, slug')
          .eq('slug', sstSlug)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setNotFound(true);
        } else {
          setSstManager(data);
        }
      } catch (error) {
        console.error('Error fetching SST manager:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSST();
  }, [sstSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-audit-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-4">O gestor SST solicitado não foi encontrado.</p>
          <Link to="/">
            <Button>Voltar ao Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="audit-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {sstManager?.logo_url ? (
                <img
                  src={sstManager.logo_url}
                  alt={`${sstManager.name} Logo`}
                  className="h-10 object-contain"
                />
              ) : (
                <span className="text-xl font-bold text-audit-primary">
                  {sstManager?.name}
                </span>
              )}
            </div>
            <Link to="/auth">
              <Button className="bg-audit-primary hover:bg-audit-primary/90">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-audit-dark via-audit-primary to-audit-accent">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-audit-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-audit-accent rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="audit-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {sstManager?.logo_url && (
              <div className="mb-8 flex justify-center animate-fade-in">
                <img
                  src={sstManager.logo_url}
                  alt={`${sstManager.name} Logo`}
                  className="h-20 object-contain brightness-0 invert"
                />
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
              <Shield className="h-4 w-4" />
              <span>Conformidade total com a NR-01</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Proteja sua empresa.
              <br />
              <span className="text-audit-secondary">Cuide das pessoas.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Canal de denúncias com inteligência artificial, pesquisas de clima organizacional e gestão de riscos psicossociais.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-white text-audit-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg group"
                >
                  Acessar Área do Cliente
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '98%', label: 'Taxa de Resolução' },
                { value: '<24h', label: 'Tempo de Resposta' },
                { value: '100%', label: 'Anonimato Garantido' },
                { value: 'NR-01', label: 'Em Conformidade' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="audit-container">
          <h2 className="text-3xl font-bold text-center mb-12 text-audit-primary">Soluções Integradas</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Canal de Denúncias',
                description: 'Canal seguro e anônimo para recebimento de denúncias, com inteligência artificial para análise e classificação automática.',
              },
              {
                title: 'Pesquisa de Clima',
                description: 'Avalie o clima organizacional da sua empresa com pesquisas personalizadas e relatórios detalhados.',
              },
              {
                title: 'Riscos Psicossociais',
                description: 'Avaliações HSE-IT e Burnout para identificar e gerenciar riscos psicossociais no ambiente de trabalho.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-audit-primary">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SSTLandingPage;
