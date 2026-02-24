import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

const ONBOARDING_STORAGE_KEY = 'soia_onboarding_completed';

function getLocalCompleted(): string[] {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalCompleted(pages: string[]) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(pages));
  } catch {}
}

export function useOnboarding(pageId: string) {
  const { role, profile, isLoading: authLoading } = useRealAuth();
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading || !profile?.sst_manager_id || role !== 'sst') {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    // Quick check: if already completed locally, skip DB call
    const localCompleted = getLocalCompleted();
    if (localCompleted.includes(pageId)) {
      setShouldShowTour(false);
      setIsReady(true);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from('sst_managers')
          .select('onboarding_completed_pages, subscription_status')
          .eq('id', profile.sst_manager_id!)
          .single();

        if (error) throw error;

        // Only show for trial accounts
        if (data?.subscription_status !== 'trial') {
          setShouldShowTour(false);
          setIsReady(true);
          return;
        }

        const completedPages = (data?.onboarding_completed_pages as string[]) || [];
        
        // Sync DB state to localStorage
        if (completedPages.length > 0) {
          const merged = [...new Set([...localCompleted, ...completedPages])];
          setLocalCompleted(merged);
        }

        const alreadyCompleted = completedPages.includes(pageId);
        setShouldShowTour(!alreadyCompleted);
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setShouldShowTour(false);
      } finally {
        setIsReady(true);
      }
    };

    checkOnboarding();
  }, [authLoading, profile?.sst_manager_id, role, pageId]);

  const completeTour = useCallback(async () => {
    if (!profile?.sst_manager_id) return;

    // Immediately hide the tour and save to localStorage
    setShouldShowTour(false);
    const localCompleted = getLocalCompleted();
    if (!localCompleted.includes(pageId)) {
      setLocalCompleted([...localCompleted, pageId]);
    }

    try {
      // Persist to DB
      const { data } = await supabase
        .from('sst_managers')
        .select('onboarding_completed_pages')
        .eq('id', profile.sst_manager_id)
        .single();

      const completedPages = (data?.onboarding_completed_pages as string[]) || [];
      
      if (!completedPages.includes(pageId)) {
        const updated = [...completedPages, pageId];
        await supabase
          .from('sst_managers')
          .update({ onboarding_completed_pages: updated })
          .eq('id', profile.sst_manager_id);
      }
    } catch (err) {
      console.error('Error completing tour:', err);
    }
  }, [profile?.sst_manager_id, pageId]);

  const resetTour = useCallback(async () => {
    if (!profile?.sst_manager_id) return;

    // Clear localStorage
    setLocalCompleted([]);
    setShouldShowTour(true);

    try {
      // Clear DB
      await supabase
        .from('sst_managers')
        .update({ onboarding_completed_pages: [] })
        .eq('id', profile.sst_manager_id);
    } catch (err) {
      console.error('Error resetting tour:', err);
    }
  }, [profile?.sst_manager_id]);

  return { shouldShowTour, completeTour, resetTour, isReady };
}
