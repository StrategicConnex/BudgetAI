// ===== Rate Limiter — Upstash Redis + Fallback in-memory =====
// En producción (Vercel): usa @upstash/ratelimit con Redis (Vercel KV)
// En desarrollo local: fallback automático a Map en memoria

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// =========================================================================
// In-Memory fallback (local dev, sin Vercel KV)
// =========================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memStores = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 60s)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStores) {
      if (now > entry.resetAt) {
        memStores.delete(key);
      }
    }
  }, 60_000);
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// =========================================================================
// Upstash Redis client — lazy init
// =========================================================================

const hasUpstashEnv =
  typeof process !== 'undefined' &&
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

function createRedisClient(): Redis | null {
  if (!hasUpstashEnv) return null;
  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch {
    return null;
  }
}

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// =========================================================================
// Ratelimit instances — lazy init, one per endpoint config
// =========================================================================

const upstashRatelimiters = new Map<string, Ratelimit | null>();

function getUpstashRatelimiter(configKey: string): Ratelimit | null {
  const existing = upstashRatelimiters.get(configKey);
  if (existing !== undefined) return existing;

  const redis = getRedis();
  if (!redis) {
    upstashRatelimiters.set(configKey, null);
    return null;
  }

  const config = RATE_LIMIT_CONFIGS[configKey as RateLimitEndpoint] || RATE_LIMIT_CONFIGS.default;
  const windowSec = Math.max(1, Math.floor(config.windowMs / 1000));

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSec} s`),
    prefix: `budgetai:${configKey}`,
  });

  upstashRatelimiters.set(configKey, ratelimit);
  return ratelimit;
}

// =========================================================================
// Public API — misma firma que el rate-limiter anterior
// =========================================================================

function memCheckRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = memStores.get(identifier);

  if (!entry || now > entry.resetAt) {
    memStores.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const resetIn = entry.resetAt - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

/**
 * Check rate limit for an identifier.
 *
 * - En producción (Vercel): usa Upstash Redis via @upstash/ratelimit
 * - En desarrollo: fallback a Map en memoria
 *
 * La firma es idéntica al rate-limiter anterior, así que el middleware
 * y las API routes no requieren cambios.
 */
export async function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const resolvedConfig = config || RATE_LIMIT_CONFIGS.default;

  // Intentar con Upstash Redis primero
  if (hasUpstashEnv) {
    // Inferir el configKey desde el identifier que tiene formato `${endpoint}:${id}`
    // (ej: `generate:user123`). Si no tiene el formato esperado, usa default.
    const endpointKey = identifier.includes(':')
      ? (identifier.split(':')[0] as RateLimitEndpoint)
      : 'default';
    const ratelimiter = getUpstashRatelimiter(endpointKey);

    if (ratelimiter) {
      try {
        const { success, remaining, reset } = await ratelimiter.limit(identifier);
        return {
          allowed: success,
          remaining: Math.max(0, remaining),
          resetIn: reset,
        };
      } catch {
        // Si Redis falla, hacemos fallback a memoria
      }
    }
  }

  // Fallback: in-memory
  return memCheckRateLimit(identifier, resolvedConfig);
}

/**
 * Resetear todos los stores (útil en tests).
 * Resetea tanto el store en memoria como (si está disponible) Redis via Upstash.
 */
export async function resetRateLimitStore(): Promise<void> {
  memStores.clear();

  const redis = getRedis();
  if (redis) {
    try {
      // Limpiar todas las keys con prefijo budgetai:
      const keys = await redis.keys('budgetai:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Ignorar errores de Redis en reset
    }
  }
}

export const RATE_LIMIT_CONFIGS = {
  generate: { windowMs: 60_000, maxRequests: 10 },
  export:   { windowMs: 60_000, maxRequests: 20 },
  ocr:      { windowMs: 60_000, maxRequests: 15 },
  status:   { windowMs: 30_000, maxRequests: 10 },
  default:  { windowMs: 60_000, maxRequests: 60 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitEndpoint = keyof typeof RATE_LIMIT_CONFIGS;
