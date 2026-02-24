import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LikertQuestion } from "@/components/climate-survey/LikertQuestion";
import { NPSQuestion } from "@/components/climate-survey/NPSQuestion";
import { DemographicsForm, Demographics } from "@/components/climate-survey/DemographicsForm";
import { SurveyProgress } from "@/components/climate-survey/SurveyProgress";
import { OpenQuestion } from "@/components/climate-survey/OpenQuestion";
import { Loader2, CheckCircle2, ClipboardList, Building2 } from "lucide-react";

const QUESTIONS_PER_PAGE = 10;

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'likert' | 'scale_0_10' | 'open_text';
  category: string;
  order_index: number;
  is_required: boolean;
}

export default function ClimateSurvey() {
  const { companySlug, surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [company, setCompany] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [survey, setSurvey] = useState<{ id: string; title: string; description: string | null } | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [demographics, setDemographics] = useState<Demographics>({
    gender: '',
    ageRange: '',
    tenure: '',
    education: '',
    role: '',
    department: ''
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Separate questions by type
  const likertQuestions = questions.filter(q => q.question_type === 'likert');
  const npsQuestions = questions.filter(q => q.question_type === 'scale_0_10');
  const openQuestions = questions.filter(q => q.question_type === 'open_text');

  // Calculate total steps
  const questionPages = Math.ceil(likertQuestions.length / QUESTIONS_PER_PAGE);
  const hasNps = npsQuestions.length > 0;
  const hasOpen = openQuestions.length > 0;
  const totalSteps = 1 + questionPages + 1 + (hasNps ? 1 : 0) + (hasOpen ? 1 : 0) + 1;

  // Get unique categories for progress steps
  const uniqueCategories = [...new Set(likertQuestions.map(q => q.category))];
  const categoryLabels: Record<string, string> = {
    credibilidade: 'Credibilidade',
    respeito: 'Respeito',
    imparcialidade: 'Imparcialidade',
    orgulho: 'Orgulho',
    camaradagem: 'Camaradagem',
    nps: 'NPS',
    open: 'Comentários',
    custom: 'Personalizada'
  };
  
  const steps = [
    { name: 'Início', completed: currentStep > 0 },
    ...Array.from({ length: questionPages }, (_, i) => ({
      name: `Página ${i + 1}`,
      completed: currentStep > i + 1
    })),
    { name: 'Dados', completed: currentStep > questionPages + 1 },
    ...(hasNps ? [{ name: 'NPS', completed: currentStep > questionPages + 2 }] : []),
    ...(hasOpen ? [{ name: 'Comentários', completed: currentStep > questionPages + 2 + (hasNps ? 1 : 0) }] : []),
  ];

  useEffect(() => {
    fetchCompanyAndSurvey();
  }, [companySlug, surveyId]);

  const fetchCompanyAndSurvey = async () => {
    setIsLoading(true);
    try {
      // Fetch company by slug using public view (LGPD compliant)
      const { data: rawCompanyData, error: companyError } = await supabase
        .from('companies_public' as any)
        .select('id, name, logo_url')
        .eq('slug', companySlug)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!rawCompanyData) {
        toast({ title: "Empresa não encontrada", variant: "destructive" });
        navigate('/');
        return;
      }

      const companyData = rawCompanyData as unknown as { id: string; name: string; logo_url: string | null };
      setCompany(companyData);

      // Fetch active survey for the company
      let surveyQuery = supabase
        .from('climate_surveys')
        .select('id, title, description')
        .eq('company_id', companyData.id)
        .eq('is_active', true);

      if (surveyId) {
        surveyQuery = surveyQuery.eq('id', surveyId);
      }

      // Order by created_at and get the first result to handle multiple active surveys
      const { data: surveyResults, error: surveyError } = await surveyQuery
        .order('created_at', { ascending: false })
        .limit(1);

      const surveyData = surveyResults && surveyResults.length > 0 ? surveyResults[0] : null;

      if (surveyError) throw surveyError;
      
      if (!surveyData) {
        toast({ title: "Nenhuma pesquisa ativa encontrada", variant: "destructive" });
        return;
      }

      setSurvey(surveyData);

      // Fetch departments for this survey
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('survey_departments')
        .select('name')
        .eq('survey_id', surveyData.id)
        .order('order_index');

      if (departmentsError) throw departmentsError;
      
      if (departmentsData && departmentsData.length > 0) {
        setDepartments(departmentsData.map(d => d.name));
      } else {
        // Fallback to default departments if none configured
        setDepartments([
          'Administrativo',
          'Comercial',
          'Financeiro',
          'Marketing',
          'Operações',
          'Recursos Humanos',
          'TI',
          'Outro'
        ]);
      }

      // Fetch questions for this survey
      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyData.id)
        .order('order_index');

      if (questionsError) throw questionsError;

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type as 'likert' | 'scale_0_10' | 'open_text',
          category: q.category || 'custom',
          order_index: q.order_index,
          is_required: q.is_required
        })));
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast({ title: "Erro ao carregar pesquisa", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleDemographicChange = (field: keyof Demographics, value: string) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentQuestions = () => {
    if (currentStep === 0) return [];
    if (currentStep <= questionPages) {
      const startIndex = (currentStep - 1) * QUESTIONS_PER_PAGE;
      return likertQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
    }
    return [];
  };

  const canProceed = () => {
    if (currentStep === 0) return true;
    
    if (currentStep <= questionPages) {
      const currentQuestions = getCurrentQuestions();
      return currentQuestions.filter(q => q.is_required).every(q => answers[q.id] !== undefined);
    }
    
    if (currentStep === questionPages + 1) {
      return demographics.department !== '';
    }
    
    const npsStep = questionPages + 2;
    if (hasNps && currentStep === npsStep) {
      const requiredNps = npsQuestions.filter(q => q.is_required);
      return requiredNps.every(q => answers[q.id] !== undefined);
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const generateToken = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSubmit = async () => {
    if (!survey) return;

    const generateResponseId = () => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      // Fallback UUIDv4
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    setIsSubmitting(true);
    try {
      // We avoid `.select().single()` here because public respondents may not have SELECT permission
      // on survey_responses due to privacy, which can make the INSERT fail.
      const responseId = generateResponseId();
      const respondentToken = generateToken();

      const { error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          id: responseId,
          survey_id: survey.id,
          respondent_token: respondentToken,
          department: demographics.department,
          demographics: {
            gender: demographics.gender,
            ageRange: demographics.ageRange,
            tenure: demographics.tenure,
            education: demographics.education,
            role: demographics.role,
          },
          completed_at: new Date().toISOString(),
        });

      if (responseError) throw responseError;

      // Prepare answers for insertion using actual question IDs
      const answersToInsert = questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
        .map((q) => ({
          response_id: responseId,
          question_id: q.id,
          answer_value: q.question_type !== 'open_text' ? answers[q.id]?.toString() : null,
          answer_text: q.question_type === 'open_text' ? (answers[q.id] as string) : null,
        }));

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('survey_answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      setIsComplete(true);
      setCurrentStep(totalSteps - 1);
      toast({ title: 'Pesquisa enviada com sucesso!' });
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      const details = [error?.message, error?.details].filter(Boolean).join(' - ');
      toast({
        title: 'Erro ao enviar pesquisa',
        description: details || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate current step type
  const getNpsStep = () => questionPages + 2;
  const getOpenStep = () => questionPages + 2 + (hasNps ? 1 : 0);
  const getSubmitStep = () => totalSteps - 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pesquisa não disponível</h2>
            <p className="text-muted-foreground">
              Não há pesquisa de clima ativa para esta empresa no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pesquisa sem perguntas</h2>
            <p className="text-muted-foreground">
              Esta pesquisa ainda não possui perguntas configuradas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-10 object-contain" />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
            <div>
              <h1 className="font-semibold text-foreground">{company.name}</h1>
              <p className="text-xs text-muted-foreground">Pesquisa de Clima</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        {currentStep > 0 && currentStep < totalSteps - 1 && (
          <div className="mb-6">
            <SurveyProgress
              currentStep={currentStep}
              totalSteps={totalSteps - 2}
              steps={steps}
            />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {/* Welcome Step */}
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-8">
                <ClipboardList className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{survey.title}</h2>
                  {survey.description && (
                    <p className="text-muted-foreground">{survey.description}</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 max-w-lg mx-auto">
                  <h3 className="font-semibold text-foreground">Instruções:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Esta pesquisa é <strong>100% anônima</strong></li>
                    <li>Suas respostas são confidenciais</li>
                    <li>Tempo estimado: 15-20 minutos</li>
                    <li>Responda com sinceridade</li>
                    <li>Não há respostas certas ou erradas</li>
                  </ul>
                </div>
                <Button size="lg" onClick={handleNext}>
                  Iniciar Pesquisa
                </Button>
              </div>
            )}

            {/* Question Pages */}
            {currentStep > 0 && currentStep <= questionPages && (
              <div className="space-y-2">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Avalie as afirmativas abaixo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Indique o quanto você concorda ou discorda de cada afirmação
                  </p>
                </div>
                {getCurrentQuestions().map((question, index) => (
                  <LikertQuestion
                    key={question.id}
                    questionId={question.id}
                    questionText={question.question_text}
                    questionNumber={(currentStep - 1) * QUESTIONS_PER_PAGE + index + 1}
                    value={answers[question.id] as number || null}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                  />
                ))}
              </div>
            )}

            {/* Demographics Step */}
            {currentStep === questionPages + 1 && (
              <DemographicsForm
                values={demographics}
                onChange={handleDemographicChange}
                departments={departments}
              />
            )}

            {/* NPS Step */}
            {hasNps && currentStep === getNpsStep() && (
              <div className="py-8 space-y-8">
                {npsQuestions.map((question) => (
                  <NPSQuestion
                    key={question.id}
                    value={answers[question.id] as number || null}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                  />
                ))}
              </div>
            )}

            {/* Open Questions Step */}
            {hasOpen && currentStep === getOpenStep() && (
              <div className="space-y-8 py-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Seus Comentários</h3>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe suas opiniões {openQuestions.some(q => !q.is_required) && '(opcional)'}
                  </p>
                </div>
                {openQuestions.map((question) => (
                  <OpenQuestion
                    key={question.id}
                    questionId={question.id}
                    questionText={question.question_text}
                    value={(answers[question.id] as string) || ''}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                  />
                ))}
              </div>
            )}

            {/* Completion Step */}
            {currentStep === totalSteps - 1 && isComplete && (
              <div className="text-center py-12 space-y-6">
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Obrigado pela sua participação!
                  </h2>
                  <p className="text-muted-foreground">
                    Sua resposta foi registrada com sucesso. Suas respostas são anônimas e serão
                    utilizadas para melhorar o ambiente de trabalho.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep > 0 && currentStep < totalSteps - 1 && !isComplete && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                  Voltar
                </Button>
                
                {currentStep === getSubmitStep() ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Pesquisa'
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Próximo
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
