// =============================================================================
// API Middleware — Auth + Rate Limit wrappers
// =============================================================================
// Elimina la duplicación de auth y rate-limit checks en todas las API routes.
//
// Uso:
//   export const POST = withAuth(async (req, { user }) => { ... }, { rateLimit: 'export' });
//   export const GET = withRateLimit(async (req) => { ... }, { limit: 'status', identifier: 'ip' });
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMIT_CONFIGS, type RateLimitEndpoint } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

interface User {
  id: string;
  email?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

interface AuthContext {
  user: User;
  rateLimit: RateLimitResult;
}

type ApiHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

type RateOnlyHandler = (
  request: NextRequest,
  context: { rateLimit: RateLimitResult }
) => Promise<NextResponse>;

interface AuthOptions {
  rateLimit?: RateLimitEndpoint;
}

interface RateLimitOptions {
  limit?: RateLimitEndpoint;
  identifier?: 'user' | 'ip';
}

const RATE_LIMIT_MESSAGES: Record<string, string> = {
  generate: 'Demasiadas solicitudes. Esperá antes de generar otro presupuesto.',
  export: 'Demasiadas exportaciones. Esperá un momento.',
  ocr: 'Demasiadas solicitudes de análisis. Esperá un momento.',
  status: 'Demasiadas consultas de estado. Esperá un momento.',
};

function rateLimitResponse(rateLimit: RateLimitResult, message: string): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryAfter: Math.ceil(rateLimit.resetIn / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

/**
 * Wrapper para rutas que requieren autenticación + rate limiting opcional.
 *
 * Reemplaza el patrón:
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) return 401;
 *   const rateLimit = checkRateLimit(`key:${user.id}`, config);
 *   if (!rateLimit.allowed) return 429;
 */
export function withAuth(
  handler: ApiHandler,
  options?: AuthOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }

      if (options?.rateLimit) {
        const config = RATE_LIMIT_CONFIGS[options.rateLimit];
        const rateLimit = await checkRateLimit(`${options.rateLimit}:${user.id}`, config);
        if (!rateLimit.allowed) {
          return rateLimitResponse(
            rateLimit,
            RATE_LIMIT_MESSAGES[options.rateLimit] || 'Demasiadas solicitudes. Esperá un momento.'
          );
        }
        return handler(request, { user: { id: user.id, email: user.email }, rateLimit });
      }

      return handler(request, {
        user: { id: user.id, email: user.email },
        rateLimit: { allowed: true, remaining: Infinity, resetIn: 0 },
      });
    } catch (error) {
      createLogger('API-middleware').error('Error en middleware auth', error instanceof Error ? error : undefined);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}

/**
 * Wrapper para rutas que solo requieren rate limiting (sin auth).
 * Reemplaza el patrón de rate-limit por IP en rutas como /api/ai/status.
 */
export function withRateLimit(
  handler: RateOnlyHandler,
  options?: RateLimitOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      if (options?.limit) {
        const config = RATE_LIMIT_CONFIGS[options.limit];

        let identifier: string;
        if (options.identifier === 'ip') {
          identifier =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';
        } else {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          identifier = user?.id || 'anonymous';
        }

        const rateLimit = await checkRateLimit(`${options.limit}:${identifier}`, config);
        if (!rateLimit.allowed) {
          return rateLimitResponse(
            rateLimit,
            RATE_LIMIT_MESSAGES[options.limit] || 'Demasiadas solicitudes. Esperá un momento.'
          );
        }
        return handler(request, { rateLimit });
      }

      return handler(request, {
        rateLimit: { allowed: true, remaining: Infinity, resetIn: 0 },
      });
    } catch (error) {
      createLogger('API-middleware').error('Error en middleware rate-limit', error instanceof Error ? error : undefined);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  };
}
