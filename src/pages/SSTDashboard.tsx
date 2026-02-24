import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, Loader2, ExternalLink, Copy, ClipboardList, Plus, Brain, Flame, Building2, Pencil, Link2 } from "lucide-react";
import { QRCodeDownloader } from "@/components/QRCodeDownloader";
import { useNavigate } from 'react-router-dom';
import EmbeddedDashboard from '@/components/EmbeddedDashboard';
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import AddCompanyDialog from '@/components/sst/AddCompanyDialog';
import EditCompanyDialog from '@/components/sst/EditCompanyDialog';
import SSTCompanyCounter from '@/components/sst/SSTCompanyCounter';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredOverlay from '@/components/TrialExpiredOverlay';
import OnboardingTour, { TourStep } from '@/components/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';

const sstDashboardSteps: TourStep[] = [
  {
    targetId: 'sst-tools-bar',
    title: '🛠️ Suas Ferramentas',
    description: 'Aqui ficam todas as ferramentas disponíveis para você gerenciar a saúde ocupacional das suas empresas.',
    position: 'bottom',
  },
  {
    targetId: 'tool-hseit',
    title: '🧠 Avaliação HSE-IT',
    description: 'Avalie os riscos psicossociais das empresas usando a metodologia HSE-IT, reconhecida internacionalmente.',
    position: 'bottom',
  },
  {
    targetId: 'tool-burnout',
    title: '🔥 Avaliação Burnout',
    description: 'Aplique questionários de avaliação de risco de Síndrome de Burnout nos colaboradores.',
    position: 'bottom',
  },
  {
    targetId: 'tool-climate',
    title: '📋 Pesquisas de Clima',
    description: 'Crie e gerencie pesquisas de clima organizacional personalizadas.',
    position: 'bottom',
  },
  {
    targetId: 'tool-new-company',
    title: '🏢 Nova Empresa',
    description: 'Cadastre novas empresas para gerenciar. No plano trial, você pode ter até 2 empresas.',
    position: 'bottom',
  },
  {
    targetId: 'sst-link',
    title: '🔗 Link da Página Inicial',
    description: 'Este é o link da sua página pública. Compartilhe com suas empresas clientes para que acessem o canal de ouvidoria.',
    position: 'bottom',
  },
  {
    targetId: 'company-cards',
    title: '📊 Empresas Cadastradas',
    description: 'Aqui você visualiza todas as empresas cadastradas e acessa o portal de ouvidoria de cada uma.',
    position: 'top',
  },
];

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  reportCount: number;
  newReports: number;
}

const SSTDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [sstManagerId, setSstManagerId] = useState<string | null>(null);
  const [maxCompanies, setMaxCompanies] = useState(50);
  const [sstSlug, setSstSlug] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, isTrialExpired, trialEndsAt } = useRealAuth();
  const { toast } = useToast();
  const { shouldShowTour, completeTour } = useOnboarding('sst-dashboard');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (role !== 'sst') {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      fetchCompanies();
    }
  }, [user, role, authLoading, navigate, toast]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);

      // Get user's profile to find sst_manager_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('sst_manager_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.sst_manager_id) {
        toast({
          title: "Erro",
          description: "Seu perfil não está vinculado a uma gestora SST.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const currentSstManagerId = profileData.sst_manager_id;
      setSstManagerId(currentSstManagerId);

      // Fetch SST manager info and assignments in parallel
      const [sstResult, assignmentsResult] = await Promise.all([
        supabase
          .from('sst_managers')
          .select('max_companies, slug')
          .eq('id', currentSstManagerId)
          .single(),
        supabase
          .from('company_sst_assignments')
          .select('company_id')
          .eq('sst_manager_id', currentSstManagerId),
      ]);

      const { data: sstData } = sstResult;
      const { data: assignmentsData, error: assignmentsError } = assignmentsResult;

      if (sstData?.max_companies) {
        setMaxCompanies(sstData.max_companies);
      }
      if (sstData?.slug) {
        setSstSlug(sstData.slug);
      }

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      const companyIds = assignmentsData.map(a => a.company_id);

      // Get company details
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url, slug, cnpj, email, phone, address')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Get report counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count: totalCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          const { count: newCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('status', 'pending');

          return {
            ...company,
            reportCount: totalCount || 0,
            newReports: newCount || 0,
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-800" />
        </main>
        <Footer />
      </div>
    );
  }

  const handleCompanyClick = (companySlug: string) => {
    setSelectedCompany(companySlug);
  };

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          {isTrialExpired && <TrialExpiredOverlay />}
          
          {trialEndsAt && !isTrialExpired && (
            <TrialBanner trialEndsAt={trialEndsAt} />
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-green-800">Gestão SST</h1>
              <p className="text-gray-600">Monitore todas as empresas sob sua gestão</p>
            </div>
            {selectedCompany && (
              <Button 
                variant="outline"
                onClick={() => setSelectedCompany(null)}
              >
                Voltar para lista de empresas
              </Button>
            )}
          </div>

          {/* Suas Ferramentas */}
          <div id="sst-tools-bar" className="bg-green-700 text-white rounded-lg px-5 py-3 mb-4">
            <h2 className="text-lg font-semibold tracking-wide">Suas Ferramentas</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            <Button 
              id="tool-hseit"
              onClick={() => navigate('/hseit-dashboard')}
              variant="outline"
              className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
            >
              <Brain className="mr-2 h-4 w-4" />
              Avaliação HSE-IT
            </Button>
            
            <Button 
              id="tool-burnout"
              onClick={() => navigate('/burnout-dashboard')}
              variant="outline"
              className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
            >
              <Flame className="mr-2 h-4 w-4" />
              Avaliação Burnout
            </Button>
            
            <Button 
              id="tool-climate"
              onClick={() => navigate('/climate-dashboard')}
              variant="outline"
              className="border-green-600 text-green-800 font-semibold hover:bg-green-50 shadow-sm"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Pesquisas de Clima
            </Button>
            
            <Button 
              id="tool-new-company"
              onClick={() => setIsAddCompanyOpen(true)}
              disabled={companies.length >= maxCompanies}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-sm"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
          
          {sstSlug && (
            <div id="sst-link" className="mb-6 flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Link2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Link da sua página inicial</p>
                <a 
                  href={`${window.location.origin}/sst/${sstSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate block"
                >
                  {window.location.origin}/sst/{sstSlug}
                </a>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => copyToClipboard(`${window.location.origin}/sst/${sstSlug}`, e)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
          )}

          {selectedCompany ? (
            <EmbeddedDashboard companyId={selectedCompany} />
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-green-800">Portal de Ouvidoria das Empresas</h2>
                <p className="text-gray-500">Clique para visualizar as informações do canal de ouvidoria de cada empresa</p>
              </div>
              <div className="flex justify-end mb-4">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <SSTCompanyCounter currentCount={companies.length} maxCompanies={maxCompanies} />
              <div id="company-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <Card 
                    key={company.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCompanyClick(company.slug)}
                  >
                    <div className="relative">
                      {company.newReports > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white border-none">
                            {company.newReports} {company.newReports === 1 ? 'nova denúncia' : 'novas denúncias'}
                          </Badge>
                        </div>
                      )}
                      <div className="h-32 bg-gray-100 flex items-center justify-center p-4">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={`Logo ${company.name}`} 
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-4xl font-bold">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompany(company);
                            setIsEditCompanyOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total de denúncias:</span>
                        <span className="font-medium">{company.reportCount}</span>
                      </div>
                      
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Canal de Denúncias:</p>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`${window.location.origin}/report/${company.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary hover:underline flex items-center gap-1 flex-1 truncate"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{window.location.origin}/report/{company.slug}</span>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => copyToClipboard(`${window.location.origin}/report/${company.slug}`, e)}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <QRCodeDownloader
                          url={`${window.location.origin}/report/${company.slug}`}
                          filename={`qrcode-${company.slug}.png`}
                          size="sm"
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {company.newReports > 0 ? (
                        <div className="w-full py-2 text-sm flex items-center justify-center text-red-600 bg-red-50 rounded-md">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Nova atividade detectada
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full">
                          Ver dashboard
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                
                {filteredCompanies.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Nenhuma empresa encontrada</h3>
                    <p className="text-gray-500">Tente ajustar sua busca ou entre em contato com o suporte.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {sstManagerId && (
        <AddCompanyDialog
          open={isAddCompanyOpen}
          onOpenChange={setIsAddCompanyOpen}
          sstManagerId={sstManagerId}
          onCompanyAdded={fetchCompanies}
        />
      )}

      <EditCompanyDialog
        open={isEditCompanyOpen}
        onOpenChange={setIsEditCompanyOpen}
        company={editingCompany}
        onCompanyUpdated={fetchCompanies}
      />
      {shouldShowTour && (
        <OnboardingTour
          steps={sstDashboardSteps}
          onComplete={() => completeTour()}
        />
      )}
    </div>
  );
};

export default SSTDashboard;
