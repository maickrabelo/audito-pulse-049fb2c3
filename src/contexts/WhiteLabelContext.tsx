import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

interface WhiteLabelBrand {
  brandLogo: string | null;
  brandName: string | null;
  sstSlug: string | null;
  isWhiteLabel: boolean;
  isLoading: boolean;
}

const WhiteLabelContext = createContext<WhiteLabelBrand>({
  brandLogo: null,
  brandName: null,
  sstSlug: null,
  isWhiteLabel: false,
  isLoading: true,
});

export const WhiteLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [sstSlug, setSstSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { user, role, profile } = useRealAuth();

  useEffect(() => {
    const detectBranding = async () => {
      setIsLoading(true);

      try {
        // 1. Check URL path: /sst/:slug
        const sstPathMatch = location.pathname.match(/^\/sst\/([^/]+)/);
        if (sstPathMatch) {
          const slug = sstPathMatch[1];
          const { data: sstManager } = await supabase
            .from('sst_managers')
            .select('logo_url, name, slug')
            .eq('slug', slug)
            .maybeSingle();

          if (sstManager) {
            setBrandLogo(sstManager.logo_url);
            setBrandName(sstManager.name);
            setSstSlug(sstManager.slug);
            setIsLoading(false);
            return;
          }
        }

        // 2. Check logged-in user
        if (user && profile) {
          // SST user -> get their own SST manager
          if (role === 'sst' && profile.sst_manager_id) {
            const { data: sstManager } = await supabase
              .from('sst_managers')
              .select('logo_url, name, slug')
              .eq('id', profile.sst_manager_id)
              .maybeSingle();

            if (sstManager?.logo_url) {
              setBrandLogo(sstManager.logo_url);
              setBrandName(sstManager.name);
              setSstSlug(sstManager.slug);
              setIsLoading(false);
              return;
            }
          }

          // Company user -> check if company has an SST assignment
          if (role === 'company' && profile.company_id) {
            const { data: assignment } = await supabase
              .from('company_sst_assignments')
              .select('sst_manager_id')
              .eq('company_id', profile.company_id)
              .maybeSingle();

            if (assignment?.sst_manager_id) {
              const { data: sstManager } = await supabase
                .from('sst_managers')
                .select('logo_url, name, slug')
                .eq('id', assignment.sst_manager_id)
                .maybeSingle();

              if (sstManager?.logo_url) {
                setBrandLogo(sstManager.logo_url);
                setBrandName(sstManager.name);
                setSstSlug(sstManager.slug);
                setIsLoading(false);
                return;
              }
            }
          }
        }

        // No branding detected
        setBrandLogo(null);
        setBrandName(null);
        setSstSlug(null);
      } catch (error) {
        console.error('Error detecting white-label branding:', error);
        setBrandLogo(null);
        setBrandName(null);
        setSstSlug(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectBranding();
  }, [location.pathname, user, role, profile]);

  return (
    <WhiteLabelContext.Provider value={{ brandLogo, brandName, sstSlug, isWhiteLabel: !!brandLogo, isLoading }}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => useContext(WhiteLabelContext);
