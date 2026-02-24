import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
  trialEndsAt: string;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ trialEndsAt }) => {
  const navigate = useNavigate();
  const now = new Date();
  const endDate = new Date(trialEndsAt);
  const diffMs = endDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const getBannerStyles = () => {
    if (daysLeft <= 1) return 'bg-red-50 border-red-300 text-red-800';
    if (daysLeft <= 3) return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    return 'bg-green-50 border-green-300 text-green-800';
  };

  const getIconColor = () => {
    if (daysLeft <= 1) return 'text-red-500';
    if (daysLeft <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border p-4 ${getBannerStyles()}`}>
      <div className="flex items-center gap-3">
        <Clock className={`h-5 w-5 ${getIconColor()}`} />
        <p className="text-sm font-medium">
          Você está no período de teste.{' '}
          <strong>
            {daysLeft === 0
              ? 'Seu trial expira hoje!'
              : daysLeft === 1
              ? 'Resta 1 dia.'
              : `Restam ${daysLeft} dias.`}
          </strong>
        </p>
      </div>
    </div>
  );
};

export default TrialBanner;
