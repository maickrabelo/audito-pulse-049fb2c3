
import React, { useState, useEffect, useRef } from 'react';
import TrackReportModal from '@/components/TrackReportModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Loader2, Send, Paperclip, X, FileImage, FileVideo, FileAudio, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ReportChatProps {
  companyId?: string;
}

interface Attachment {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  filePath?: string;
}

const initialMessages = [
  {
    role: "system",
    content: "Olá, sou Ana, assistente virtual da ouvidoria. Estou aqui para ouvir sua denúncia de forma confidencial. Pode me contar o que aconteceu com detalhes. Em que posso ajudar?",
  },
];

export const ReportChat: React.FC<ReportChatProps> = ({ companyId }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState("");
  const [reportId, setReportId] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [showIdDialog, setShowIdDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Removed automatic scrolling - user can scroll manually if needed

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/', 'video/', 'audio/'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isAllowed) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: `${file.name} não é um arquivo de imagem, vídeo ou áudio.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 50MB.`,
          variant: "destructive",
        });
        continue;
      }

      const attachment: Attachment = {
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };

      newAttachments.push(attachment);
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      
      // Add system message about attachment
      setMessages(prev => [...prev, {
        role: "system",
        content: `📎 ${newAttachments.length} arquivo(s) anexado(s) como prova.`
      }]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadAttachments = async (): Promise<{ file_path: string; file_name: string; file_type: string; file_size: number }[]> => {
    const uploadedFiles: { file_path: string; file_name: string; file_type: string; file_size: number }[] = [];
    
    for (const attachment of attachments) {
      if (attachment.uploaded && attachment.filePath) {
        uploadedFiles.push({
          file_path: attachment.filePath,
          file_name: attachment.file.name,
          file_type: attachment.file.type,
          file_size: attachment.file.size,
        });
        continue;
      }

      const fileExt = attachment.file.name.split('.').pop();
      const fileName = `${sessionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('report-attachments')
        .upload(fileName, attachment.file);

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Erro ao enviar arquivo",
          description: `Não foi possível enviar ${attachment.file.name}.`,
          variant: "destructive",
        });
        continue;
      }

      uploadedFiles.push({
        file_path: fileName,
        file_name: attachment.file.name,
        file_type: attachment.file.type,
        file_size: attachment.file.size,
      });
    }

    return uploadedFiles;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };


  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    
    const userMessage = {
      role: "user",
      content: input,
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to AI...");
      
      const { data, error } = await supabase.functions.invoke('chat-report', {
        body: { 
          messages: updatedMessages.filter(m => m.role !== "system" || m.content.includes("Ana"))
        },
        headers: {
          'x-session-id': sessionId,
          'x-company-id': companyId || ''
        }
      });

      if (error) {
        console.error("Error calling chat function:", error);
        throw error;
      }

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error("Resposta inválida da IA");
      }

      // Remove markdown formatting characters from AI response
      const cleanContent = data.choices[0].message.content
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\*/g, '')    // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove heading markers
        .replace(/`/g, '');    // Remove code markers

      const aiResponse = {
        role: "assistant" as const,
        content: cleanContent,
      };
      
      console.log("AI response received:", aiResponse.content);
      setMessages(prev => [...prev, aiResponse]);
      
      // Show finish button hint after several exchanges
      if (updatedMessages.filter(m => m.role === "user").length >= 3 && !isComplete) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "system",
            content: "Para finalizar a denúncia e gerar o relatório, clique no botão 'Finalizar Denúncia' abaixo."
          }]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível processar sua mensagem. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      // Remove the user message if there was an error
      setMessages(messages);
    } finally {
      setIsLoading(false);
      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFinishReport = async () => {
    setIsLoading(true);
    
    try {
      console.log("Generating report summary...");
      
      // Extract only the conversation between user and assistant
      const conversationText = messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Denunciante" : "Ouvidoria"}: ${m.content}`)
        .join("\n\n");
      
      console.log("Conversation text:", conversationText);
      
      // Send to AI with a specific system prompt for summarization
      const { data, error } = await supabase.functions.invoke('chat-report', {
        body: { 
          messages: [
            {
              role: "system",
              content: `Você é um analista de ouvidoria especializado em criar resumos executivos de denúncias.
              Sua tarefa é analisar a conversa completa e criar um resumo profissional e imparcial.
              
              O resumo deve conter:
              1. Natureza da denúncia (tipo de incidente)
              2. Quando e onde ocorreu
              3. Pessoas envolvidas (sem nomes, use "denunciante", "superior", "colega", etc)
              4. Gravidade e impacto
              
              Use linguagem formal, objetiva e imparcial. Máximo de 4-5 frases.`
            },
            {
              role: "user",
              content: `Analise esta conversa de denúncia e crie um resumo executivo:\n\n${conversationText}`
            }
          ]
        },
        headers: {
          'x-session-id': sessionId,
          'x-company-id': companyId || ''
        }
      });

      if (error) {
        console.error("Error generating summary:", error);
        throw error;
      }

      if (!data || !data.choices || !data.choices[0]) {
        throw new Error("Resposta inválida ao gerar resumo");
      }

      // Remove markdown formatting from summary
      const cleanSummary = data.choices[0].message.content
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\*/g, '')    // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove heading markers
        .replace(/`/g, '');    // Remove code markers

      console.log("Summary generated:", cleanSummary);
      
      // Extract category and department from conversation
      const { data: classificationData, error: classificationError } = await supabase.functions.invoke('chat-report', {
        body: { 
          messages: [
            {
              role: "system",
              content: `Você é um classificador de denúncias. Analise a conversa e retorne APENAS um JSON válido (sem markdown) com:
              {
                "category": "uma das opções: Assédio, Discriminação, Fraude, Segurança, Conflito, Produção, RH, TI, Financeiro, Comercial, Outro",
                "department": "nome do departamento/setor mencionado ou null se não mencionado"
              }`
            },
            {
              role: "user",
              content: `Classifique esta denúncia:\n\n${conversationText}`
            }
          ]
        },
        headers: {
          'x-session-id': sessionId,
          'x-company-id': companyId || ''
        }
      });

      let category = "Outros";
      let department = null;

      if (!classificationError && classificationData?.choices?.[0]?.message?.content) {
        try {
          const classification = JSON.parse(
            classificationData.choices[0].message.content
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim()
          );
          category = classification.category || "Outros";
          department = classification.department || null;
          console.log("Classification extracted:", { category, department });
        } catch (e) {
          console.error("Error parsing classification:", e);
        }
      }
      
      setSummary(cleanSummary);
      setIsComplete(true);
      
      // Store classification for later use
      (window as any).__reportClassification = { category, department };
    } catch (error) {
      console.error("Error in handleFinishReport:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!companyId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsUploading(true);
    
    try {
      // Upload attachments first
      const uploadedAttachments = await uploadAttachments();
      setIsUploading(false);

      // Extract conversation for description
      const conversationText = messages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Denunciante" : "Ouvidoria"}: ${m.content}`)
        .join("\n\n");

      // Get classification from previous analysis
      const classification = (window as any).__reportClassification || { 
        category: "Outros", 
        department: null 
      };

      // Use the submit-report edge function instead of direct insert
      const { data, error } = await supabase.functions.invoke('submit-report', {
        body: {
          company_id: companyId,
          title: summary.substring(0, 100) || "Denúncia via chat",
          description: conversationText,
          ai_summary: summary,
          category: classification.category,
          department: classification.department,
          is_anonymous: true,
          attachments: uploadedAttachments,
        }
      });

      if (error) {
        console.error('Error saving report:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Erro ao salvar denúncia");
      }

      // Update the reportId with the one generated by the database
      if (data.tracking_code) {
        setReportId(data.tracking_code);
        // Show the dialog only after successful save with the correct tracking code
        setShowIdDialog(true);
      } else {
        throw new Error("Código de rastreamento não foi gerado");
      }
    } catch (error: any) {
      console.error('Error in handleSaveReport:', error);
      toast({
        title: "Erro ao salvar denúncia",
        description: error?.message || "Não foi possível salvar a denúncia. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessages = () => {
    return messages.map((message, index) => {
      if (message.role === "system") {
        return (
          <div key={index} className="bg-muted/50 p-4 rounded-md mb-4 text-center">
            <p className="text-sm">{message.content}</p>
          </div>
        );
      }
      
      const isUser = message.role === "user";
      return (
        <div 
          key={index} 
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div 
            className={`max-w-[80%] rounded-lg p-3 ${
              isUser 
                ? 'bg-audit-primary text-white rounded-br-none' 
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            {isUser && (
              <div className="flex justify-end mt-1">
                <CheckCheck size={16} className="text-white/70" />
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {reportId && (
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-1 border-2 border-audit-secondary">
              ID: {reportId}
            </Badge>
            <TrackReportModal />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Guarde este ID para acompanhar sua denúncia posteriormente.
          </p>
        </div>
      )}
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chat da Ouvidoria</span>
            {isComplete && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Finalizado</Badge>}
          </CardTitle>
          <CardDescription>
            Converse com nossa assistente virtual para registrar sua denúncia.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="h-[400px] overflow-y-auto mb-4 p-2">
            {renderMessages()}
            {isLoading && (
              <div className="flex justify-center my-2">
                <Loader2 className="h-5 w-5 animate-spin text-audit-primary" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {isComplete && (
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <h3 className="font-medium text-lg mb-2">Resumo da Denúncia</h3>
              <p className="text-gray-700">{summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Status:</span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Pronto para envio
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  O resumo não está correto?
                </p>
              </div>
            </div>
          )}
          
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
              {attachments.map((att, index) => (
                <div key={index} className="relative flex items-center gap-2 bg-background p-2 rounded border">
                  {att.preview ? (
                    <img src={att.preview} alt={att.file.name} className="h-10 w-10 object-cover rounded" />
                  ) : (
                    getFileIcon(att.file.type)
                  )}
                  <span className="text-xs max-w-[100px] truncate">{att.file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-destructive hover:bg-destructive/10 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Anexar arquivos (fotos, vídeos, áudios)"
              className="flex items-center gap-2 px-3"
            >
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Anexar</span>
            </Button>
            <Input
              ref={inputRef}
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
              disabled={isLoading}
              className="flex-grow"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          {!isComplete ? (
            <div className="w-full flex justify-end">
              <Button 
                onClick={handleFinishReport}
                disabled={isLoading || messages.length < 5}
                variant={messages.length < 5 ? "outline" : "default"}
                className="ml-auto"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Finalizar Denúncia
              </Button>
            </div>
          ) : (
            <div className="w-full flex justify-between">
              <Button 
                onClick={() => {
                  setIsComplete(false);
                  setMessages(prev => [...prev, {
                    role: "system",
                    content: "Você pode continuar conversando para fazer ajustes no relato. Quando terminar, clique novamente em 'Finalizar Denúncia'."
                  }]);
                }}
                variant="outline"
                disabled={isLoading}
              >
                Corrigir Resumo
              </Button>
              <Button 
                onClick={handleSaveReport}
                disabled={isLoading}
                className="bg-audit-primary hover:bg-audit-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Enviando arquivos...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar e Enviar {attachments.length > 0 && `(${attachments.length} anexo${attachments.length > 1 ? 's' : ''})`}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Dialog to show report ID */}
      <Dialog open={showIdDialog} onOpenChange={setShowIdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Denúncia Registrada</DialogTitle>
            <DialogDescription>
              Guarde o código de acompanhamento para consultar o status de sua denúncia no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            <div className="bg-gray-50 w-full p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Código de Acompanhamento:</p>
              <p className="text-2xl font-bold text-audit-primary">{reportId}</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Anote este código em um local seguro. Você precisará dele para acompanhar o status da denúncia.
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(reportId);
                toast({
                  title: "Código copiado",
                  description: "O código de acompanhamento foi copiado para a área de transferência."
                });
              }}
              className="mr-2"
            >
              Copiar código
            </Button>
            <Button onClick={() => {
              setShowIdDialog(false);
              toast({
                title: "Obrigado!",
                description: "Você será redirecionado para a página inicial."
              });
              setTimeout(() => {
                navigate('/');
              }, 1500);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
