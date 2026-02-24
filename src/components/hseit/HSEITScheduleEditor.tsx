import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export interface ScheduleItem {
  id: string;
  action: string;
  deadline: string;
  responsible: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface HSEITScheduleEditorProps {
  scheduleItems: ScheduleItem[];
  onUpdate: (items: ScheduleItem[]) => void;
}

const STATUS_LABELS = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído'
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

export function HSEITScheduleEditor({ scheduleItems, onUpdate }: HSEITScheduleEditorProps) {
  const addItem = () => {
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      action: '',
      deadline: '',
      responsible: '',
      status: 'pending'
    };
    onUpdate([...scheduleItems, newItem]);
  };

  const updateItem = (id: string, field: keyof ScheduleItem, value: string) => {
    onUpdate(scheduleItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    onUpdate(scheduleItems.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cronograma Sugerido</h3>
        <Button onClick={addItem} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {scheduleItems.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p>Nenhum item no cronograma.</p>
          <p className="text-sm">Clique em "Adicionar Item" para começar.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[35%]">Ação</TableHead>
                <TableHead className="w-[20%]">Prazo</TableHead>
                <TableHead className="w-[20%]">Responsável</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[10%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.action}
                      onChange={(e) => updateItem(item.id, 'action', e.target.value)}
                      placeholder="Descreva a ação..."
                      className="border-0 bg-transparent focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.deadline}
                      onChange={(e) => updateItem(item.id, 'deadline', e.target.value)}
                      placeholder="Ex: 30/01/2025"
                      className="border-0 bg-transparent focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.responsible}
                      onChange={(e) => updateItem(item.id, 'responsible', e.target.value)}
                      placeholder="Nome/Cargo"
                      className="border-0 bg-transparent focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateItem(item.id, 'status', value)}
                    >
                      <SelectTrigger className="border-0 bg-transparent">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[key as ScheduleItem['status']]}`}>
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Dica: Defina prazos realistas e atribua responsáveis claros para cada ação.
      </p>
    </div>
  );
}
