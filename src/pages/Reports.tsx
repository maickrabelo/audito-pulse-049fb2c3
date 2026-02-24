
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Dados simulados de denúncias
const reportData = [
  {
    id: "REP-2025-042",
    title: "Assédio moral no setor de atendimento",
    category: "RH",
    status: "Em análise",
    date: "23/04/2025",
    urgency: "Alta",
    description: "Funcionário relata comportamento inadequado de supervisor, incluindo gritos e humilhação pública durante reuniões de equipe. Incidentes ocorreram múltiplas vezes nas últimas semanas.",
    department: "Atendimento ao Cliente",
    updates: [
      { date: "23/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "24/04/2025", note: "Análise inicial concluída. Encaminhado para RH para investigação.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-041",
    title: "Descarte inadequado de resíduos",
    category: "Produção",
    status: "Aberta",
    date: "22/04/2025",
    urgency: "Média",
    description: "Denúncia sobre materiais tóxicos sendo descartados incorretamente, sem seguir os protocolos ambientais da empresa. Situação observada no setor de produção, área B.",
    department: "Produção",
    updates: [
      { date: "22/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" }
    ]
  },
  {
    id: "REP-2025-040",
    title: "Divergências em relatório financeiro",
    category: "Financeiro",
    status: "Em análise",
    date: "20/04/2025",
    urgency: "Alta",
    description: "Identificadas divergências significativas entre os valores reportados internamente e os apresentados aos investidores no último trimestre. Possível manipulação de dados financeiros.",
    department: "Financeiro",
    updates: [
      { date: "20/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "21/04/2025", note: "Análise preliminar indica possíveis inconsistências nos relatórios. Investigação aprofundada necessária.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-039",
    title: "Uso inadequado de recursos da empresa",
    category: "TI",
    status: "Resolvida",
    date: "18/04/2025",
    urgency: "Baixa",
    description: "Uso de equipamentos da empresa (laptops e servidores) para mineração de criptomoedas durante o horário de trabalho, causando lentidão na rede e alto consumo de energia.",
    department: "TI",
    updates: [
      { date: "18/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "19/04/2025", note: "Verificação técnica iniciada nos equipamentos mencionados.", author: "Suporte TI" },
      { date: "20/04/2025", note: "Confirmado o uso indevido. Medidas disciplinares aplicadas e software de monitoramento atualizado.", author: "Gerente TI" },
      { date: "21/04/2025", note: "Caso encerrado. Novas políticas de uso implementadas.", author: "Admin" }
    ]
  },
  {
    id: "REP-2025-038",
    title: "Vazamento de informações confidenciais",
    category: "Comercial",
    status: "Em análise",
    date: "17/04/2025",
    urgency: "Alta",
    description: "Suspeita de vazamento de informações sobre novos produtos para concorrentes. Estratégias de preço e lançamento foram aparentemente divulgadas antes do anúncio oficial.",
    department: "Marketing e Vendas",
    updates: [
      { date: "17/04/2025", note: "Denúncia recebida e registrada no sistema.", author: "Sistema" },
      { date: "18/04/2025", note: "Iniciada análise de acessos a documentos confidenciais nos últimos 30 dias.", author: "Segurança da Informação" }
    ]
  },
];

const Reports = () => {
  const [filter, setFilter] = useState({
    status: "",
    category: "",
    search: "",
  });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [newUpdate, setNewUpdate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const { toast } = useToast();
  
  const filteredReports = reportData.filter(report => {
    return (!filter.status || report.status === filter.status) &&
           (!filter.category || report.category === filter.category) &&
           (!filter.search || 
             report.title.toLowerCase().includes(filter.search.toLowerCase()) ||
             report.id.toLowerCase().includes(filter.search.toLowerCase()));
  });

  const handleUpdateSubmit = () => {
    if (!newUpdate.trim() && selectedStatus === selectedReport.status) return;
    
    // Create updated report object with new status and update
    const updatedReport = {
      ...selectedReport,
      status: selectedStatus,
      updates: [
        ...selectedReport.updates,
      ]
    };
    
    // Only add the update message if there is one
    if (newUpdate.trim()) {
      updatedReport.updates.push({
        date: new Date().toLocaleDateString('pt-BR'),
        note: newUpdate,
        author: "Admin"
      });
    }
    
    // Update the report in the data array
    const reportIndex = reportData.findIndex(r => r.id === selectedReport.id);
    if (reportIndex !== -1) {
      reportData[reportIndex] = updatedReport;
    }
    
    // Update the selected report
    setSelectedReport(updatedReport);
    setNewUpdate("");
    
    toast({
      title: "Atualização salva",
      description: "A denúncia foi atualizada com sucesso.",
      variant: "default",
    });
  };

  const handleOpenReportDetails = (report: any) => {
    setSelectedReport(report);
    setSelectedStatus(report.status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolvida':
        return <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                 {status}
               </span>;
      case 'Em análise':
        return <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                 {status}
               </span>;
      case 'Aberta':
        return <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                 {status}
               </span>;
      case 'Arquivada':
        return <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                 {status}
               </span>;
      default:
        return <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                 {status}
               </span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <h1 className="text-3xl font-bold text-audit-primary mb-8">Gerenciamento de Denúncias</h1>
          
          {/* Filtros */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Refine a lista de denúncias usando os filtros abaixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Select
                    value={filter.status}
                    onValueChange={(value) => setFilter({...filter, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Status</SelectItem>
                      <SelectItem value="Aberta">Aberta</SelectItem>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Resolvida">Resolvida</SelectItem>
                      <SelectItem value="Arquivada">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-1/3">
                  <Select
                    value={filter.category}
                    onValueChange={(value) => setFilter({...filter, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as Categorias</SelectItem>
                      <SelectItem value="RH">RH</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Produção">Produção</SelectItem>
                      <SelectItem value="TI">TI</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-1/3">
                  <Input
                    placeholder="Buscar por ID ou título"
                    value={filter.search}
                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de Denúncias */}
          <Card>
            <CardHeader>
              <CardTitle>Denúncias</CardTitle>
              <CardDescription>
                {filteredReports.length} {filteredReports.length === 1 ? "denúncia encontrada" : "denúncias encontradas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">Título</th>
                      <th className="px-4 py-3 text-left font-medium">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-left font-medium">Urgência</th>
                      <th className="px-4 py-3 text-left font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Nenhuma denúncia encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-4 text-audit-primary font-medium">{report.id}</td>
                          <td className="px-4 py-4">{report.title}</td>
                          <td className="px-4 py-4">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                              {report.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="px-4 py-4 text-gray-500">{report.date}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              report.urgency === "Alta" ? "bg-red-100 text-red-800" : 
                              report.urgency === "Média" ? "bg-orange-100 text-orange-800" : 
                              "bg-green-100 text-green-800"
                            }`}>
                              {report.urgency}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Dialog onOpenChange={(open) => {
                              if (open) handleOpenReportDetails(report);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Detalhes</Button>
                              </DialogTrigger>
                              {selectedReport && selectedReport.id === report.id && (
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex justify-between items-center">
                                      <span>{selectedReport.title}</span>
                                      <Badge variant={
                                        selectedReport.status === "Resolvida" ? "default" : 
                                        selectedReport.status === "Em análise" ? "secondary" :
                                        selectedReport.status === "Aberta" ? "outline" : "destructive"
                                      }>
                                        {selectedReport.status}
                                      </Badge>
                                    </DialogTitle>
                                    <DialogDescription className="flex justify-between text-sm">
                                      <span>{selectedReport.id} • Departamento: {selectedReport.department}</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {selectedReport.date}
                                      </span>
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6 my-4">
                                    <div>
                                      <h3 className="font-medium mb-2">Descrição da Denúncia</h3>
                                      <p className="text-gray-700">{selectedReport.description}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3">
                                      <Badge variant="outline" className="bg-gray-100">
                                        Categoria: {selectedReport.category}
                                      </Badge>
                                      <Badge variant="outline" className={`${
                                        selectedReport.urgency === "Alta" ? "bg-red-100 text-red-800 border-red-200" : 
                                        selectedReport.urgency === "Média" ? "bg-orange-100 text-orange-800 border-orange-200" : 
                                        "bg-green-100 text-green-800 border-green-200"
                                      }`}>
                                        Urgência: {selectedReport.urgency}
                                      </Badge>
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-medium mb-3">Histórico de Atualizações</h3>
                                      <div className="space-y-3">
                                        {selectedReport.updates.map((update: any, idx: number) => (
                                          <div key={idx} className="bg-gray-50 p-3 rounded-md border">
                                            <div className="flex justify-between text-sm mb-1">
                                              <span className="font-medium">{update.author}</span>
                                              <span className="text-gray-500">{update.date}</span>
                                            </div>
                                            <p className="text-gray-700">{update.note}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-medium mb-3">Alterar Status</h3>
                                      <Select
                                        value={selectedStatus}
                                        onValueChange={setSelectedStatus}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Selecione um status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Aberta">Aberta</SelectItem>
                                          <SelectItem value="Em análise">Em análise</SelectItem>
                                          <SelectItem value="Resolvida">Resolvida</SelectItem>
                                          <SelectItem value="Arquivada">Arquivada</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-medium mb-3">Adicionar Atualização</h3>
                                      <div className="space-y-3">
                                        <Textarea
                                          placeholder="Adicione uma atualização ou comentário..."
                                          value={newUpdate}
                                          onChange={(e) => setNewUpdate(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                          <Button 
                                            onClick={handleUpdateSubmit}
                                            disabled={!newUpdate.trim() && selectedStatus === selectedReport.status}
                                          >
                                            Adicionar
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              )}
                            </Dialog>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reports;
