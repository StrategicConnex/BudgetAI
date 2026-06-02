// V-01: Validate environment variables at startup.
import { createLogger } from '@/lib/logger';

const log = createLogger('EnvValidate');

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
];

const OPTIONAL_VARS = [
  'XIAOMI_API_KEY',
  'SENTRY_DSN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

export function logEnvStatus(): void {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  const present = REQUIRED_VARS.filter(v => process.env[v]);
  const optional = OPTIONAL_VARS.filter(v => process.env[v]);

  if (missing.length > 0) {
    log.warn(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  log.info(`Env OK: ${present.length}/${REQUIRED_VARS.length} requeridas, ${optional.length} opcionales configuradas`);
}
