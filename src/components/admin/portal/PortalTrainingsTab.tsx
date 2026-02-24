import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { SSTManagerSelector } from './SSTManagerSelector';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Training = {
  id: string;
  title: string;
  description: string | null;
  content_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  category: string | null;
  target_sst_manager_ids: string[] | null;
  created_at: string;
};

const CATEGORIES = ['Geral', 'NR', 'SST', 'Gestão', 'Compliance', 'Outros'];

export const PortalTrainingsTab: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Geral');
  const [targetIds, setTargetIds] = useState<string[] | null>(null);
  const { toast } = useToast();

  const loadTrainings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sst_portal_trainings')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTrainings((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadTrainings(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setContentUrl(''); setThumbnailUrl('');
    setDuration(''); setCategory('Geral'); setTargetIds(null); setEditing(null);
  };

  const openNew = () => { resetForm(); setIsOpen(true); };
  const openEdit = (t: Training) => {
    setEditing(t); setTitle(t.title); setDescription(t.description || '');
    setContentUrl(t.content_url || ''); setThumbnailUrl(t.thumbnail_url || '');
    setDuration(t.duration_minutes?.toString() || ''); setCategory(t.category || 'Geral');
    setTargetIds(t.target_sst_manager_ids); setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Preencha o título", variant: "destructive" }); return;
    }
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        content_url: contentUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        category,
        target_sst_manager_ids: targetIds,
      };
      if (editing) {
        const { error } = await supabase.from('sst_portal_trainings').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: "Treinamento atualizado" });
      } else {
        const { error } = await supabase.from('sst_portal_trainings').insert({
          ...payload,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
        if (error) throw error;
        toast({ title: "Treinamento criado" });
      }
      setIsOpen(false); resetForm(); loadTrainings();
    } catch (err) {
      toast({ title: "Erro", description: getSafeErrorMessage(err), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este treinamento?')) return;
    const { error } = await supabase.from('sst_portal_trainings').delete().eq('id', id);
    if (error) toast({ title: "Erro ao excluir", description: getSafeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Treinamento excluído" }); loadTrainings(); }
  };

  const getTargetLabel = (ids: string[] | null) => ids === null ? 'Todas' : `${ids.length} gestora(s)`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Treinamentos</h3>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Treinamento</Button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainings.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  {t.duration_minutes && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration_minutes} min</span>
                  )}
                </TableCell>
                <TableCell>{getTargetLabel(t.target_sst_manager_ids)}</TableCell>
                <TableCell>{format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {trainings.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum treinamento cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Treinamento' : 'Novo Treinamento'}</DialogTitle>
            <DialogDescription>Preencha as informações do treinamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do treinamento" /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2} /></div>
            <div><Label>URL do Conteúdo</Label><Input value={contentUrl} onChange={e => setContentUrl(e.target.value)} placeholder="https://..." /></div>
            <div><Label>URL da Thumbnail</Label><Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (minutos)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex: 30" min="1" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
