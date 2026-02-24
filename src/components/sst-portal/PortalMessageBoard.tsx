import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

const PortalMessageBoard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("sst_portal_messages")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Nenhum recado disponível</h3>
        <p className="text-muted-foreground text-sm">
          Os recados serão publicados aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`transition-shadow hover:shadow-sm ${
            message.is_pinned ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                {message.is_pinned && (
                  <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                {message.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                {message.is_pinned && (
                  <Badge variant="secondary" className="text-xs">
                    Fixado
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {message.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PortalMessageBoard;
