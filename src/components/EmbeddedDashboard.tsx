
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

interface EmbeddedDashboardProps {
  companyId: string;
}

const EmbeddedDashboard = ({ companyId }: EmbeddedDashboardProps) => {
  // Create a wrapper that provides the companyId as a URL param context
  return (
    <div className="w-full">
      <DashboardWrapper companyId={companyId} />
    </div>
  );
};

// Internal wrapper component that simulates URL params
const DashboardWrapper = ({ companyId }: { companyId: string }) => {
  // We'll pass this to a modified Dashboard that accepts a direct companyId prop
  return <Dashboard embeddedCompanyId={companyId} hideNavigation={true} />;
};

export default EmbeddedDashboard;
