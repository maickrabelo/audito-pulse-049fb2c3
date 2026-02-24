import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { SSTManagerSelector } from './SSTManagerSelector';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Message = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  target_sst_manager_ids: string[] | null;
  created_at: string;
};

export const PortalMessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Message | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [targetIds, setTargetIds] = useState<string[] | null>(null);
  const { toast } = useToast();

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sst_portal_messages')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) setMessages((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, []);

  const resetForm = () => {
    setTitle(''); setContent(''); setIsPinned(false); setTargetIds(null); setEditing(null);
  };

  const openNew = () => { resetForm(); setIsOpen(true); };
  const openEdit = (msg: Message) => {
    setEditing(msg); setTitle(msg.title); setContent(msg.content);
    setIsPinned(msg.is_pinned); setTargetIds(msg.target_sst_manager_ids);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" }); return;
    }
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        is_pinned: isPinned,
        target_sst_manager_ids: targetIds,
      };
      if (editing) {
        const { error } = await supabase.from('sst_portal_messages').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: "Recado atualizado" });
      } else {
        const { error } = await supabase.from('sst_portal_messages').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
        if (error) throw error;
        toast({ title: "Recado criado" });
      }
      setIsOpen(false); resetForm(); loadMessages();
    } catch (err) {
      toast({ title: "Erro", description: getSafeErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este recado?')) return;
    const { error } = await supabase.from('sst_portal_messages').delete().eq('id', id);
    if (error) toast({ title: "Erro ao excluir", description: getSafeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Recado excluído" }); loadMessages(); }
  };

  const getTargetLabel = (ids: string[] | null) => ids === null ? 'Todas' : `${ids.length} gestora(s)`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mural de Recados</h3>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Recado</Button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fixado</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map(msg => (
              <TableRow key={msg.id}>
                <TableCell className="font-medium">{msg.title}</TableCell>
                <TableCell>{msg.is_pinned && <Pin className="h-4 w-4 text-primary" />}</TableCell>
                <TableCell>{getTargetLabel(msg.target_sst_manager_ids)}</TableCell>
                <TableCell>{format(new Date(msg.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(msg)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(msg.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum recado cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Recado' : 'Novo Recado'}</DialogTitle>
            <DialogDescription>Preencha as informações do recado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do recado" /></div>
            <div><Label>Conteúdo</Label><Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Conteúdo do recado" rows={4} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={isPinned} onCheckedChange={setIsPinned} id="pinned" />
              <Label htmlFor="pinned">Fixar no topo</Label>
            </div>
            <SSTManagerSelector selectedIds={targetIds} onChange={setTargetIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
