
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CompanyProfile = () => {
  const { user, profile } = useRealAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setCompanyLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: companyName,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReportUrl = () => {
    // Generate a clean URL slug for this company's report page
    const companySlug = companyName
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    return `${window.location.origin}/report/${companySlug}`;
  };

  const reportUrl = handleGenerateReportUrl();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <h1 className="text-3xl font-bold text-audit-primary mb-8">Perfil da Empresa</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Logo */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logo da Empresa</CardTitle>
                  <CardDescription>Adicione ou atualize o logo da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 w-full aspect-square rounded-md flex items-center justify-center overflow-hidden">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Logo da empresa" 
                        className="max-w-full max-h-full object-contain" 
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <Upload size={48} />
                        <span className="mt-2 text-sm">Sem logo</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center justify-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-md hover:border-audit-primary transition-colors">
                        <Upload className="mr-2 h-4 w-4" />
                        <span>{companyLogo ? 'Alterar logo' : 'Adicionar logo'}</span>
                      </div>
                      <input 
                        id="logo" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload} 
                      />
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Página de Denúncias</CardTitle>
                  <CardDescription>Link e QR Code personalizados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-md border">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-100 p-3 rounded-md">
                        {/* QR Code placeholder - in a real app you would generate this */}
                        <div className="w-32 h-32 bg-gray-800 rounded-md flex items-center justify-center text-white text-xs text-center">
                          QR Code para<br/>página de denúncias
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium mb-1">Link para denúncias:</p>
                      <p className="text-blue-600 break-all">{reportUrl}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {
                    navigator.clipboard.writeText(reportUrl);
                    toast({
                      title: "Link copiado",
                      description: "Link para denúncias copiado para área de transferência."
                    });
                  }}>
                    Copiar link
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Company Information */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Empresa</CardTitle>
                  <CardDescription>Atualize os dados da sua empresa</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input 
                        id="companyName" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input 
                        id="address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Endereço completo"
                      />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyProfile;
