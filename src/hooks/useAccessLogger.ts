import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LogPayload {
  event_type: 'login' | 'logout' | 'page_view' | 'error' | 'api_error';
  page_path?: string;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  error_message?: string | null;
  error_stack?: string | null;
  metadata?: Record<string, unknown> | null;
}

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

/**
 * Fire-and-forget log sender. Silently fails to never impact UX.
 */
export const sendAccessLog = async (payload: LogPayload): Promise<void> => {
  try {
    const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/log-access`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // No await on error handling — truly fire-and-forget
    });
  } catch {
    // Silently ignore — log system must never break the app
  }
};

/**
 * Global hook that logs page_view events on every route change.
 * Must be used inside <BrowserRouter> and auth context.
 */
export const useAccessLogger = (
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  userRole: string | null | undefined
) => {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;

    // Avoid duplicate log on initial mount if same path
    if (prevPathRef.current === path) return;
    prevPathRef.current = path;

    sendAccessLog({
      event_type: 'page_view',
      page_path: path,
      user_id: userId ?? null,
      user_email: userEmail ?? null,
      user_role: userRole ?? null,
      metadata: {
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      },
    });
  }, [location.pathname, location.search, userId, userEmail, userRole]);
};
