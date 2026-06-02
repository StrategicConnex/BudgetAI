// ===== Structured Logger Utility =====
// Wraps console + Sentry para logging estructurado en toda la app.
// NOTA: Sentry se importa dinámicamente para evitar bloquear el Edge Runtime
// en middleware.ts (el bundle de @sentry/nextjs es pesado para Edge).

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  module: string;
  [key: string]: unknown;
}

// Cache de módulo Sentry (importación lazy)
let SentryModule: typeof import('@sentry/nextjs') | null = null;

async function getSentry(): Promise<typeof import('@sentry/nextjs') | null> {
  if (SentryModule) return SentryModule;
  if (process.env.NODE_ENV !== 'production') return null;
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
  try {
    SentryModule = await import('@sentry/nextjs');
    return SentryModule;
  } catch {
    return null;
  }
}

class Logger {
  private module: string;
  private enabled: boolean;

  constructor(module: string) {
    this.module = module;
    this.enabled = process.env.NODE_ENV !== 'test' || process.env.LOGGER_ENABLED === 'true';
  }

  private async sendToSentry(level: 'warn' | 'error', message: string, error?: Error, metadata?: LogMetadata): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;
    const sentry = await getSentry();
    if (!sentry) return;

    if (level === 'warn') {
      sentry.captureMessage(message, { level: 'warning', extra: metadata });
    } else if (error) {
      sentry.captureException(error, { extra: { ...metadata, message } });
    } else {
      sentry.captureMessage(message, { level: 'error', extra: metadata });
    }
  }

  private send(level: LogLevel, message: string, error?: Error, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const metadata: LogMetadata = { module: this.module };
    if (data) Object.assign(metadata, data);

    const prefix = `[${this.module}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, data || '');
        break;

      case 'info':
        console.log(prefix, message, data || '');
        break;

      case 'warn':
        console.warn(prefix, message, data || '');
        this.sendToSentry('warn', message, undefined, metadata).catch(() => {});
        break;

      case 'error':
        console.error(prefix, message, error || '', data || '');
        this.sendToSentry('error', message, error, metadata).catch(() => {});
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.send('debug', message, undefined, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.send('info', message, undefined, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.send('warn', message, undefined, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.send('error', message, error, data);
  }
}

/** Crear un logger para un módulo específico */
export function createLogger(module: string): Logger {
  return new Logger(module);
}
