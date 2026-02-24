import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ClipboardList, Calendar, Download, Loader2, Eye } from "lucide-react";
import { HSEITActionPlanEditor, ActionItem } from "./HSEITActionPlanEditor";
import { HSEITScheduleEditor, ScheduleItem } from "./HSEITScheduleEditor";
import { 
  HSEITCategory, 
  HSEIT_CATEGORY_LABELS, 
  HSEIT_CATEGORY_COLORS,
  getHealthImpact, 
  HEALTH_IMPACT_LABELS,
  HEALTH_IMPACT_COLORS,
  calculateCategoryAverage
} from "@/data/hseitQuestions";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface CategoryAverage {
  category: HSEITCategory;
  average: number;
  label: string;
}

interface Answer {
  questionNumber: number;
  value: number;
}

interface Response {
  id: string;
  department: string | null;
  completedAt: string | null;
  answers: Answer[];
}

interface HSEITReportEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    companyName: string;
    createdAt: string;
  };
  responses: Response[];
  categoryAverages: CategoryAverage[];
  departments: string[];
  questionAverages: { questionNumber: number; text: string; category: string; average: number }[];
  sstLogoUrl?: string | null;
  sstName?: string | null;
}

// Default recommendations based on health impact
const DEFAULT_RECOMMENDATIONS: Record<HSEITCategory, Record<string, string>> = {
  demands: {
    risk: 'Revisar carga de trabalho e prazos. Implementar pausas regulares. Avaliar redistribuição de tarefas.',
    intermediate: 'Monitorar níveis de demanda. Manter comunicação aberta sobre prioridades.',
    favorable: 'Manter práticas atuais de gestão de demandas.'
  },
  control: {
    risk: 'Aumentar autonomia dos colaboradores. Implementar flexibilidade de horários. Criar canais de participação nas decisões.',
    intermediate: 'Avaliar oportunidades de maior participação. Considerar delegação de responsabilidades.',
    favorable: 'Manter níveis atuais de autonomia e controle.'
  },
  managerSupport: {
    risk: 'Capacitar gestores em liderança. Implementar reuniões regulares de feedback. Criar programa de mentoria.',
    intermediate: 'Fortalecer comunicação entre gestores e equipes. Avaliar necessidades de suporte.',
    favorable: 'Manter práticas de suporte gerencial.'
  },
  peerSupport: {
    risk: 'Promover atividades de integração. Criar espaços de colaboração. Implementar trabalho em equipe.',
    intermediate: 'Avaliar dinâmica entre colegas. Identificar oportunidades de melhoria.',
    favorable: 'Manter ambiente de colaboração entre pares.'
  },
  relationships: {
    risk: 'Implementar política anti-assédio. Criar canal de denúncias. Promover treinamentos de convivência.',
    intermediate: 'Monitorar clima organizacional. Atuar preventivamente em conflitos.',
    favorable: 'Manter ambiente de respeito e colaboração.'
  },
  role: {
    risk: 'Clarificar descrições de cargo. Alinhar expectativas. Comunicar objetivos organizacionais.',
    intermediate: 'Revisar clareza de papéis periodicamente. Garantir alinhamento de expectativas.',
    favorable: 'Manter clareza nos papéis e responsabilidades.'
  },
  change: {
    risk: 'Melhorar comunicação sobre mudanças. Envolver colaboradores no processo. Planejar transições adequadamente.',
    intermediate: 'Avaliar impacto de mudanças. Garantir suporte durante transições.',
    favorable: 'Manter práticas de gestão de mudanças.'
  }
};

export function HSEITReportEditor({
  open,
  onOpenChange,
  assessment,
  responses,
  categoryAverages,
  departments,
  questionAverages,
  sstLogoUrl,
  sstName
}: HSEITReportEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Initialize default values based on assessment data
  useEffect(() => {
    if (open && categoryAverages.length > 0) {
      // Generate executive summary
      const criticalCategories = categoryAverages.filter(c => getHealthImpact(c.average) === 'risk');
      const intermediateCategories = categoryAverages.filter(c => getHealthImpact(c.average) === 'intermediate');
      
      const summary = `Este relatório apresenta os resultados da avaliação de riscos psicossociais HSE-IT realizada na ${assessment.companyName}. 

A avaliação contou com ${responses.length} respostas de colaboradores distribuídos em ${departments.length} setores.

${criticalCategories.length > 0 ? `Foram identificadas ${criticalCategories.length} categorias em nível crítico que requerem atenção imediata: ${criticalCategories.map(c => HSEIT_CATEGORY_LABELS[c.category]).join(', ')}.` : 'Não foram identificadas categorias em nível crítico.'}

${intermediateCategories.length > 0 ? `${intermediateCategories.length} categorias estão em nível intermediário e merecem monitoramento: ${intermediateCategories.map(c => HSEIT_CATEGORY_LABELS[c.category]).join(', ')}.` : ''}`;

      setExecutiveSummary(summary);

      // Generate default action items for critical and intermediate categories
      const defaultActions: ActionItem[] = [];
      
      criticalCategories.forEach((cat, index) => {
        defaultActions.push({
          id: crypto.randomUUID(),
          category: cat.category,
          priority: 'immediate',
          description: `Categoria "${HSEIT_CATEGORY_LABELS[cat.category]}" apresenta indicadores de risco (média: ${cat.average.toFixed(1)}).`,
          recommendation: DEFAULT_RECOMMENDATIONS[cat.category].risk
        });
      });

      intermediateCategories.forEach((cat, index) => {
        defaultActions.push({
          id: crypto.randomUUID(),
          category: cat.category,
          priority: 'short_term',
          description: `Categoria "${HSEIT_CATEGORY_LABELS[cat.category]}" apresenta indicadores intermediários (média: ${cat.average.toFixed(1)}).`,
          recommendation: DEFAULT_RECOMMENDATIONS[cat.category].intermediate
        });
      });

      setActionItems(defaultActions);

      // Generate default schedule items
      const defaultSchedule: ScheduleItem[] = [
        {
          id: crypto.randomUUID(),
          action: 'Apresentação dos resultados para a direção',
          deadline: 'Próxima semana',
          responsible: 'RH / SST',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          action: 'Reunião com gestores para discussão do plano de ação',
          deadline: '15 dias',
          responsible: 'RH / Gestores',
          status: 'pending'
        }
      ];

      if (criticalCategories.length > 0) {
        defaultSchedule.push({
          id: crypto.randomUUID(),
          action: 'Implementação de ações para categorias críticas',
          deadline: '30 dias',
          responsible: 'Gestores / RH',
          status: 'pending'
        });
      }

      defaultSchedule.push({
        id: crypto.randomUUID(),
        action: 'Reavaliação após implementação das ações',
        deadline: '6 meses',
        responsible: 'SST',
        status: 'pending'
      });

      setScheduleItems(defaultSchedule);
    }
  }, [open, categoryAverages, responses, departments, assessment]);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper functions
      const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; maxWidth?: number; align?: 'left' | 'center' | 'right' }) => {
        pdf.setFontSize(options?.fontSize || 12);
        pdf.setFont('helvetica', options?.fontStyle || 'normal');
        
        if (options?.maxWidth) {
          const lines = pdf.splitTextToSize(text, options.maxWidth);
          if (options?.align === 'center') {
            lines.forEach((line: string, index: number) => {
              const textWidth = pdf.getTextWidth(line);
              pdf.text(line, x - textWidth / 2, y + (index * 6));
            });
          } else {
            pdf.text(lines, x, y);
          }
          return lines.length * 6;
        }
        
        if (options?.align === 'center') {
          const textWidth = pdf.getTextWidth(text);
          pdf.text(text, x - textWidth / 2, y);
        } else {
          pdf.text(text, x, y);
        }
        return 6;
      };

      const addNewPageIfNeeded = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const getRiskColor = (average: number): [number, number, number] => {
        const impact = getHealthImpact(average);
        switch (impact) {
          case 'risk': return [220, 53, 69];
          case 'intermediate': return [255, 193, 7];
          case 'favorable': return [40, 167, 69];
        }
      };

      // ========== PAGE 1: COVER ==========
      // SST Logo (if available)
      if (sstLogoUrl) {
        try {
          const response = await fetch(sstLogoUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdf.addImage(base64, 'PNG', margin, yPos, 40, 20);
          if (sstName) {
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(sstName, margin + 45, yPos + 12);
          }
        } catch (error) {
          console.error('Failed to load SST logo:', error);
        }
      }

      yPos = 80;
      
      // Title
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('RELATÓRIO HSE-IT', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      addText('Avaliação de Riscos Psicossociais', pageWidth / 2, yPos, { align: 'center' });

      yPos += 30;
      
      // Assessment info box
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'F');
      
      yPos += 15;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText(assessment.companyName, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 12;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      addText(assessment.title, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 20;

      // Summary cards
      yPos += 20;
      const cardWidth = (pageWidth - 2 * margin - 20) / 3;
      const cardHeight = 35;
      
      // Card 1: Responses
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(margin, yPos, cardWidth, cardHeight, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(responses.length), margin + cardWidth / 2 - 5, yPos + 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Respostas', margin + cardWidth / 2 - 12, yPos + 28);

      // Card 2: Departments
      pdf.setFillColor(16, 185, 129);
      pdf.roundedRect(margin + cardWidth + 10, yPos, cardWidth, cardHeight, 2, 2, 'F');
      pdf.text(String(departments.length), margin + cardWidth + 10 + cardWidth / 2 - 5, yPos + 15);
      pdf.setFontSize(10);
      pdf.text('Setores', margin + cardWidth + 10 + cardWidth / 2 - 10, yPos + 28);

      // Card 3: Overall Average
      const overallAvg = categoryAverages.reduce((sum, c) => sum + c.average, 0) / categoryAverages.length;
      const [r, g, b] = getRiskColor(overallAvg);
      pdf.setFillColor(r, g, b);
      pdf.roundedRect(margin + 2 * (cardWidth + 10), yPos, cardWidth, cardHeight, 2, 2, 'F');
      pdf.text(overallAvg.toFixed(1), margin + 2 * (cardWidth + 10) + cardWidth / 2 - 8, yPos + 15);
      pdf.setFontSize(10);
      pdf.text('Média Geral', margin + 2 * (cardWidth + 10) + cardWidth / 2 - 15, yPos + 28);

      // Footer with date
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2 - 25, pageHeight - 20);

      // ========== PAGE 2: EXECUTIVE SUMMARY ==========
      pdf.addPage();
      yPos = margin;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('1. RESUMO EXECUTIVO', margin, yPos);
      
      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      
      const summaryLines = pdf.splitTextToSize(executiveSummary, pageWidth - 2 * margin);
      pdf.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 6 + 15;

      // ========== PAGE 3: RESULTS BY CATEGORY ==========
      addNewPageIfNeeded(60);
      
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('2. RESULTADOS POR CATEGORIA', margin, yPos);
      yPos += 15;

      categoryAverages.forEach((cat) => {
        addNewPageIfNeeded(25);
        
        const impact = getHealthImpact(cat.average);
        const [r, g, b] = getRiskColor(cat.average);
        
        // Category box
        pdf.setFillColor(r, g, b);
        pdf.roundedRect(margin, yPos, 8, 18, 1, 1, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(HSEIT_CATEGORY_LABELS[cat.category], margin + 12, yPos + 7);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Média: ${cat.average.toFixed(2)} - ${HEALTH_IMPACT_LABELS[impact]}`, margin + 12, yPos + 15);
        
        yPos += 25;
      });

      // ========== DETAILED RESULTS BY DEPARTMENT ==========
      // Calculate category averages for each department
      const categories: HSEITCategory[] = ['demands', 'control', 'managerSupport', 'peerSupport', 'relationships', 'role', 'change'];
      
      const departmentData = departments.map(dept => {
        const deptResponses = responses.filter(r => r.department === dept);
        const deptAnswers = deptResponses.flatMap(r => r.answers);
        
        const categoryAvgs: Record<HSEITCategory, number> = {} as Record<HSEITCategory, number>;
        categories.forEach(cat => {
          categoryAvgs[cat] = calculateCategoryAverage(deptAnswers, cat);
        });
        
        const overallDeptAvg = Object.values(categoryAvgs).reduce((a, b) => a + b, 0) / categories.length;
        
        return {
          name: dept,
          responseCount: deptResponses.length,
          categoryAverages: categoryAvgs,
          overallAverage: overallDeptAvg,
          healthImpact: getHealthImpact(overallDeptAvg)
        };
      });

      pdf.addPage();
      yPos = margin;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('3. RESULTADOS POR SETOR', margin, yPos);
      yPos += 15;

      // Department Health Summary Table (Traffic Light)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      addText('3.1 Semáforo de Saúde Organizacional por Setor', margin, yPos);
      yPos += 12;

      // Table header
      const colWidths = [55, 25, 25, 25, 25, 25];
      const tableStartX = margin;
      
      pdf.setFillColor(0, 51, 102);
      pdf.rect(tableStartX, yPos, pageWidth - 2 * margin, 10, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Setor', tableStartX + 3, yPos + 7);
      pdf.text('Respostas', tableStartX + 57, yPos + 7);
      pdf.text('Média', tableStartX + 84, yPos + 7);
      pdf.text('Impacto', tableStartX + 110, yPos + 7);
      pdf.text('Status', tableStartX + 140, yPos + 7);
      yPos += 10;

      departmentData.forEach((dept, index) => {
        addNewPageIfNeeded(12);
        
        const bgColor = index % 2 === 0 ? 250 : 240;
        pdf.setFillColor(bgColor, bgColor, bgColor);
        pdf.rect(tableStartX, yPos, pageWidth - 2 * margin, 10, 'F');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const deptName = dept.name.length > 25 ? dept.name.substring(0, 25) + '...' : dept.name;
        pdf.text(deptName, tableStartX + 3, yPos + 7);
        pdf.text(String(dept.responseCount), tableStartX + 62, yPos + 7);
        pdf.text(dept.overallAverage.toFixed(2), tableStartX + 86, yPos + 7);
        pdf.text(HEALTH_IMPACT_LABELS[dept.healthImpact], tableStartX + 110, yPos + 7);
        
        // Traffic light indicator
        const [sr, sg, sb] = getRiskColor(dept.overallAverage);
        pdf.setFillColor(sr, sg, sb);
        pdf.circle(tableStartX + 150, yPos + 5, 4, 'F');
        
        yPos += 10;
      });

      yPos += 15;

      // ========== DETAILED CATEGORY ANALYSIS PER DEPARTMENT ==========
      for (const dept of departmentData) {
        addNewPageIfNeeded(120);
        
        if (yPos > margin + 20) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 51, 102);
        addText(`Análise Detalhada: ${dept.name}`, margin, yPos);
        yPos += 10;

        // Department summary
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Total de respostas: ${dept.responseCount} | Média geral: ${dept.overallAverage.toFixed(2)} | Classificação: ${HEALTH_IMPACT_LABELS[dept.healthImpact]}`, margin, yPos);
        yPos += 12;

        // Category bar chart for this department
        const chartHeight = 80;
        const barWidth = (pageWidth - 2 * margin - 20) / categories.length;
        const maxValue = 5;
        const chartStartY = yPos + chartHeight;

        // Y-axis
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, margin, chartStartY);
        
        // Y-axis labels
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        for (let i = 0; i <= 5; i++) {
          const labelY = chartStartY - (i / maxValue) * chartHeight;
          pdf.text(String(i), margin - 8, labelY + 2);
          pdf.setDrawColor(230, 230, 230);
          pdf.line(margin, labelY, pageWidth - margin, labelY);
        }

        // Risk threshold lines
        pdf.setDrawColor(255, 193, 7);
        pdf.setLineWidth(0.3);
        const intermediateY = chartStartY - (2.33 / maxValue) * chartHeight;
        pdf.line(margin, intermediateY, pageWidth - margin, intermediateY);
        
        pdf.setDrawColor(40, 167, 69);
        const favorableY = chartStartY - (3.67 / maxValue) * chartHeight;
        pdf.line(margin, favorableY, pageWidth - margin, favorableY);

        // Draw bars for each category
        categories.forEach((cat, catIndex) => {
          const value = dept.categoryAverages[cat];
          const barHeight = (value / maxValue) * chartHeight;
          const barX = margin + 10 + catIndex * barWidth;
          const barY = chartStartY - barHeight;
          
          const [cr, cg, cb] = getRiskColor(value);
          pdf.setFillColor(cr, cg, cb);
          pdf.rect(barX, barY, barWidth - 8, barHeight, 'F');
          
          // Value on top of bar
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(value.toFixed(1), barX + (barWidth - 8) / 2 - 4, barY - 3);
          
          // Category label below
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const catLabel = HSEIT_CATEGORY_LABELS[cat].length > 10 
            ? HSEIT_CATEGORY_LABELS[cat].substring(0, 10) + '...' 
            : HSEIT_CATEGORY_LABELS[cat];
          pdf.text(catLabel, barX + 2, chartStartY + 8);
        });

        yPos = chartStartY + 18;

        // Category details table for this department
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        addText('Detalhamento por Categoria:', margin, yPos);
        yPos += 8;

        categories.forEach((cat) => {
          addNewPageIfNeeded(10);
          
          const value = dept.categoryAverages[cat];
          const impact = getHealthImpact(value);
          const [cr, cg, cb] = getRiskColor(value);
          
          // Color indicator
          pdf.setFillColor(cr, cg, cb);
          pdf.circle(margin + 4, yPos - 2, 3, 'F');
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${HSEIT_CATEGORY_LABELS[cat]}: ${value.toFixed(2)} - ${HEALTH_IMPACT_LABELS[impact]}`, margin + 10, yPos);
          
          yPos += 8;
        });

        yPos += 10;
      }

      // ========== PAGE 5: ACTION PLAN ==========
      pdf.addPage();
      yPos = margin;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('4. PLANO DE AÇÃO', margin, yPos);
      yPos += 15;

      if (actionItems.length === 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Nenhuma ação definida.', margin, yPos);
        yPos += 15;
      } else {
        actionItems.forEach((item, index) => {
          addNewPageIfNeeded(45);
          
          // Priority indicator
          const priorityColors: Record<string, [number, number, number]> = {
            immediate: [220, 53, 69],
            short_term: [255, 152, 0],
            medium_term: [255, 193, 7]
          };
          const [pr, pg, pb] = priorityColors[item.priority];
          
          pdf.setFillColor(pr, pg, pb);
          pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 2, 2, 'F');
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(`Ação ${index + 1}: ${HSEIT_CATEGORY_LABELS[item.category]}`, margin + 5, yPos + 8);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          const descLines = pdf.splitTextToSize(item.description, pageWidth - 2 * margin - 10);
          pdf.text(descLines.slice(0, 2), margin + 5, yPos + 16);
          
          const recLines = pdf.splitTextToSize(`Recomendação: ${item.recommendation}`, pageWidth - 2 * margin - 10);
          pdf.text(recLines.slice(0, 2), margin + 5, yPos + 28);
          
          yPos += 42;
        });
      }

      // ========== PAGE 6: SCHEDULE ==========
      addNewPageIfNeeded(80);
      
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      addText('5. CRONOGRAMA SUGERIDO', margin, yPos);
      yPos += 15;

      if (scheduleItems.length === 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('Nenhum item no cronograma.', margin, yPos);
      } else {
        // Table header
        pdf.setFillColor(0, 51, 102);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Ação', margin + 3, yPos + 7);
        pdf.text('Prazo', margin + 80, yPos + 7);
        pdf.text('Responsável', margin + 115, yPos + 7);
        pdf.text('Status', margin + 150, yPos + 7);
        yPos += 10;

        scheduleItems.forEach((item, index) => {
          addNewPageIfNeeded(12);
          
          const bgColor = index % 2 === 0 ? 250 : 240;
          pdf.setFillColor(bgColor, bgColor, bgColor);
          pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const actionText = item.action.length > 35 ? item.action.substring(0, 35) + '...' : item.action;
          pdf.text(actionText, margin + 3, yPos + 7);
          pdf.text(item.deadline, margin + 80, yPos + 7);
          pdf.text(item.responsible, margin + 115, yPos + 7);
          
          const statusLabels = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluído' };
          pdf.text(statusLabels[item.status], margin + 150, yPos + 7);
          
          yPos += 10;
        });
      }

      // Add page numbers to all pages
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 35, pageHeight - 10);
        pdf.text('CONFIDENCIAL', margin, pageHeight - 10);
      }

      // Save PDF
      const fileName = `Relatorio_HSEIT_${assessment.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório PDF gerado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preparar Relatório HSE-IT
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="action-plan" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Plano de Ação
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cronograma
            </TabsTrigger>
            <TabsTrigger value="finalize" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Finalizar
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="preview" className="mt-0 h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo Executivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      rows={6}
                      placeholder="Digite o resumo executivo do relatório..."
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Visão Geral das Categorias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryAverages.map((cat) => {
                        const impact = getHealthImpact(cat.average);
                        return (
                          <div 
                            key={cat.category}
                            className={`p-3 rounded-lg border-l-4 ${
                              impact === 'risk' ? 'border-l-red-500 bg-red-50' :
                              impact === 'intermediate' ? 'border-l-orange-500 bg-orange-50' :
                              'border-l-green-500 bg-green-50'
                            }`}
                          >
                            <div className="font-medium">{HSEIT_CATEGORY_LABELS[cat.category]}</div>
                            <div className="text-sm text-muted-foreground">
                              Média: {cat.average.toFixed(2)} - {HEALTH_IMPACT_LABELS[impact]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="action-plan" className="mt-0 h-full">
              <HSEITActionPlanEditor 
                actionItems={actionItems}
                onUpdate={setActionItems}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 h-full">
              <HSEITScheduleEditor
                scheduleItems={scheduleItems}
                onUpdate={setScheduleItems}
              />
            </TabsContent>

            <TabsContent value="finalize" className="mt-0 h-full">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Relatório</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                        <p className="font-medium">{assessment.companyName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Avaliação</label>
                        <p className="font-medium">{assessment.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Total de Respostas</label>
                        <p className="font-medium">{responses.length}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Setores</label>
                        <p className="font-medium">{departments.length}</p>
                      </div>
                    </div>

                    {sstName && (
                      <div className="pt-4 border-t">
                        <label className="text-sm font-medium text-muted-foreground">Responsável SST</label>
                        <div className="flex items-center gap-3 mt-2">
                          {sstLogoUrl && (
                            <img 
                              src={sstLogoUrl} 
                              alt={sstName} 
                              className="h-10 w-auto object-contain"
                            />
                          )}
                          <p className="font-medium">{sstName}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Conteúdo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>Ações no Plano</span>
                      <span className="font-medium">{actionItems.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Itens no Cronograma</span>
                      <span className="font-medium">{scheduleItems.length}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Categorias Críticas</span>
                      <span className="font-medium text-red-600">
                        {categoryAverages.filter(c => getHealthImpact(c.average) === 'risk').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={generatePDF} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar Relatório PDF Final
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
