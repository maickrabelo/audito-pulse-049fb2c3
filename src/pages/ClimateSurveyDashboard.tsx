import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Loader2,
  ClipboardList,
  Users,
  TrendingUp,
  Star,
  Plus,
  Calendar,
  Settings,
  Copy,
  Link as LinkIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { ClimateSurveyExportButton } from "@/components/climate-survey/ClimateSurveyExportButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AIInsightsCard } from "@/components/climate-survey/AIInsightsCard";
import { QRCodeDownloader } from "@/components/QRCodeDownloader";
import OnboardingTour, { TourStep } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";

const climateSteps: TourStep[] = [
  {
    targetId: 'climate-new-btn',
    title: '➕ Nova Pesquisa',
    description: 'Crie pesquisas de clima personalizadas com perguntas Likert, NPS e abertas.',
    position: 'bottom',
  },
  {
    targetId: 'climate-survey-selector',
    title: '📋 Seletor de Pesquisa',
    description: 'Selecione uma pesquisa para visualizar seus resultados detalhados.',
    position: 'bottom',
  },
  {
    targetId: 'climate-share-link',
    title: '🔗 Link de Compartilhamento',
    description: 'Copie o link ou baixe o QR Code para distribuir a pesquisa aos colaboradores.',
    position: 'bottom',
  },
];

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  company_id: string;
  companies?: { name: string; slug?: string };
}

interface SurveyStats {
  totalResponses: number;
  npsScore: number;
  avgScore: number;
  categoryScores: { category: string; score: number; fullMark: number }[];
  npsDistribution: { name: string; value: number; color: string }[];
  departmentDistribution: { name: string; value: number }[];
}

interface FullResponse {
  id: string;
  department: string | null;
  completed_at: string | null;
  demographics: any;
  answers: {
    question_text: string;
    question_type: string;
    category: string | null;
    answer_value: string | null;
    answer_text: string | null;
  }[];
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

export default function ClimateSurveyDashboard() {
  const { role, profile, isLoading: authLoading } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shouldShowTour, completeTour } = useOnboarding('climate-dashboard');

  const [isLoading, setIsLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [fullResponses, setFullResponses] = useState<FullResponse[]>([]);
  const [showResponses, setShowResponses] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!role || role === 'pending') {
        navigate('/pending-approval');
        return;
      }
      fetchData();
    }
  }, [authLoading, role]);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSurveyStats(selectedSurvey);
    }
  }, [selectedSurvey]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch companies for admin filter
      if (role === 'admin') {
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name')
          .order('name');
        setCompanies(companiesData || []);
      }

      // For SST users, get assigned company IDs first
      let assignedCompanyIds: string[] = [];
      if (role === 'sst' && profile?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('sst_manager_id')
          .eq('id', profile.id)
          .single();
        
        if (profileData?.sst_manager_id) {
          const { data: assignments } = await supabase
            .from('company_sst_assignments')
            .select('company_id')
            .eq('sst_manager_id', profileData.sst_manager_id);
          
          assignedCompanyIds = assignments?.map(a => a.company_id) || [];
          
          // Also fetch companies for SST filter dropdown
          if (assignedCompanyIds.length > 0) {
            const { data: companiesData } = await supabase
              .from('companies')
              .select('id, name')
              .in('id', assignedCompanyIds)
              .order('name');
            setCompanies(companiesData || []);
          }
        }
      }

      // Fetch surveys based on role
      let surveysData: Survey[] = [];
      
      if (role === 'company' && profile?.company_id) {
        const { data, error } = await supabase
          .from('climate_surveys')
          .select('*, companies(name, slug)')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        surveysData = data || [];
      } else if (role === 'sst' && assignedCompanyIds.length > 0) {
        const { data, error } = await supabase
          .from('climate_surveys')
          .select('*, companies(name, slug)')
          .in('company_id', assignedCompanyIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        surveysData = data || [];
      } else if (role === 'admin') {
        const { data, error } = await supabase
          .from('climate_surveys')
          .select('*, companies(name, slug)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        surveysData = data || [];
      }

      setSurveys(surveysData);
      if (surveysData.length > 0) {
        setSelectedSurvey(surveysData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSurveyStats = async (surveyId: string) => {
    try {
      // Fetch responses for this survey
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId);

      if (error) throw error;

      const totalResponses = responses?.length || 0;

      // Fetch questions for this survey with question_text
      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('id, question_text, question_type, category')
        .eq('survey_id', surveyId);

      if (questionsError) throw questionsError;

      // Fetch all answers for this survey's responses
      const responseIds = responses?.map(r => r.id) || [];
      let answersData: any[] = [];
      
      if (responseIds.length > 0) {
        const { data: answers, error: answersError } = await supabase
          .from('survey_answers')
          .select('*')
          .in('response_id', responseIds);

        if (answersError) throw answersError;
        answersData = answers || [];
      }

      // Create maps for quick lookup
      const questionMap = new Map(questions?.map(q => [q.id, q]) || []);

      // Calculate category scores from real data
      const categoryAnswers: Record<string, number[]> = {};
      const categoryNames: Record<string, string> = {}; // Maps category id to display name
      const npsAnswers: number[] = [];

      answersData.forEach(answer => {
        const question = questionMap.get(answer.question_id);
        if (!question || !answer.answer_value) return;

        const value = parseFloat(answer.answer_value);
        if (isNaN(value)) return;

        if (question.question_type === 'scale_0_10') {
          npsAnswers.push(value);
        } else if (question.question_type === 'likert' && question.category) {
          if (!categoryAnswers[question.category]) {
            categoryAnswers[question.category] = [];
          }
          categoryAnswers[question.category].push(value);
          
          // Store a formatted name for the category
          if (!categoryNames[question.category]) {
            categoryNames[question.category] = question.category
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase());
          }
        }
      });

      // Calculate category scores dynamically from actual categories found
      const uniqueCategories = Object.keys(categoryAnswers);
      const categoryScores = uniqueCategories
        .filter(catId => catId !== 'open' && catId !== 'nps') // Exclude non-score categories
        .map(catId => {
          const answers = categoryAnswers[catId] || [];
          const avgScore = answers.length > 0 
            ? answers.reduce((a, b) => a + b, 0) / answers.length 
            : 0;
          return {
            category: categoryNames[catId] || catId,
            score: parseFloat(avgScore.toFixed(2)),
            fullMark: 5
          };
        })
        .filter(c => c.score > 0); // Only show categories with responses

      // Calculate overall average
      const allLikertValues = Object.values(categoryAnswers).flat();
      const avgScore = allLikertValues.length > 0
        ? allLikertValues.reduce((a, b) => a + b, 0) / allLikertValues.length
        : 0;

      // Calculate NPS
      let npsScore = 0;
      let npsDistribution = [
        { name: 'Detratores (0-6)', value: 0, color: '#ef4444' },
        { name: 'Neutros (7-8)', value: 0, color: '#f59e0b' },
        { name: 'Promotores (9-10)', value: 0, color: '#22c55e' }
      ];

      if (npsAnswers.length > 0) {
        const detractors = npsAnswers.filter(v => v <= 6).length;
        const passives = npsAnswers.filter(v => v >= 7 && v <= 8).length;
        const promoters = npsAnswers.filter(v => v >= 9).length;
        
        const detractorPct = Math.round((detractors / npsAnswers.length) * 100);
        const passivePct = Math.round((passives / npsAnswers.length) * 100);
        const promoterPct = Math.round((promoters / npsAnswers.length) * 100);
        
        npsScore = promoterPct - detractorPct;
        npsDistribution = [
          { name: 'Detratores (0-6)', value: detractorPct, color: '#ef4444' },
          { name: 'Neutros (7-8)', value: passivePct, color: '#f59e0b' },
          { name: 'Promotores (9-10)', value: promoterPct, color: '#22c55e' }
        ];
      }

      // Calculate department distribution from responses
      const deptCounts: Record<string, number> = {};
      responses?.forEach(r => {
        const dept = r.department || 'Não informado';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const departmentDistribution = Object.entries(deptCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setStats({
        totalResponses,
        npsScore,
        avgScore: parseFloat(avgScore.toFixed(2)),
        categoryScores,
        npsDistribution,
        departmentDistribution
      });

      // Build full responses for detailed view
      const fullResponsesData: FullResponse[] = (responses || []).map(resp => {
        const respAnswers = answersData.filter(a => a.response_id === resp.id);
        return {
          id: resp.id,
          department: resp.department,
          completed_at: resp.completed_at,
          demographics: resp.demographics,
          answers: respAnswers.map(a => {
            const q = questionMap.get(a.question_id);
            return {
              question_text: q?.question_text || 'Pergunta não encontrada',
              question_type: q?.question_type || 'unknown',
              category: q?.category || null,
              answer_value: a.answer_value,
              answer_text: a.answer_text
            };
          })
        };
      });
      setFullResponses(fullResponsesData);
    } catch (error) {
      console.error('Error fetching survey stats:', error);
    }
  };

  const handleCreateSurvey = () => {
    navigate('/climate-survey/new');
  };

  const getSelectedSurvey = () => surveys.find(s => s.id === selectedSurvey);

  const getSurveyUrl = (survey: Survey) => {
    if (!survey.companies?.slug) return '';
    return `${window.location.origin}/pesquisa/${survey.companies.slug}/${survey.id}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado!" });
  };

  // Mock open responses for AI analysis demo
  const getMockOpenResponses = () => {
    return [
      {
        question: "O que você mais gosta na empresa?",
        answers: [
          "O ambiente de trabalho é muito bom",
          "Equipe colaborativa e unida",
          "Oportunidades de crescimento",
          "Flexibilidade de horário",
          "Benefícios oferecidos"
        ]
      },
      {
        question: "O que poderia melhorar?",
        answers: [
          "Comunicação entre departamentos",
          "Processos internos mais claros",
          "Mais treinamentos",
          "Infraestrutura do escritório",
          "Feedback mais frequente"
        ]
      }
    ];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/sst-dashboard')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pesquisa de Clima</h1>
            <p className="text-muted-foreground">Dashboard de resultados</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {['admin', 'sst'].includes(role || '') && companies.length > 0 && (
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {surveys.length > 0 && (
              <div id="climate-survey-selector">
                <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione uma pesquisa" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map(survey => (
                      <SelectItem key={survey.id} value={survey.id}>
                        {survey.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {getSelectedSurvey() && getSurveyUrl(getSelectedSurvey()!) && (
              <QRCodeDownloader
                url={getSurveyUrl(getSelectedSurvey()!)}
                filename={`qrcode-pesquisa-${getSelectedSurvey()?.companies?.slug || 'clima'}.png`}
                variant="outline"
                size="default"
              />
            )}
            
            {['admin', 'sst'].includes(role || '') && (
              <Button id="climate-new-btn" onClick={handleCreateSurvey}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Pesquisa
              </Button>
            )}
          </div>
        </div>

        {surveys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhuma pesquisa encontrada</h2>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira pesquisa de clima organizacional
              </p>
              {['admin', 'sst'].includes(role || '') && (
                <Button onClick={handleCreateSurvey}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Pesquisa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : stats && (
          <>
            {/* Share Link Card */}
            {getSelectedSurvey() && getSurveyUrl(getSelectedSurvey()!) && (
              <Card id="climate-share-link" className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <LinkIcon className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 w-full">
                      <p className="text-sm font-medium mb-1">Link de compartilhamento</p>
                      <div className="flex gap-2">
                        <Input
                          value={getSurveyUrl(getSelectedSurvey()!)}
                          readOnly
                          className="bg-muted text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(getSurveyUrl(getSelectedSurvey()!))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <QRCodeDownloader
                      url={getSurveyUrl(getSelectedSurvey()!)}
                      filename={`qrcode-pesquisa-${getSelectedSurvey()?.companies?.slug || 'clima'}.png`}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Respostas</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalResponses}</p>
                    </div>
                    <Users className="h-10 w-10 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">NPS</p>
                      <p className={`text-3xl font-bold ${
                        stats.npsScore >= 50 ? 'text-green-600' :
                        stats.npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stats.npsScore}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Média Geral</p>
                      <p className="text-3xl font-bold text-foreground">{stats.avgScore.toFixed(1)}</p>
                    </div>
                    <Star className="h-10 w-10 text-primary/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">de 5.0</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Participação</p>
                      <p className="text-3xl font-bold text-foreground">
                        {Math.min(100, Math.round(stats.totalResponses / 2))}%
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Radar Chart - Category Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Scores por Categoria</CardTitle>
                  <CardDescription>Média das avaliações em cada dimensão GPTW</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={stats.categoryScores}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.5}
                        />
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* NPS Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição NPS</CardTitle>
                  <CardDescription>Detratores, Neutros e Promotores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.npsDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${value}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.npsDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6">
              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Participação por Departamento</CardTitle>
                  <CardDescription>Número de respostas por área</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.departmentDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Complete Responses Section */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Respostas Completas
                    </CardTitle>
                    <CardDescription>
                      Visualize cada resposta individual na íntegra
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowResponses(!showResponses)}
                  >
                    {showResponses ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Ver {fullResponses.length} respostas
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {showResponses && (
                <CardContent>
                  {fullResponses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma resposta ainda.
                    </p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {fullResponses.map((resp, index) => (
                        <AccordionItem key={resp.id} value={resp.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <Badge variant="secondary" className="shrink-0">
                                #{index + 1}
                              </Badge>
                              <span className="text-sm">
                                {resp.department || 'Setor não informado'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {resp.completed_at 
                                  ? new Date(resp.completed_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Data não informada'}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              {/* Demographics */}
                              {resp.demographics && Object.keys(resp.demographics).length > 0 && (
                                <div className="bg-muted/50 rounded-lg p-4">
                                  <h4 className="font-medium text-sm mb-2">Dados Demográficos</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                    {resp.demographics.gender && (
                                      <div>
                                        <span className="text-muted-foreground">Gênero: </span>
                                        {resp.demographics.gender}
                                      </div>
                                    )}
                                    {resp.demographics.ageRange && (
                                      <div>
                                        <span className="text-muted-foreground">Idade: </span>
                                        {resp.demographics.ageRange}
                                      </div>
                                    )}
                                    {resp.demographics.tenure && (
                                      <div>
                                        <span className="text-muted-foreground">Tempo: </span>
                                        {resp.demographics.tenure}
                                      </div>
                                    )}
                                    {resp.demographics.education && (
                                      <div>
                                        <span className="text-muted-foreground">Escolaridade: </span>
                                        {resp.demographics.education}
                                      </div>
                                    )}
                                    {resp.demographics.role && (
                                      <div>
                                        <span className="text-muted-foreground">Cargo: </span>
                                        {resp.demographics.role}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Answers */}
                              <div className="space-y-3">
                                {resp.answers.map((answer, ansIndex) => (
                                  <div 
                                    key={ansIndex} 
                                    className="border-l-2 border-primary/30 pl-4"
                                  >
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      {answer.question_text}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {answer.question_type === 'likert' && answer.answer_value && (
                                        <Badge 
                                          variant={
                                            parseInt(answer.answer_value) >= 4 
                                              ? 'default' 
                                              : parseInt(answer.answer_value) >= 3 
                                                ? 'secondary' 
                                                : 'destructive'
                                          }
                                        >
                                          {answer.answer_value}/5
                                        </Badge>
                                      )}
                                      {answer.question_type === 'scale_0_10' && answer.answer_value && (
                                        <Badge 
                                          variant={
                                            parseInt(answer.answer_value) >= 9 
                                              ? 'default' 
                                              : parseInt(answer.answer_value) >= 7 
                                                ? 'secondary' 
                                                : 'destructive'
                                          }
                                        >
                                          NPS: {answer.answer_value}
                                        </Badge>
                                      )}
                                      {answer.question_type === 'open_text' && answer.answer_text && (
                                        <p className="text-sm text-muted-foreground italic">
                                          "{answer.answer_text}"
                                        </p>
                                      )}
                                      {!answer.answer_value && !answer.answer_text && (
                                        <span className="text-xs text-muted-foreground">
                                          Não respondido
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              )}
            </Card>

            {/* AI Insights Card */}
            <AIInsightsCard 
              surveyId={selectedSurvey} 
              openResponses={getMockOpenResponses()}
            />

            {/* Export Button */}
            <div className="flex justify-end mt-6">
              <ClimateSurveyExportButton
                surveyTitle={getSelectedSurvey()?.title || 'Pesquisa de Clima'}
                companyName={getSelectedSurvey()?.companies?.name}
                stats={stats}
              />
            </div>
          </>
        )}
      </main>

      <Footer />

      {shouldShowTour && (
        <OnboardingTour
          steps={climateSteps}
          onComplete={() => completeTour()}
        />
      )}
    </div>
  );
}
