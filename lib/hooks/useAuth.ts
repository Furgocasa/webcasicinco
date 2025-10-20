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
        // 🔥 FIX: Usar getUser() en lugar de getSession() para forzar verificación
        // getUser() hace una llamada al servidor y verifica que el token sea válido
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
          });
          return;
        }

        // Si hay usuario, obtener la sesión completa
        const { data: { session } } = await supabase.auth.getSession();
        const isAdmin = user?.user_metadata?.role === 'admin';
        
        console.log('✅ useAuth: Usuario detectado:', user?.email, isAdmin ? '(Admin)' : '(User)');
        
        setAuthState({
          user: user || null,
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
          // La función signOut() ya maneja la limpieza y redirección
          console.log('🔓 Evento SIGNED_OUT recibido');
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
      console.log('🚪 Cerrando sesión...');
      
      // 1. Limpiar estado inmediatamente (antes de llamar a signOut)
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAdmin: false,
      });
      
      // 2. Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Sesión cerrada correctamente');
      
      // 3. Limpiar localStorage por si acaso
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('geolocationActive');
      }
      
      // 4. Forzar refresh completo del router
      router.refresh();
      
      // 5. Redirigir al home
      router.push('/');
      
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      
      // Aun si falla, limpiar estado y redirigir
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAdmin: false,
      });
      
      router.push('/');
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
