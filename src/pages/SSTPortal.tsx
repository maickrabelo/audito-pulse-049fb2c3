import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRealAuth } from "@/contexts/RealAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, GraduationCap, MessageSquare, ScrollText } from "lucide-react";
import { Loader2 } from "lucide-react";
import PortalDocuments from "@/components/sst-portal/PortalDocuments";
import PortalTrainings from "@/components/sst-portal/PortalTrainings";
import PortalMessageBoard from "@/components/sst-portal/PortalMessageBoard";
import PortalContractInfo from "@/components/sst-portal/PortalContractInfo";

const SSTPortal = () => {
  const { user, role, isLoading } = useRealAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || role !== "sst")) {
      navigate("/auth");
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portal do Parceiro</h1>
              <p className="text-muted-foreground mt-1">
                Documentos, treinamentos e informações do seu contrato
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/sst-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="messages" className="flex items-center gap-2 py-3">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Mural de Recados</span>
                <span className="sm:hidden">Mural</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentos</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="trainings" className="flex items-center gap-2 py-3">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Treinamentos</span>
                <span className="sm:hidden">Treinos</span>
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-2 py-3">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Contrato</span>
                <span className="sm:hidden">Contrato</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <PortalMessageBoard />
            </TabsContent>

            <TabsContent value="documents">
              <PortalDocuments />
            </TabsContent>

            <TabsContent value="trainings">
              <PortalTrainings />
            </TabsContent>

            <TabsContent value="contract">
              <PortalContractInfo />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SSTPortal;
