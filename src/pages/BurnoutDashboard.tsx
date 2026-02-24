import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ExternalLink,
  Copy, 
  BarChart3, 
  Flame,
  Building2,
  Users,
  FileText,
  Edit,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import OnboardingTour, { TourStep } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";

const burnoutSteps: TourStep[] = [
  {
    targetId: 'burnout-new-btn',
    title: '➕ Nova Avaliação',
    description: 'Crie uma nova avaliação de Burnout para monitorar o risco de esgotamento dos colaboradores.',
    position: 'bottom',
  },
  {
    targetId: 'burnout-filters',
    title: '🔍 Filtros',
    description: 'Filtre as avaliações por título ou empresa.',
    position: 'bottom',
  },
  {
    targetId: 'burnout-table',
    title: '📊 Tabela de Avaliações',
    description: 'Gerencie suas avaliações, copie links para compartilhar e acompanhe os resultados.',
    position: 'top',
  },
];

interface BurnoutAssessment {
  id: string;
  title: string;
  description: string | null;
  company_id: string;
  company_name: string;
  company_slug: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  response_count: number;
}

interface Company {
  id: string;
  name: string;
  slug: string | null;
}

export default function BurnoutDashboard() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const { toast } = useToast();
  const { shouldShowTour, completeTour } = useOnboarding('burnout-dashboard');
  
  const [assessments, setAssessments] = useState<BurnoutAssessment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (role !== 'admin' && role !== 'sst') {
        navigate('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, role, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies based on role
      let companiesQuery = supabase.from('companies').select('id, name, slug');
      
      if (role === 'sst') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('sst_manager_id')
          .eq('id', user?.id)
          .single();
          
        if (profile?.sst_manager_id) {
          const { data: assignments } = await supabase
            .from('company_sst_assignments')
            .select('company_id')
            .eq('sst_manager_id', profile.sst_manager_id);
            
          const companyIds = assignments?.map(a => a.company_id) || [];
          companiesQuery = companiesQuery.in('id', companyIds);
        }
      }
      
      const { data: companiesData } = await companiesQuery;
      setCompanies(companiesData || []);
      
      // Fetch assessments
      let assessmentsQuery = supabase
        .from('burnout_assessments')
        .select(`
          id,
          title,
          description,
          company_id,
          start_date,
          end_date,
          is_active,
          created_at,
          companies (name, slug)
        `)
        .order('created_at', { ascending: false });
      
      if (role === 'sst' && companiesData) {
        const companyIds = companiesData.map(c => c.id);
        assessmentsQuery = assessmentsQuery.in('company_id', companyIds);
      }
      
      const { data: assessmentsData, error } = await assessmentsQuery;
      
      if (error) throw error;
      
      // Fetch response counts
      const assessmentsWithCounts = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const { count } = await supabase
            .from('burnout_responses')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)
            .not('completed_at', 'is', null);
            
          const company = assessment.companies as { name: string; slug: string | null } | null;
          
          return {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            company_id: assessment.company_id,
            company_name: company?.name || 'Empresa',
            company_slug: company?.slug,
            start_date: assessment.start_date,
            end_date: assessment.end_date,
            is_active: assessment.is_active,
            created_at: assessment.created_at,
            response_count: count || 0
          };
        })
      );
      
      setAssessments(assessmentsWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as avaliações de Burnout.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência."
    });
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === "all" || assessment.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const activeCount = assessments.filter(a => a.is_active).length;
  const totalResponses = assessments.reduce((sum, a) => sum + a.response_count, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/sst-dashboard')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              Avaliação de Burnout
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as avaliações de risco de Síndrome de Burnout
            </p>
          </div>
          <Button id="burnout-new-btn" onClick={() => navigate('/burnout/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Avaliação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliações Ativas</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card id="burnout-filters" className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card id="burnout-table">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Respostas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssessments.map(assessment => {
                    const formUrl = assessment.company_slug 
                      ? `${window.location.origin}/burnout/${assessment.company_slug}/${assessment.id}`
                      : null;
                    
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{assessment.company_name}</TableCell>
                        <TableCell>
                          {assessment.start_date && assessment.end_date ? (
                            <span className="text-sm">
                              {format(new Date(assessment.start_date), "dd/MM/yy", { locale: ptBR })}
                              {" - "}
                              {format(new Date(assessment.end_date), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Não definido</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{assessment.response_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assessment.is_active ? "default" : "outline"}>
                            {assessment.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {formUrl && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(formUrl)}
                                  title="Copiar link"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(formUrl, '_blank')}
                                  title="Abrir formulário"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/burnout/results/${assessment.id}`)}
                              title="Ver resultados"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/burnout/${assessment.id}`)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {assessments.length === 0 && !loading && (
          <div className="text-center py-12">
            <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira avaliação de Burnout para começar.
            </p>
            <Button onClick={() => navigate('/burnout/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>
        )}
      </main>
      <Footer />

      {shouldShowTour && (
        <OnboardingTour
          steps={burnoutSteps}
          onComplete={() => completeTour()}
        />
      )}
    </div>
  );
}
