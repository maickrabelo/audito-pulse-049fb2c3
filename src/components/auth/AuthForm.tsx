
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const AuthForm = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulação de autenticação (será substituída por sistema real)
    if (formData.email && formData.password) {
      toast({
        title: "Login bem-sucedido",
        description: "Redirecionando para o dashboard...",
      });
      
      // Redirecionamento simulado
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Por favor, preencha todos os campos.",
      });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
      });
      return;
    }
    
    // Simulação de cadastro bem-sucedido
    toast({
      title: "Cadastro enviado",
      description: "Sua solicitação de cadastro foi enviada para aprovação.",
    });
    
    // Limpar formulário
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    
    // Voltar para a aba de login
    setActiveTab("login");
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Cadastro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle className="text-audit-primary">Login</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar denúncias e relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a 
                    href="#" 
                    className="text-sm text-audit-secondary hover:underline"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-audit-primary hover:bg-audit-primary/90">
                Entrar
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle className="text-audit-primary">Cadastro</CardTitle>
              <CardDescription>
                Crie uma conta para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input 
                  id="name" 
                  name="name"
                  type="text" 
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email" 
                  name="email"
                  type="email" 
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input 
                  id="register-password" 
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input 
                  id="confirm-password" 
                  name="confirmPassword"
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-audit-secondary hover:bg-audit-secondary/90">
                Cadastrar
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
