import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createLogger } from '@/lib/logger';

const log = createLogger('SupabaseServer');

function getStaticEnv(name: string, staticValue: string | undefined): string {
  const value = staticValue || process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[Supabase] Variable de entorno faltante: ${name}. Configurala en las Environment Variables de Vercel.`);
    }
    log.warn(`Variable de entorno faltante: ${name}. Usando placeholder para desarrollo.`);
    return `placeholder-${name.toLowerCase()}`;
  }
  return value;
}

export async function createClient() {
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    const { createMockSupabaseClient } = await import('./mock');
    return createMockSupabaseClient() as any;
  }

  const cookieStore = await cookies();

  const supabaseUrl = getStaticEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = getStaticEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    const { createMockSupabaseClient } = await import('./mock');
    return createMockSupabaseClient() as any;
  }

  const cookieStore = await cookies();

  const supabaseUrl = getStaticEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('[Supabase] SUPABASE_SERVICE_ROLE_KEY no configurada. El service client requiere esta variable.');
  }

  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
