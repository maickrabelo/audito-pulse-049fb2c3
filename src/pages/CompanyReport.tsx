
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ReportChat } from '@/components/ReportChatContent';
import TrackReportModal from '@/components/TrackReportModal';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CompanyReport = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companySlug) {
        setIsLoading(false);
        return;
      }

      try {
        // Use public view to avoid exposing sensitive company data (LGPD compliant)
        const { data, error } = await supabase
          .from('companies_public' as any)
          .select('id, name, logo_url, slug')
          .eq('slug', companySlug)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company:', error);
          setCompany(null);
        } else if (data) {
          const companyData = data as unknown as { id: string; name: string; logo_url: string | null; slug: string };
          console.log('Company fetched successfully:', companyData);
          console.log('Company ID that will be passed to ReportChat:', companyData.id);
          setCompany(companyData);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companySlug]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-audit-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-audit-primary mb-2">Empresa não encontrada</h1>
            <p>O link que você acessou não corresponde a nenhuma empresa registrada.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="audit-container max-w-4xl">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center">
              {company.logo_url && (
                <img 
                  src={company.logo_url} 
                  alt={`Logo ${company.name}`} 
                  className="h-16 object-contain mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-audit-primary">Ouvidoria {company.name}</h1>
              <p className="text-gray-600 mt-2">
                Aqui você pode registrar sua denúncia de forma anônima e segura.
              </p>
              <div className="mt-4">
                <TrackReportModal />
              </div>
            </div>
          </div>
          
          {/* Reuse the ReportChat component */}
          <ReportChat companyId={company.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyReport;
