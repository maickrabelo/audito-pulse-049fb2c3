import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, User } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useNavigate } from 'react-router-dom';
import { getSafeErrorMessage } from '@/lib/errorUtils';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'sst' | 'pending';
  created_at: string;
  company_id: string | null;
  sst_manager_id: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [sstManagers, setSstManagers] = useState<any[]>([]);
  const { toast } = useToast();
  const { role } = useRealAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
    fetchCompanies();
    fetchSSTManagers();
  }, [role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Call the secure edge function to list users
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
  };

  const fetchSSTManagers = async () => {
    const { data } = await supabase.from('sst_managers').select('*');
    setSstManagers(data || []);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('update-user-role', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { userId, newRole },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Papel atualizado",
        description: "O papel do usuário foi alterado com sucesso.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar papel",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const updateUserCompany = async (userId: string, companyId: string | null) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('update-user-profile', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { userId, companyId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Empresa atualizada",
        description: "A empresa do usuário foi alterada com sucesso.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar empresa",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const updateUserSST = async (userId: string, sstId: string | null) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('update-user-profile', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { userId, sstManagerId: sstId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Gestora SST atualizada",
        description: "A gestora SST do usuário foi alterada com sucesso.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar gestora SST",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: <Badge className="bg-red-500">Admin</Badge>,
      company: <Badge className="bg-blue-500">Empresa</Badge>,
      sst: <Badge className="bg-green-500">SST</Badge>,
      pending: <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>,
    };
    return badges[role as keyof typeof badges] || <Badge>Desconhecido</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Gestão de Usuários
              </h1>
              <p className="text-gray-600">Gerencie papéis e permissões dos usuários</p>
            </div>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 rounded-full p-2">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.full_name || 'Sem nome'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Papel</label>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                          <SelectItem value="sst">SST</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {user.role === 'company' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Empresa</label>
                        <Select
                          value={user.company_id || 'none'}
                          onValueChange={(value) => updateUserCompany(user.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {user.role === 'sst' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gestora SST</label>
                        <Select
                          value={user.sst_manager_id || 'none'}
                          onValueChange={(value) => updateUserSST(user.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar gestora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {sstManagers.map((sst) => (
                              <SelectItem key={sst.id} value={sst.id}>
                                {sst.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserManagement;
