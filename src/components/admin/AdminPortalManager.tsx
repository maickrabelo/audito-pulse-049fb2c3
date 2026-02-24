import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PortalMessagesTab } from './portal/PortalMessagesTab';
import { PortalDocumentsTab } from './portal/PortalDocumentsTab';
import { PortalTrainingsTab } from './portal/PortalTrainingsTab';
import { PortalContractsTab } from './portal/PortalContractsTab';

export const AdminPortalManager: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="messages">
          <TabsList className="mb-4">
            <TabsTrigger value="messages">Recados</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
          </TabsList>
          <TabsContent value="messages"><PortalMessagesTab /></TabsContent>
          <TabsContent value="documents"><PortalDocumentsTab /></TabsContent>
          <TabsContent value="trainings"><PortalTrainingsTab /></TabsContent>
          <TabsContent value="contracts"><PortalContractsTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
