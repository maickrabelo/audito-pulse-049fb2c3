import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useRealAuth } from '@/contexts/RealAuthContext';

const PendingApproval = () => {
  const { signOut } = useRealAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Conta Pendente de Aprovação</CardTitle>
          <CardDescription className="text-center">
            Sua conta está aguardando aprovação do Administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Você receberá acesso ao sistema assim que um administrador aprovar sua conta. 
            Isso geralmente leva até 24 horas úteis.
          </p>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
