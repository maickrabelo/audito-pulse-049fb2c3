
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReportWizard from '@/components/ReportWizard';
import TrackReportModal from '@/components/TrackReportModal';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, PenLine } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const CompanyReport = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<{ id: string; name: string; logo_url: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [choiceOpen, setChoiceOpen] = useState(true);
  const [trackOpen, setTrackOpen] = useState(false);
  
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
              <h1 className="text-3xl font-bold text-audit-primary">Canal de Escuta — {company.name}</h1>
              <p className="text-gray-600 mt-2">
                Aqui você pode registrar sua manifestação de forma anônima e segura.
              </p>
              <div className="mt-4">
                <TrackReportModal open={trackOpen} onOpenChange={setTrackOpen} />
              </div>
            </div>
          </div>
          
          <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Canal de Escuta — {company.name}</DialogTitle>
                <DialogDescription>O que você deseja fazer?</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Button size="lg" variant="outline" className="justify-start h-auto py-4" onClick={() => { setChoiceOpen(false); setTrackOpen(true); }}>
                  <Search className="h-5 w-5 mr-3" /> Quero acompanhar minha manifestação
                </Button>
                <Button size="lg" className="justify-start h-auto py-4" onClick={() => setChoiceOpen(false)}>
                  <PenLine className="h-5 w-5 mr-3" /> Fazer nova manifestação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <ReportWizard companyId={company.id} companyName={company.name} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyReport;
