import { createBrowserClient } from '@supabase/ssr';
import { createLogger } from '@/lib/logger';

const log = createLogger('SupabaseClient');

const DEV_FALLBACK_URL = 'http://localhost:3000';

import { createMockSupabaseClient } from './mock';

export function createClient() {
  if (process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === 'true') {
    return createMockSupabaseClient() as any;
  }

  // Next.js replaces NEXT_PUBLIC_ variables at build time, so we must access them directly
  // and NOT dynamically via process.env[name].
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Supabase] Variables de entorno faltantes. Configuralas en las Environment Variables de Vercel.');
    }
    log.warn('Variables de entorno faltantes. Usando placeholder para desarrollo.');
    return createBrowserClient(DEV_FALLBACK_URL, 'fake-anon-key-for-dev');
  }

  // En desarrollo, si las credenciales son placeholders, usar URL local
  const safeUrl = supabaseUrl.startsWith('placeholder-')
    ? DEV_FALLBACK_URL
    : supabaseUrl;
  const safeKey = supabaseAnonKey.startsWith('placeholder-')
    ? 'fake-anon-key-for-dev'
    : supabaseAnonKey;

  return createBrowserClient(safeUrl, safeKey);
}
