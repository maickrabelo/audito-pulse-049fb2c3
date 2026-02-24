import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { SSTManagerSelector } from './SSTManagerSelector';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Document = {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  category: string | null;
  target_sst_manager_ids: string[] | null;
  created_at: string;
};

const CATEGORIES = ['Geral', 'Contratos', 'Procedimentos', 'Formulários', 'Legislação', 'Outros'];

export const PortalDocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [targetIds, setTargetIds] = useState<string[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sst_portal_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setDocuments((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { loadDocuments(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('Geral'); setTargetIds(null); setFile(null); setEditing(null);
  };

  const openNew = () => { resetForm(); setIsOpen(true); };
  const openEdit = (doc: Document) => {
    setEditing(doc); setTitle(doc.title); setDescription(doc.description || '');
    setCategory(doc.category || 'Geral'); setTargetIds(doc.target_sst_manager_ids);
    setFile(null); setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Preencha o título", variant: "destructive" }); return;
    }
    if (!editing && !file) {
      toast({ title: "Selecione um arquivo", variant: "destructive" }); return;
    }

    setSaving(true);
    try {
      let fileUrl = editing?.file_url || '';
      let fileName = editing?.file_name || '';

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('sst-portal-documents').upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('sst-portal-documents').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        target_sst_manager_ids: targetIds,
        file_url: fileUrl,
        file_name: fileName,
      };

      if (editing) {
        const { error } = await supabase.from('sst_portal_documents').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: "Documento atualizado" });
      } else {
        const { error } = await supabase.from('sst_portal_documents').insert({
          ...payload,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
        if (error) throw error;
        toast({ title: "Documento criado" });
      }
      setIsOpen(false); resetForm(); loadDocuments();
    } catch (err) {
      toast({ title: "Erro", description: getSafeErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este documento?')) return;
    const { error } = await supabase.from('sst_portal_documents').delete().eq('id', id);
    if (error) toast({ title: "Erro ao excluir", description: getSafeErrorMessage(error), variant: "destructive" });
    else { toast({ title: "Documento excluído" }); loadDocuments(); }
  };

  const getTargetLabel = (ids: string[] | null) => ids === null ? 'Todas' : `${ids.length} gestora(s)`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documentos</h3>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Documento</Button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(doc => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.category}</TableCell>
                <TableCell className="flex items-center gap-1"><FileText className="h-4 w-4" />{doc.file_name}</TableCell>
                <TableCell>{getTargetLabel(doc.target_sst_manager_ids)}</TableCell>
                <TableCell>{format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(doc)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {documents.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum documento cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
            <DialogDescription>Preencha as informações do documento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do documento" /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo {editing && '(deixe vazio para manter o atual)'}</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              {editing && <p className="text-xs text-muted-foreground mt-1">Atual: {editing.file_name}</p>}
            </div>
            <SSTManagerSelector selectedIds={targetIds} onChange={setTargetIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
