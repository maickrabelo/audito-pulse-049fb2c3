import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  category: string;
  created_at: string;
}

const PortalDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("sst_portal_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractStoragePath = (fileUrl: string): string => {
    const marker = "/object/public/sst-portal-documents/";
    const idx = fileUrl.indexOf(marker);
    if (idx !== -1) {
      return fileUrl.substring(idx + marker.length);
    }
    return fileUrl;
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const storagePath = extractStoragePath(fileUrl);
      const { data, error } = await supabase.storage
        .from("sst-portal-documents")
        .createSignedUrl(storagePath, 60);

      if (error) throw error;

      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading:", error);
      window.open(fileUrl, "_blank");
    }
  };

  const categories = [...new Set(documents.map((d) => d.category))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Nenhum documento disponível</h3>
        <p className="text-muted-foreground text-sm">
          Os documentos serão disponibilizados em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {category === "general" ? "Geral" : category}
          </h3>
          <div className="grid gap-3">
            {documents
              .filter((d) => d.category === category)
              .map((doc) => (
                <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="bg-primary/10 rounded-lg p-3 flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.title}</h4>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.file_url, doc.file_name)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortalDocuments;
