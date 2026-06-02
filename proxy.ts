import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('Middleware');

// ===== Security Headers =====
// V-08: Implementar headers de seguridad HTTP
const SECURITY_HEADERS = {
  // Prevenir XSS en navegadores antiguos
  'X-XSS-Protection': '1; mode=block',
  // Prevenir MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevenir clickjacking
  'X-Frame-Options': 'DENY',
  // Forzar HTTPS
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Restringir orígenes de recursos
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.xiaomimimo.com https://generativelanguage.googleapis.com wss://*.supabase.co;",
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Prevenir acceso a APIs del navegador
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Agregar security headers a todas las respuestas
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  // Permitir que el middleware funcione incluso sin Supabase configurado
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/dashboard') && !DEMO_MODE) {
      // Proteger rutas /dashboard incluso sin Supabase (a menos que DEMO_MODE esté activo)
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (DEMO_MODE) {
      log.warn('⚠️ Modo demo activo: la autenticación está desactivada.');
    }
    return NextResponse.next({ request });
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // V-04: CSRF protection - validar Origin/Referer en mutaciones vía API
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE' || request.method === 'PATCH') {
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');

      // Helper function for CSRF error response with security headers
      function csrfError(message: string): NextResponse {
        const res = NextResponse.json({ error: message }, { status: 403 });
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          res.headers.set(key, value);
        });
        return res;
      }

      // En producción, rechazar requests sin origin
      if (process.env.NODE_ENV === 'production') {
        if (!origin && !referer) {
          return csrfError('CSRF: Missing Origin header');
        }

        // Verificar que el origin sea el nuestro
        if (origin) {
          const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL,
            'http://localhost:3000',
            'http://localhost:3001',
          ].filter(Boolean);

          const isValid = allowedOrigins.some(allowed => {
            if (!allowed) return false;
            if (allowed.includes('supabase.co')) {
              return origin.endsWith('.supabase.co') || origin === allowed;
            }
            return origin === allowed;
          });

          if (!isValid) {
            return csrfError('CSRF: Origin no permitido');
          }
        }
      }
    }
  }

  // Allow /share/* routes without auth (public read-only budget view)
  if (pathname.startsWith('/share/')) {
    return supabaseResponse;
  }

  // Redirect to login if not authenticated and accessing protected routes
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if already authenticated
  if (user && (pathname === '/login' || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
