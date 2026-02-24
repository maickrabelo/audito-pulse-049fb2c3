import { useRef, useState } from 'react';
import { 
  Shield, 
  BarChart3, 
  Brain, 
  MessageSquareWarning, 
  ClipboardCheck, 
  Mail, 
  Phone, 
  ArrowRight,
  AlertTriangle,
  Users,
  TrendingDown,
  Scale,
  CheckCircle2,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import PricingSection from '@/components/commercial/PricingSection';
import IncludedFeaturesSection from '@/components/commercial/IncludedFeaturesSection';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CommercialPresentation = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  
  const heroAnimation = useScrollAnimation();
  const problemAnimation = useScrollAnimation();
  const solutionAnimation = useScrollAnimation();
  const benefitsAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    setIsGeneratingPDF(true);
    
    try {
      const content = contentRef.current;
      
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 3.78;
      const scaledWidth = imgWidth * ratio;
      const pageHeight = pdfHeight;
      
      let heightLeft = imgHeight * ratio;
      let position = 0;
      let page = 1;

      while (heightLeft > 0) {
        if (page > 1) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, -position, scaledWidth, imgHeight * ratio);
        heightLeft -= pageHeight;
        position += pageHeight;
        page++;
      }

      pdf.save('SOIA-Proposta-Comercial.pdf');
      
      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O download da proposta comercial foi iniciado.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const problems = [
    {
      icon: Scale,
      title: 'Processos Trabalhistas',
      stat: 'R$ 2,5 bilhões',
      description: 'Valor médio anual em indenizações por assédio no Brasil',
    },
    {
      icon: AlertTriangle,
      title: 'Multas NR-01',
      stat: 'Até R$ 50 mil',
      description: 'Por infração relacionada a riscos psicossociais',
    },
    {
      icon: TrendingDown,
      title: 'Turnover Elevado',
      stat: '45%',
      description: 'Dos funcionários deixam empresas por ambiente tóxico',
    },
    {
      icon: Users,
      title: 'Danos à Reputação',
      stat: '78%',
      description: 'Evitam empresas com histórico de assédio',
    },
  ];

  const solutions = [
    {
      icon: MessageSquareWarning,
      title: 'Canal de Denúncias',
      description: 'Plataforma segura e anônima para receber denúncias de assédio, discriminação e irregularidades.',
      color: 'from-primary/20 to-primary/5',
    },
    {
      icon: ClipboardCheck,
      title: 'Pesquisa de Clima',
      description: 'Avalie o ambiente organizacional com pesquisas baseadas em metodologias validadas como GPTW.',
      color: 'from-accent/20 to-accent/5',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analítico',
      description: 'Visualize métricas em tempo real e acompanhe a evolução do clima organizacional.',
      color: 'from-secondary/20 to-secondary/5',
    },
    {
      icon: Brain,
      title: 'Análise com IA',
      description: 'Inteligência artificial para análise de sentimentos e identificação de padrões.',
      color: 'from-primary/20 to-primary/5',
    },
  ];

  const benefits = [
    'Conformidade com a NR-01 e demais normativas',
    'Redução de até 60% em processos trabalhistas',
    'Melhoria do clima organizacional',
    'Identificação precoce de problemas',
    'Proteção da reputação da empresa',
    'Retenção de talentos',
    'Relatórios automatizados para auditorias',
    'Suporte especializado em compliance',
  ];

  return (
    <div className="min-h-screen bg-background" ref={contentRef}>
      {/* Floating Download Button */}
      <Button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-all"
        size="lg"
      >
        {isGeneratingPDF ? (
          <>
            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 w-5 h-5" />
            Baixar PDF
          </>
        )}
      </Button>
      {/* Hero Section */}
      <section 
        ref={heroAnimation.ref}
        className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />
        
        <div className={`relative z-10 text-center max-w-4xl mx-auto transition-all duration-1000 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
            Proposta Comercial 2024
          </Badge>
          
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SOIA
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-semibold text-foreground mb-6">
            Plataforma de Compliance e<br />Canal de Denúncias
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Proteja sua empresa com uma solução completa de gestão de riscos psicossociais, 
            conformidade com NR-01 e promoção de um ambiente de trabalho saudável.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Agendar Demonstração
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              Ver Preços
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section ref={problemAnimation.ref} className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-700 ${problemAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">
              O Problema
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Os riscos de não agir
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empresas que ignoram riscos psicossociais enfrentam consequências graves e custosas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, index) => (
              <Card 
                key={problem.title}
                className={`text-center border-destructive/20 bg-gradient-to-b from-destructive/5 to-background transition-all duration-700 hover:shadow-lg ${problemAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <problem.icon className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{problem.title}</h3>
                  <p className="text-2xl font-bold text-destructive mb-2">{problem.stat}</p>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section ref={solutionAnimation.ref} className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-700 ${solutionAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              A Solução
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              SOIA: Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma integrada para gestão completa de compliance e bem-estar organizacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((solution, index) => (
              <Card 
                key={solution.title}
                className={`overflow-hidden transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${solutionAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className={`p-6 bg-gradient-to-br ${solution.color}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <solution.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{solution.title}</h3>
                      <p className="text-muted-foreground">{solution.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsAnimation.ref} className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className={`text-center mb-12 transition-all duration-700 ${benefitsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Benefícios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o SOIA?
            </h2>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 delay-200 ${benefitsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {benefits.map((benefit, index) => (
              <div 
                key={benefit}
                className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Included Features Section */}
      <IncludedFeaturesSection />

      {/* CTA Section */}
      <section ref={ctaAnimation.ref} className="py-20 px-4 bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className={`container mx-auto max-w-4xl text-center transition-all duration-700 ${ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Pronto para proteger sua empresa?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Entre em contato conosco e agende uma demonstração gratuita. 
            Nossa equipe está pronta para ajudar você a implementar a melhor solução para sua empresa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              variant="secondary"
              className="group"
              asChild
            >
              <a href="mailto:contato@soia.com.br">
                <Mail className="mr-2 w-5 h-5" />
                contato@soia.com.br
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                <Phone className="mr-2 w-5 h-5" />
                WhatsApp
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-primary-foreground/80">
            <div>
              <p className="font-semibold text-primary-foreground">Email</p>
              <p>contato@soia.com.br</p>
            </div>
            <div>
              <p className="font-semibold text-primary-foreground">Telefone</p>
              <p>(11) 99999-9999</p>
            </div>
            <div>
              <p className="font-semibold text-primary-foreground">Atendimento</p>
              <p>Seg a Sex, 9h às 18h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-background border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SOIA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SOIA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CommercialPresentation;
