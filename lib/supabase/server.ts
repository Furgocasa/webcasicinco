/**
 * Cliente de Supabase para el servidor
 * Utiliza cookies para mantener la sesión
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // 🔥 NO sobreescribir opciones de Supabase - usar las que vienen
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignorar errores en set durante el renderizado
            console.warn('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              maxAge: 0, // Expirar inmediatamente
            });
          } catch (error) {
            // Ignorar errores en remove durante el renderizado
            console.warn('Error removing cookie:', error);
          }
        },
      },
    }
  );
}

/**
 * Cliente de Supabase con service role key
 * SOLO para uso en el servidor con operaciones privilegiadas
 * Usa createClient directo (no SSR) porque no necesita cookies
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
