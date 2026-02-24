import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const RelatorioDemo = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img 
          src="/lovable-uploads/Logo_SOIA.png" 
          alt="SOIA Logo" 
          className="h-10 mx-auto"
        />
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Relatório Demo HSE-IT</h1>
        <p className="text-muted-foreground">
          Clique no botão abaixo para baixar o relatório demonstrativo de avaliação HSE-IT.
        </p>
        <a href="/downloads/relatorio-demo-hseit.pdf" download>
          <Button size="lg" className="gap-2 w-full">
            <Download className="h-5 w-5" />
            Baixar Relatório PDF
          </Button>
        </a>
        <Link to="/">
          <Button variant="ghost" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RelatorioDemo;
