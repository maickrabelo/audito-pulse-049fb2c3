import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Building2 } from "lucide-react";

interface SSTCompanyCounterProps {
  currentCount: number;
  maxCompanies: number;
}

const SSTCompanyCounter: React.FC<SSTCompanyCounterProps> = ({ currentCount, maxCompanies }) => {
  const percentage = maxCompanies > 0 ? (currentCount / maxCompanies) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentCount >= maxCompanies;

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="h-5 w-5 text-green-700" />
        <span className="font-semibold text-lg">
          {currentCount} / {maxCompanies} empresas cadastradas
        </span>
        {isAtLimit && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            Limite atingido
          </span>
        )}
        {isNearLimit && !isAtLimit && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            Próximo do limite
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-600'}`}
      />
    </div>
  );
};

export default SSTCompanyCounter;
