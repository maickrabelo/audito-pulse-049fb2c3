
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const AnonymousReportButton = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <Button 
        onClick={() => navigate('/report')}
        className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-medium py-2 px-6 rounded-md"
      >
        Fazer Denúncia Anônima
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua identidade será completamente protegida
      </p>
    </div>
  );
};

export default AnonymousReportButton;
