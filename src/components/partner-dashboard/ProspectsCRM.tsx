import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Prospect {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface ProspectsCRMProps {
  partnerId: string;
}

const statusOptions = [
  { value: "lead", label: "Lead", color: "bg-gray-500" },
  { value: "contacted", label: "Contactado", color: "bg-blue-500" },
  { value: "negotiating", label: "Em Negociação", color: "bg-yellow-500" },
  { value: "proposal_sent", label: "Proposta Enviada", color: "bg-purple-500" },
  { value: "converted", label: "Convertido", color: "bg-green-500" },
  { value: "lost", label: "Perdido", color: "bg-red-500" },
];

const ProspectsCRM = ({ partnerId }: ProspectsCRMProps) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    status: "lead",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, [partnerId]);

  const fetchProspects = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_prospects")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Erro ao carregar prospectos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prospect?: Prospect) => {
    if (prospect) {
      setEditingProspect(prospect);
      setFormData({
        company_name: prospect.company_name,
        contact_name: prospect.contact_name || "",
        email: prospect.email || "",
        phone: prospect.phone || "",
        status: prospect.status,
        notes: prospect.notes || "",
      });
    } else {
      setEditingProspect(null);
      setFormData({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        status: "lead",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editingProspect) {
        const { error } = await supabase
          .from("partner_prospects")
          .update({
            company_name: formData.company_name,
            contact_name: formData.contact_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            status: formData.status,
            notes: formData.notes || null,
          })
          .eq("id", editingProspect.id);

        if (error) throw error;
        toast.success("Prospecto atualizado!");
      } else {
        const { error } = await supabase.from("partner_prospects").insert({
          partner_id: partnerId,
          company_name: formData.company_name,
          contact_name: formData.contact_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          status: formData.status,
          notes: formData.notes || null,
        });

        if (error) throw error;
        toast.success("Prospecto adicionado!");
      }

      setDialogOpen(false);
      fetchProspects();
    } catch (error: any) {
      console.error("Error saving prospect:", error);
      toast.error(error.message || "Erro ao salvar prospecto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este prospecto?")) return;

    try {
      const { error } = await supabase
        .from("partner_prospects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Prospecto excluído!");
      fetchProspects();
    } catch (error: any) {
      console.error("Error deleting prospect:", error);
      toast.error(error.message || "Erro ao excluir prospecto");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={`${statusInfo?.color} text-white`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM de Prospectos</h2>
          <p className="text-muted-foreground">
            Gerencie suas oportunidades de negócio
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Prospecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProspect ? "Editar Prospecto" : "Novo Prospecto"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Nome da Empresa *</label>
                <Input
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nome do Contato</label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                  placeholder="Nome do contato"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Anotações sobre o prospecto..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum prospecto cadastrado</p>
              <Button
                variant="link"
                onClick={() => handleOpenDialog()}
                className="mt-2"
              >
                Adicionar primeiro prospecto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">
                      {prospect.company_name}
                    </TableCell>
                    <TableCell>{prospect.contact_name || "-"}</TableCell>
                    <TableCell>{prospect.email || "-"}</TableCell>
                    <TableCell>{getStatusBadge(prospect.status)}</TableCell>
                    <TableCell>
                      {new Date(prospect.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(prospect)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(prospect.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProspectsCRM;
