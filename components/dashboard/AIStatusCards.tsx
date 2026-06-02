'use client';

import { useEffect, useState } from 'react';
import { Brain, CreditCard, BarChart3, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface AIStatus {
  success: boolean;
  credits: {
    usageUsd: number;
    limitUsd: number | null;
    remainingUsd: number | null;
    usagePct: number | null;
    isFreeTier: boolean;
    label: string;
    rateLimit: { requests: number; interval: string };
  };
  models: Array<{
    key: string;
    id: string;
    label: string;
    status: 'online' | 'low_credits' | 'error';
    error?: string;
  }>;
  checkedAt: string;
  error?: string;
}

function formatUsd(val: number | null): string {
  if (val === null) return '—';
  if (val < 0.001) return `$${(val * 1000).toFixed(3)}m`;
  return `$${val.toFixed(4)}`;
}

function StatusDot({ status }: { status: 'online' | 'low_credits' | 'error' | 'loading' }) {
  const map = {
    online:      'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]',
    low_credits: 'bg-amber-400  shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]',
    error:       'bg-red-400    shadow-[0_0_6px_2px_rgba(248,113,113,0.5)]',
    loading:     'bg-muted-foreground/40 animate-pulse',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />;
}

export default function AIStatusCards() {
  const [data, setData] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/status', { cache: 'no-store' });
      const json = await res.json() as AIStatus;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  const credits = data?.credits;
  const models  = data?.models ?? [];

  const creditStatus: 'ok' | 'warning' | 'critical' | 'loading' = loading
    ? 'loading'
    : !credits
    ? 'critical'
    : credits.remainingUsd !== null && credits.remainingUsd < 0.05
    ? 'critical'
    : credits.usagePct !== null && credits.usagePct > 80
    ? 'warning'
    : 'ok';

  const creditColor = {
    ok:       { bar: 'hsl(158 64% 52%)', text: 'text-emerald-400', label: 'OK' },
    warning:  { bar: 'hsl(43 96% 56%)',  text: 'text-amber-400',   label: 'Bajo' },
    critical: { bar: 'hsl(0 84% 60%)',   text: 'text-red-400',     label: 'Crítico' },
    loading:  { bar: 'hsl(239 84% 67%)', text: 'text-primary',     label: '...' },
  }[creditStatus];

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Estado IA · Gemini (Directo + Xiaomi Backup)
        </h2>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : `Hace ${Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Card 1: Model Status ── */}
        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(239 84% 67% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'hsl(239 84% 67% / 0.12)', border: '1px solid hsl(239 84% 67% / 0.25)' }}>
              <Wifi className="w-4 h-4" style={{ color: 'hsl(239 84% 67%)' }} />
            </div>
            <div>
              <CardTitle>Estado de modelos</CardTitle>
              <div className="text-[11px] text-muted-foreground">Disponibilidad en tiempo real</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <>
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-12 h-3 ml-auto" />
                  </div>
                ))}
              </>
            ) : (
              models.map(m => (
                <div key={m.key} className="flex items-center gap-2">
                  <StatusDot status={m.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.id.split('/').pop()}</div>
                  </div>
                  <Badge variant={m.status === 'online' ? 'success' : m.status === 'low_credits' ? 'warning' : 'error'}>
                    {m.status === 'online' ? 'Online' : m.status === 'low_credits' ? 'Sin créditos' : 'Error'}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {!loading && data && (
            <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
              Rate limit: {data.credits?.rateLimit?.requests ?? '—'} req/{data.credits?.rateLimit?.interval ?? '—'}
            </div>
          )}
        </Card>

        {/* ── Card 2: Credits ── */}
        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: `${creditColor.bar}33` }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${creditColor.bar}18`, border: `1px solid ${creditColor.bar}40` }}>
              <CreditCard className="w-4 h-4" style={{ color: creditColor.bar }} />
            </div>
            <div>
              <CardTitle>Créditos restantes</CardTitle>
              <div className="text-[11px] text-muted-foreground">Saldo disponible en Gemini</div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="w-24 h-8" />
              <Skeleton className="w-full h-2" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className={`text-2xl font-bold ${creditColor.text}`}>
                  {formatUsd(credits?.remainingUsd ?? null)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  de {formatUsd(credits?.limitUsd ?? null)} total
                  {credits?.isFreeTier && <span className="ml-1 text-amber-400">(free tier)</span>}
                </div>
              </div>

              {credits?.usagePct !== null && (
                <div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${credits?.usagePct ?? 0}%`, background: creditColor.bar }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span className={creditColor.text}>{creditColor.label}</span>
                    <span>{credits?.usagePct?.toFixed(1)}% usado</span>
                  </div>
                </div>
              )}

              {creditStatus === 'critical' && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Recargá créditos en tu cuenta de Gemini
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Card 3: Usage ── */}
        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(262 80% 65% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'hsl(262 80% 65% / 0.12)', border: '1px solid hsl(262 80% 65% / 0.25)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'hsl(262 80% 65%)' }} />
            </div>
            <div>
              <CardTitle>Consumo acumulado</CardTitle>
              <div className="text-[11px] text-muted-foreground">Gasto total en esta API key</div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-full h-2" />
              <Skeleton className="w-32 h-3" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-violet-400">
                  {formatUsd(credits?.usageUsd ?? null)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">consumido en total</div>
              </div>

              {credits?.usagePct !== null && (
                <div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${credits?.usagePct ?? 0}%`,
                        background: 'linear-gradient(90deg, hsl(239 84% 67%), hsl(262 80% 65%))',
                      }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span className="text-violet-400">{credits?.usagePct?.toFixed(2)}% del límite</span>
                    <span>Lím: {formatUsd(credits?.limitUsd ?? null)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-secondary/60 p-2 text-center">
                  <div className="text-xs font-bold text-foreground">{credits?.rateLimit?.requests ?? '—'}</div>
                  <div className="text-[10px] text-muted-foreground">req/{credits?.rateLimit?.interval ?? '—'}</div>
                </div>
                <div className="rounded-lg bg-secondary/60 p-2 text-center">
                  <div className="text-xs font-bold text-foreground">
                    {credits?.label ? credits.label.slice(0, 8) : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">API Key</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
