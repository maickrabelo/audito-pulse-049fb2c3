import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface SurveyStats {
  totalResponses: number;
  npsScore: number;
  avgScore: number;
  categoryScores: { category: string; score: number; fullMark: number }[];
  npsDistribution: { name: string; value: number; color: string }[];
  departmentDistribution: { name: string; value: number }[];
}

interface ClimateSurveyExportButtonProps {
  surveyTitle: string;
  companyName?: string;
  stats: SurveyStats;
}

export const ClimateSurveyExportButton: React.FC<ClimateSurveyExportButtonProps> = ({
  surveyTitle,
  companyName,
  stats
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(6, 95, 70); // Green color
      pdf.text('Relatório de Pesquisa de Clima', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text(surveyTitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      if (companyName) {
        pdf.setFontSize(12);
        pdf.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }

      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      // KPIs Section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Indicadores Principais', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      const kpis = [
        { label: 'Total de Respostas', value: stats.totalResponses.toString() },
        { label: 'NPS Score', value: stats.npsScore.toString() },
        { label: 'Média Geral', value: `${stats.avgScore.toFixed(1)} / 5.0` },
        { label: 'Taxa de Participação', value: `${Math.min(100, Math.round(stats.totalResponses / 2))}%` }
      ];

      kpis.forEach((kpi, index) => {
        const xPos = 20 + (index % 2) * 90;
        if (index === 2) yPosition += 12;
        pdf.setTextColor(100, 100, 100);
        pdf.text(kpi.label + ':', xPos, yPosition);
        pdf.setTextColor(0, 0, 0);
        pdf.text(kpi.value, xPos + 45, yPosition);
      });
      yPosition += 20;

      // Category Scores Table
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Scores por Categoria', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Categoria', 20, yPosition);
      pdf.text('Score', 120, yPosition);
      yPosition += 5;
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 7;

      pdf.setTextColor(0, 0, 0);
      stats.categoryScores.forEach(cat => {
        pdf.text(cat.category, 20, yPosition);
        pdf.text(cat.score.toFixed(2), 120, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // NPS Distribution Table
      pdf.setFontSize(14);
      pdf.text('Distribuição NPS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Grupo', 20, yPosition);
      pdf.text('Percentual', 120, yPosition);
      yPosition += 5;
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 7;

      pdf.setTextColor(0, 0, 0);
      stats.npsDistribution.forEach(item => {
        pdf.text(item.name, 20, yPosition);
        pdf.text(`${item.value}%`, 120, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // Department Distribution
      pdf.setFontSize(14);
      pdf.text('Participação por Departamento', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Departamento', 20, yPosition);
      pdf.text('Respostas', 120, yPosition);
      yPosition += 5;
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 7;

      pdf.setTextColor(0, 0, 0);
      stats.departmentDistribution.forEach(dept => {
        pdf.text(dept.name, 20, yPosition);
        pdf.text(dept.value.toString(), 120, yPosition);
        yPosition += 7;
      });

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const filename = `pesquisa-clima-${surveyTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "PDF exportado",
        description: "O relatório foi baixado com sucesso!",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Resumo
      const resumoData = [
        ['Relatório de Pesquisa de Clima'],
        [''],
        ['Pesquisa', surveyTitle],
        ['Empresa', companyName || '-'],
        ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
        [''],
        ['Indicadores Principais'],
        ['Total de Respostas', stats.totalResponses],
        ['NPS Score', stats.npsScore],
        ['Média Geral', stats.avgScore],
        ['Taxa de Participação (%)', Math.min(100, Math.round(stats.totalResponses / 2))]
      ];
      const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

      // Sheet 2: Por Categoria
      const categoryData = [
        ['Categoria', 'Score', 'Máximo'],
        ...stats.categoryScores.map(cat => [cat.category, cat.score.toFixed(2), cat.fullMark])
      ];
      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoria');

      // Sheet 3: Distribuição NPS
      const npsData = [
        ['Grupo', 'Percentual (%)'],
        ...stats.npsDistribution.map(item => [item.name, item.value])
      ];
      const npsSheet = XLSX.utils.aoa_to_sheet(npsData);
      XLSX.utils.book_append_sheet(workbook, npsSheet, 'Distribuição NPS');

      // Sheet 4: Por Departamento
      const deptData = [
        ['Departamento', 'Respostas'],
        ...stats.departmentDistribution.map(dept => [dept.name, dept.value])
      ];
      const deptSheet = XLSX.utils.aoa_to_sheet(deptData);
      XLSX.utils.book_append_sheet(workbook, deptSheet, 'Por Departamento');

      // Save Excel
      const filename = `pesquisa-clima-${surveyTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Excel exportado",
        description: "A planilha foi baixada com sucesso!",
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
