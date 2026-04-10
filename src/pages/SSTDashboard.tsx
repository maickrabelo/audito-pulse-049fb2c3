import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Users, FileText, ExternalLink, Loader2, Plus, Power, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import AddCompanyDialog from '@/components/sst/AddCompanyDialog';

interface AssignedCompany {
  id: string;
  name: string;
  slug: string | null;
  cnpj: string | null;
  email: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

const SSTDashboard = () => {
  const { profile, role } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<AssignedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<AssignedCompany | null>(null);

  useEffect(() => {
    if (role && role !== 'sst') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  const loadCompanies = async () => {
    if (!profile?.sst_manager_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: assignments, error: assignError } = await supabase
        .from('company_sst_assignments')
        .select('company_id')
        .eq('sst_manager_id', profile.sst_manager_id);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setCompanies([]);
        setIsLoading(false);
        return;
      }

      const companyIds = assignments.map(a => a.company_id);

      const [companiesRes, reportsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, slug, cnpj, email, subscription_status, trial_ends_at')
          .in('id', companyIds),
        supabase
          .from('reports')
          .select('company_id')
          .in('company_id', companyIds),
      ]);

      if (companiesRes.error) throw companiesRes.error;
      setCompanies(companiesRes.data || []);

      if (!reportsRes.error && reportsRes.data) {
        const counts: Record<string, number> = {};
        reportsRes.data.forEach(r => {
          counts[r.company_id] = (counts[r.company_id] || 0) + 1;
        });
        setReportCounts(counts);
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar empresas", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [profile?.sst_manager_id]);

  const toggleCompanyStatus = async (company: AssignedCompany) => {
    setTogglingId(company.id);
    const newStatus = company.subscription_status === 'active' || company.subscription_status === 'trial'
      ? 'inactive'
      : 'active';

    try {
      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: newStatus })
        .eq('id', company.id);

      if (error) throw error;

      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, subscription_status: newStatus } : c
      ));

      toast({
        title: newStatus === 'active' ? "Empresa ativada" : "Empresa desativada",
        description: `${company.name} foi ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error: any) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cnpj && c.cnpj.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isActive = (status: string | null) => status === 'active' || status === 'trial';

  // Iframe view for company dashboard
  if (viewingCompany) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-4 px-4 py-3 bg-background border-b shadow-sm shrink-0">
          <Button variant="outline" size="sm" onClick={() => setViewingCompany(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel SST
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{viewingCompany.name}</span>
            {viewingCompany.cnpj && (
              <span className="text-sm text-muted-foreground">— CNPJ: {viewingCompany.cnpj}</span>
            )}
          </div>
        </div>
        <iframe
          src={`/company-dashboard/${viewingCompany.id}`}
          className="flex-1 w-full border-0"
          title={`Dashboard - ${viewingCompany.name}`}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-muted py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Painel SST</h1>
              <p className="text-muted-foreground mt-1">Gerencie as empresas vinculadas à sua gestão</p>
            </div>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Empresa
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empresas</p>
                    <p className="text-2xl font-bold">{companies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Denúncias</p>
                    <p className="text-2xl font-bold">
                      {Object.values(reportCounts).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                    <p className="text-2xl font-bold">
                      {companies.filter(c => isActive(c.subscription_status)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Company List */}
          {filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {companies.length === 0 ? 'Nenhuma empresa vinculada' : 'Nenhuma empresa encontrada'}
                </h3>
                <p className="text-muted-foreground">
                  {companies.length === 0
                    ? 'Clique em "Cadastrar Empresa" para adicionar uma nova empresa.'
                    : 'Tente buscar com outros termos.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map(company => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <Badge variant={
                        company.subscription_status === 'active' ? 'default' :
                        company.subscription_status === 'trial' ? 'secondary' : 'outline'
                      }>
                        {company.subscription_status === 'active' ? 'Ativa' :
                         company.subscription_status === 'trial' ? 'Trial' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {company.cnpj && (
                      <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                    )}
                    {company.email && (
                      <p className="text-sm text-muted-foreground">{company.email}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{reportCounts[company.id] || 0} denúncias</span>
                    </div>

                    {/* Activate/Deactivate toggle */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <div className="flex items-center gap-2">
                        <Power className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{isActive(company.subscription_status) ? 'Ativa' : 'Inativa'}</span>
                      </div>
                      <Switch
                        checked={isActive(company.subscription_status)}
                        onCheckedChange={() => toggleCompanyStatus(company)}
                        disabled={togglingId === company.id}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/company-dashboard/${company.id}`)}
                      >
                        Ver Dashboard
                      </Button>
                      {company.slug && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${window.location.origin}/report/${company.slug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {profile?.sst_manager_id && (
        <AddCompanyDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          sstManagerId={profile.sst_manager_id}
          onCompanyAdded={loadCompanies}
        />
      )}
    </div>
  );
};

export default SSTDashboard;
