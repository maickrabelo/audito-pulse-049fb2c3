import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendAccessLog } from '@/hooks/useAccessLogger';

type UserRole = 'admin' | 'company' | 'sst' | 'pending' | 'partner' | 'affiliate' | null;

interface Profile {
  id: string;
  full_name: string | null;
  company_id: string | null;
  sst_manager_id: string | null;
  must_change_password: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const RealAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Track whether the initial session has been loaded.
  // SIGNED_IN events that fire BEFORE init completes (or right after)
  // are NOT explicit user logins — they are Supabase replaying the session.
  const hasInitializedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const checkTrialStatus = async (companyId: string | null, sstManagerId: string | null) => {
    const [companyResult, sstResult] = await Promise.all([
      companyId
        ? supabase.from('companies').select('subscription_status, trial_ends_at').eq('id', companyId).single()
        : Promise.resolve({ data: null }),
      sstManagerId
        ? supabase.from('sst_managers').select('subscription_status, trial_ends_at').eq('id', sstManagerId).single()
        : Promise.resolve({ data: null }),
    ]);

    const company = companyResult?.data;
    if (company?.subscription_status === 'trial' && company?.trial_ends_at) {
      setTrialEndsAt(company.trial_ends_at);
      setIsTrialExpired(new Date() > new Date(company.trial_ends_at));
      return;
    }

    const sstManager = sstResult?.data;
    if (sstManager?.subscription_status === 'trial' && sstManager?.trial_ends_at) {
      setTrialEndsAt(sstManager.trial_ends_at);
      setIsTrialExpired(new Date() > new Date(sstManager.trial_ends_at));
      return;
    }

    setIsTrialExpired(false);
    setTrialEndsAt(null);
  };

  const refreshRole = async () => {
    if (user) {
      const [userRole, userProfile] = await Promise.all([
        fetchUserRole(user.id),
        fetchProfile(user.id),
      ]);
      setRole(userRole);
      setProfile(userProfile);
      await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
    }
  };

  const navigateByRole = (userRole: UserRole, userProfile: Profile | null) => {
    if (userProfile?.must_change_password) {
      navigate('/change-password');
    } else if (userRole === 'pending') {
      navigate('/pending-approval');
    } else if (userRole === 'admin') {
      navigate('/master-dashboard');
    } else if (userRole === 'company') {
      navigate('/dashboard');
    } else if (userRole === 'sst') {
      navigate('/sst-dashboard');
    } else if (userRole === 'partner') {
      navigate('/parceiro/dashboard');
    } else if (userRole === 'affiliate') {
      navigate('/afiliado/dashboard');
    }
  };

  // Pages where an EXPLICIT login redirect should happen
  const isLoginPage = (path: string) => {
    return path === '/auth';
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Update session/user only if actually changed to avoid unnecessary re-renders
        setSession(prev => {
          if (prev?.access_token === session?.access_token) return prev;
          return session;
        });
        setUser(prev => {
          if (prev?.id === session?.user?.id) return prev;
          return session?.user ?? null;
        });

        if (event === 'SIGNED_OUT') {
          // Log logout (fire-and-forget, use previous user data still in state)
          sendAccessLog({
            event_type: 'logout',
            page_path: window.location.pathname,
            user_id: session?.user?.id ?? null,
            user_email: session?.user?.email ?? null,
          });
          setRole(null);
          setProfile(null);
          setIsTrialExpired(false);
          setTrialEndsAt(null);
          hasRedirectedRef.current = false;
          return;
        }

        // Only redirect on EXPLICIT sign-in (user clicked login).
        // We know it's explicit if:
        //   1. The event is SIGNED_IN
        //   2. Init has already completed (so this isn't the session-replay event)
        //   3. User is on the /auth page
        //   4. We haven't already redirected for this session
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const [userRole, userProfile] = await Promise.all([
              fetchUserRole(session.user.id),
              fetchProfile(session.user.id),
            ]);
            if (!isMounted) return;
            setRole(userRole);
            setProfile(userProfile);
            await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);

            // Log login event
            sendAccessLog({
              event_type: 'login',
              page_path: window.location.pathname,
              user_id: session.user.id,
              user_email: session.user.email ?? null,
              user_role: userRole ?? null,
            });

            // Only redirect if user is on the login page (explicit login action)
            const currentPath = window.location.pathname;
            if (hasInitializedRef.current && !hasRedirectedRef.current && isLoginPage(currentPath)) {
              hasRedirectedRef.current = true;
              navigateByRole(userRole, userProfile);
            }
          }, 0);
        }

        // Silently refresh data on token refresh (no navigation, no re-render churn)
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const [userRole, userProfile] = await Promise.all([
              fetchUserRole(session.user.id),
              fetchProfile(session.user.id),
            ]);
            if (!isMounted) return;
            setRole(userRole);
            setProfile(userProfile);
            await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
          }, 0);
        }
      }
    );

    // INITIAL load — the only place that controls isLoading
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [userRole, userProfile] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchProfile(session.user.id),
          ]);
          if (!isMounted) return;
          setRole(userRole);
          setProfile(userProfile);
          await checkTrialStatus(userProfile?.company_id ?? null, userProfile?.sst_manager_id ?? null);
        }
      } finally {
        if (isMounted) {
          hasInitializedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setIsTrialExpired(false);
      setTrialEndsAt(null);
      hasRedirectedRef.current = false;
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isLoading, isTrialExpired, trialEndsAt, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useRealAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useRealAuth must be used within a RealAuthProvider');
  }
  return context;
};
