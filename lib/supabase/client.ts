/**
 * Cliente de Supabase para el navegador
 * Utiliza el anon key y es seguro para el frontend
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 🔥 FIX: Leer cookies del navegador correctamente
          if (typeof document === 'undefined') return undefined;
          
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`));
          
          return cookie ? cookie.split('=')[1] : undefined;
        },
        set(name: string, value: string, options: any) {
          // 🔥 FIX: Guardar cookies en el navegador correctamente
          if (typeof document === 'undefined') return;
          
          let cookie = `${name}=${value}`;
          
          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }
          if (options?.path) {
            cookie += `; path=${options.path}`;
          } else {
            cookie += '; path=/';
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookie += '; secure';
          }
          
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          // 🔥 FIX: Eliminar cookies correctamente
          if (typeof document === 'undefined') return;
          
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`;
        },
      },
    }
  );
}
