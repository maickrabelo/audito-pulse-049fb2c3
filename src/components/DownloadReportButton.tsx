
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import jsPDF from 'jspdf';

const DownloadReportButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useRealAuth();

  const getDateRange = (period: string) => {
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch (period) {
      case 'last7':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return startDate;
  };

  const handleDownload = async () => {
    if (!profile?.company_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da empresa não encontrado.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single();

      if (companyError) throw companyError;

      // Calcular data inicial
      const startDateObj = getDateRange(startDate);
      
      // Buscar denúncias
      let query = supabase
        .from('reports')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (startDate !== 'all') {
        query = query.gte('created_at', startDateObj.toISOString());
      }

      const { data: reports, error: reportsError } = await query;

      if (reportsError) throw reportsError;

      // Criar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Cabeçalho
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Denúncias', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${company?.name || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      const periodText = {
        'all': 'Todo o período',
        'last7': 'Últimos 7 dias',
        'last30': 'Últimos 30 dias',
        'last90': 'Últimos 90 dias',
        'year': 'Este ano'
      }[startDate] || 'Todo o período';

      doc.text(`Período: ${periodText}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Estatísticas
      const total = reports?.length || 0;
      const pending = reports?.filter(r => r.status === 'pending').length || 0;
      const inProgress = reports?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = reports?.filter(r => r.status === 'resolved').length || 0;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Estatísticas', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de denúncias: ${total}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Pendentes: ${pending}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Em análise: ${inProgress}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Resolvidas: ${resolved}`, margin, yPosition);
      yPosition += 15;

      // Lista de denúncias
      if (reports && reports.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Denúncias Registradas', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        reports.forEach((report, index) => {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          const statusMap: { [key: string]: string } = {
            'pending': 'Pendente',
            'in_progress': 'Em análise',
            'resolved': 'Resolvida',
            'archived': 'Arquivada'
          };

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${report.tracking_code}`, margin, yPosition);
          yPosition += 6;

          doc.setFont('helvetica', 'normal');
          doc.text(`Título: ${report.title}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`Categoria: ${report.category}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`Status: ${statusMap[report.status] || report.status}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`Data: ${new Date(report.created_at).toLocaleDateString('pt-BR')}`, margin + 5, yPosition);
          yPosition += 6;

          if (report.ai_summary) {
            doc.text('Resumo:', margin + 5, yPosition);
            yPosition += 5;
            const summaryLines = doc.splitTextToSize(report.ai_summary, pageWidth - margin * 2 - 10);
            doc.text(summaryLines, margin + 5, yPosition);
            yPosition += summaryLines.length * 5;
          }

          yPosition += 8;
        });
      } else {
        doc.text('Nenhuma denúncia encontrada no período selecionado.', margin, yPosition);
      }

      // Salvar PDF
      doc.save(`relatorio-denuncias-${new Date().toISOString().split('T')[0]}.pdf`);

      setIsOpen(false);
      toast({
        title: "Relatório gerado com sucesso",
        description: "O download do PDF foi iniciado.",
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível gerar o PDF.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Baixar Relatório PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Relatório PDF</DialogTitle>
          <DialogDescription>
            Selecione o período para gerar o relatório com estatísticas e denúncias.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Período</Label>
            <Select value={startDate} onValueChange={setStartDate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="last7">Últimos 7 dias</SelectItem>
                <SelectItem value="last30">Últimos 30 dias</SelectItem>
                <SelectItem value="last90">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadReportButton;
