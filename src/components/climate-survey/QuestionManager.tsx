import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit2, 
  Save, 
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { gptwCategories } from "@/data/gptwQuestions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface SurveyQuestion {
  id?: string;
  tempId?: string;
  question_text: string;
  question_type: 'likert' | 'scale_0_10' | 'open_text';
  category: string;
  order_index: number;
  is_required: boolean;
  isDeleted?: boolean;
}

interface QuestionManagerProps {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
}

const questionTypeLabels = {
  likert: 'Likert (1-5)',
  scale_0_10: 'NPS (0-10)',
  open_text: 'Texto Aberto'
};

const categoryLabels: Record<string, string> = {
  credibilidade: 'Credibilidade',
  respeito: 'Respeito',
  imparcialidade: 'Imparcialidade',
  orgulho: 'Orgulho',
  camaradagem: 'Camaradagem',
  nps: 'NPS',
  open: 'Perguntas Abertas',
  custom: 'Personalizada'
};

export function QuestionManager({ questions, onChange }: QuestionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SurveyQuestion>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<SurveyQuestion>>({
    question_text: '',
    question_type: 'likert',
    category: 'custom',
    is_required: true
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const activeQuestions = questions.filter(q => !q.isDeleted);
  
  // Group questions by category
  const questionsByCategory = activeQuestions.reduce((acc, q) => {
    const cat = q.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {} as Record<string, SurveyQuestion[]>);

  const categoryOrder = ['credibilidade', 'respeito', 'imparcialidade', 'orgulho', 'camaradagem', 'nps', 'open', 'custom'];
  const sortedCategories = Object.keys(questionsByCategory).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  const handleDelete = (questionId: string) => {
    const updated = questions.map(q => {
      const qId = q.id || q.tempId;
      if (qId === questionId) {
        return { ...q, isDeleted: true };
      }
      return q;
    });
    onChange(updated);
  };

  const handleEdit = (question: SurveyQuestion) => {
    const qId = question.id || question.tempId;
    setEditingId(qId || null);
    setEditForm({ ...question });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.question_text?.trim()) return;
    
    const updated = questions.map(q => {
      const qId = q.id || q.tempId;
      if (qId === editingId) {
        return { ...q, ...editForm };
      }
      return q;
    });
    onChange(updated);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNew = () => {
    if (!newQuestion.question_text?.trim()) return;

    const maxOrder = Math.max(...activeQuestions.map(q => q.order_index), -1);
    const tempId = `new-${Date.now()}`;
    
    const questionToAdd: SurveyQuestion = {
      tempId,
      question_text: newQuestion.question_text!,
      question_type: newQuestion.question_type as 'likert' | 'scale_0_10' | 'open_text',
      category: newQuestion.category!,
      order_index: maxOrder + 1,
      is_required: newQuestion.is_required ?? true
    };

    onChange([...questions, questionToAdd]);
    setNewQuestion({
      question_text: '',
      question_type: 'likert',
      category: 'custom',
      is_required: true
    });
    setIsAddingNew(false);
    
    // Expand the category where the new question was added
    setExpandedCategories(prev => ({ ...prev, [questionToAdd.category]: true }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const getCategoryStats = (category: string) => {
    const catQuestions = questionsByCategory[category] || [];
    return {
      total: catQuestions.length,
      required: catQuestions.filter(q => q.is_required).length
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Perguntas da Pesquisa</h3>
          <p className="text-sm text-muted-foreground">
            {activeQuestions.length} perguntas • {activeQuestions.filter(q => q.is_required).length} obrigatórias
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Pergunta
        </Button>
      </div>

      {/* Add New Question Form */}
      {isAddingNew && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">Nova Pergunta</h4>
            
            <div className="space-y-2">
              <Label>Texto da Pergunta *</Label>
              <Textarea
                value={newQuestion.question_text || ''}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Digite a pergunta..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={newQuestion.question_type}
                  onValueChange={(val) => setNewQuestion(prev => ({ ...prev, question_type: val as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="likert">Likert (1-5)</SelectItem>
                    <SelectItem value="scale_0_10">NPS (0-10)</SelectItem>
                    <SelectItem value="open_text">Texto Aberto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={newQuestion.category}
                  onValueChange={(val) => setNewQuestion(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gptwCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="nps">NPS</SelectItem>
                    <SelectItem value="open">Perguntas Abertas</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={newQuestion.is_required ?? true}
                  onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, is_required: checked }))}
                />
                <Label>Obrigatória</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleAddNew} disabled={!newQuestion.question_text?.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions by Category */}
      <div className="space-y-2">
        {sortedCategories.map(category => {
          const stats = getCategoryStats(category);
          const isExpanded = expandedCategories[category] ?? false;
          
          return (
            <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="font-medium">{categoryLabels[category] || category}</span>
                    <Badge variant="secondary">{stats.total} perguntas</Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="space-y-2 mt-2 ml-4">
                  {questionsByCategory[category]?.map((question, idx) => {
                    const qId = question.id || question.tempId;
                    const isEditing = editingId === qId;

                    return (
                      <Card key={qId} className={isEditing ? 'border-primary' : ''}>
                        <CardContent className="p-3">
                          {isEditing ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editForm.question_text || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, question_text: e.target.value }))}
                                rows={2}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Select 
                                  value={editForm.question_type}
                                  onValueChange={(val) => setEditForm(prev => ({ ...prev, question_type: val as any }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="likert">Likert (1-5)</SelectItem>
                                    <SelectItem value="scale_0_10">NPS (0-10)</SelectItem>
                                    <SelectItem value="open_text">Texto Aberto</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select 
                                  value={editForm.category}
                                  onValueChange={(val) => setEditForm(prev => ({ ...prev, category: val }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gptwCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                    <SelectItem value="nps">NPS</SelectItem>
                                    <SelectItem value="open">Perguntas Abertas</SelectItem>
                                    <SelectItem value="custom">Personalizada</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={editForm.is_required ?? true}
                                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_required: checked }))}
                                  />
                                  <Label className="text-sm">Obrigatória</Label>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{question.question_text}</p>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {questionTypeLabels[question.question_type]}
                                    </Badge>
                                    {question.is_required && (
                                      <Badge variant="secondary" className="text-xs">Obrigatória</Badge>
                                    )}
                                    {question.tempId && (
                                      <Badge className="text-xs bg-green-500">Nova</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(question)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. A pergunta será removida da pesquisa.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(qId!)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {activeQuestions.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma pergunta adicionada.</p>
          <Button variant="link" onClick={() => setIsAddingNew(true)}>
            Adicionar primeira pergunta
          </Button>
        </div>
      )}
    </div>
  );
}
