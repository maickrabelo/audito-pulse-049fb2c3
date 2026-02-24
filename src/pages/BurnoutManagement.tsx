import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentManager } from "@/components/climate-survey/DepartmentManager";
import { QRCodePreview } from "@/components/climate-survey/QRCodePreview";
import { ArrowLeft, Save, Flame } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string | null;
}

interface Department {
  id?: string;
  name: string;
  employee_count: number;
  order_index: number;
}

export default function BurnoutManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Form state
  const [companyId, setCompanyId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (role !== 'admin' && role !== 'sst') {
        navigate('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, role, authLoading, navigate, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies based on role
      let companiesQuery = supabase.from('companies').select('id, name, slug');
      
      if (role === 'sst') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('sst_manager_id')
          .eq('id', user?.id)
          .single();
          
        if (profile?.sst_manager_id) {
          const { data: assignments } = await supabase
            .from('company_sst_assignments')
            .select('company_id')
            .eq('sst_manager_id', profile.sst_manager_id);
            
          const companyIds = assignments?.map(a => a.company_id) || [];
          companiesQuery = companiesQuery.in('id', companyIds);
        }
      }
      
      const { data: companiesData } = await companiesQuery;
      setCompanies(companiesData || []);
      
      // If only one company, auto-select it
      if (companiesData?.length === 1 && !id) {
        setCompanyId(companiesData[0].id);
      }
      
      // If editing, fetch assessment data
      if (id) {
        const { data: assessment, error } = await supabase
          .from('burnout_assessments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (assessment) {
          setCompanyId(assessment.company_id);
          setTitle(assessment.title);
          setDescription(assessment.description || "");
          setStartDate(assessment.start_date?.split('T')[0] || "");
          setEndDate(assessment.end_date?.split('T')[0] || "");
          setIsActive(assessment.is_active);
          
          // Fetch departments
          const { data: depts } = await supabase
            .from('burnout_departments')
            .select('*')
            .eq('assessment_id', id)
            .order('order_index');
            
          setDepartments(depts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da avaliação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      toast({
        title: "Empresa obrigatória",
        description: "Por favor, selecione uma empresa.",
        variant: "destructive"
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a avaliação.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const assessmentData = {
        company_id: companyId,
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
        created_by: user?.id
      };
      
      let assessmentId = id;
      
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('burnout_assessments')
          .update(assessmentData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('burnout_assessments')
          .insert(assessmentData)
          .select()
          .single();
          
        if (error) throw error;
        assessmentId = data.id;
      }
      
      // Handle departments
      if (assessmentId) {
        // Delete removed departments
        const existingIds = departments.filter(d => d.id).map(d => d.id);
        if (id) {
          await supabase
            .from('burnout_departments')
            .delete()
            .eq('assessment_id', assessmentId)
            .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);
        }
        
        // Upsert departments
        for (const dept of departments) {
          if (dept.id) {
            await supabase
              .from('burnout_departments')
              .update({
                name: dept.name,
                employee_count: dept.employee_count,
                order_index: dept.order_index
              })
              .eq('id', dept.id);
          } else {
            await supabase
              .from('burnout_departments')
              .insert({
                assessment_id: assessmentId,
                name: dept.name,
                employee_count: dept.employee_count,
                order_index: dept.order_index
              });
          }
        }
      }
      
      toast({
        title: "Salvo com sucesso!",
        description: id ? "A avaliação foi atualizada." : "A avaliação foi criada."
      });
      
      navigate('/burnout-dashboard');
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a avaliação.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getFormUrl = () => {
    const company = companies.find(c => c.id === companyId);
    if (company?.slug && id) {
      return `${window.location.origin}/burnout/${company.slug}/${id}`;
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/burnout-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              {id ? 'Editar Avaliação de Burnout' : 'Nova Avaliação de Burnout'}
            </h1>
            <p className="text-muted-foreground">
              {id ? 'Atualize as configurações da avaliação' : 'Configure uma nova avaliação de risco de Burnout'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Configure os detalhes da avaliação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Avaliação de Burnout 2024"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o objetivo desta avaliação..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <Label htmlFor="isActive">Avaliação Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que funcionários respondam a avaliação
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Setores / Departamentos</CardTitle>
                <CardDescription>
                  Configure os setores que serão avaliados (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
              <DepartmentManager
                departments={departments}
                onChange={setDepartments}
              />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/burnout-dashboard')}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
            
            {id && getFormUrl() && (
              <QRCodePreview url={getFormUrl()!} />
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Sobre o Questionário
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Baseado no <strong>Link Burnout Questionnaire (LBQ)</strong> e no{" "}
                  <strong>Maslach Burnout Inventory (MBI)</strong>.
                </p>
                <p>
                  O questionário contém <strong>20 questões</strong> divididas em 3 categorias:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Exaustão (5 questões)</li>
                  <li>Despersonalização (7 questões)</li>
                  <li>Desmotivação (8 questões)</li>
                </ul>
                <p className="pt-2">
                  Escala de 1 a 6 pontos por questão, com pontuação total de 20 a 120 pontos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
