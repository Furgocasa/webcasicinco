'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
          });
          return;
        }

        const isAdmin = session?.user?.user_metadata?.role === 'admin';
        
        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          isAdmin,
        });
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAdmin: false,
        });
      }
    };

    getInitialSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        const isAdmin = session?.user?.user_metadata?.role === 'admin';
        
        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          isAdmin,
        });

        // Manejar eventos específicos
        if (event === 'SIGNED_OUT') {
          // Solo redirigir si el usuario cerró sesión manualmente
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
          });
          router.push('/login');
        }
        // NO redirigir en SIGNED_IN - dejar al usuario donde está
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // El onAuthStateChange se encargará de limpiar el estado
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      return data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  };

  return {
    ...authState,
    signOut,
    refreshSession,
    supabase,
  };
}
