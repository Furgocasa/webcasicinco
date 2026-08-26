/**
 * Cliente de Supabase para el navegador
 * Utiliza el anon key y es seguro para el frontend
 * 
 * NOTA: @supabase/ssr maneja las cookies automáticamente.
 * NO necesitamos configuración manual de cookies.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
