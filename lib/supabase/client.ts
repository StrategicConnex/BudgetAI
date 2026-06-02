import { createBrowserClient } from '@supabase/ssr';
import { createLogger } from '@/lib/logger';

const log = createLogger('SupabaseClient');

const DEV_FALLBACK_URL = 'http://localhost:3000';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[Supabase] Variable de entorno faltante: ${name}. Configurala en las Environment Variables de Vercel.`);
    }
    log.warn(`Variable de entorno faltante: ${name}. Usando placeholder para desarrollo.`);
    return `placeholder-${name.toLowerCase()}`;
  }
  return value;
}

import { createMockSupabaseClient } from './mock';

export function createClient() {
  if (process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === 'true') {
    return createMockSupabaseClient() as any;
  }

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  // En desarrollo, si las credenciales son placeholders, usar URL local para evitar
  // que createBrowserClient valide y tire un error (necesita URL http/https vÃ¡lida)
  const safeUrl = supabaseUrl.startsWith('placeholder-')
    ? DEV_FALLBACK_URL
    : supabaseUrl;
  const safeKey = supabaseAnonKey.startsWith('placeholder-')
    ? 'fake-anon-key-for-dev'
    : supabaseAnonKey;

  return createBrowserClient(safeUrl, safeKey);
}
