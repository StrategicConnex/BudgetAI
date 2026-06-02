'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * S6: AI cost monitoring component.
 * Tracks cumulative API usage and warns when approaching limits.
 */
interface CostData {
  totalRequests: number;
  estimatedCostUsd: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'budgetai-ai-costs';
const DAILY_LIMIT_USD = 1.00; // Free tier daily limit estimate

function getCostData(): CostData {
  if (typeof window === 'undefined') return { totalRequests: 0, estimatedCostUsd: 0, lastUpdated: '' };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { totalRequests: 0, estimatedCostUsd: 0, lastUpdated: '' };
    const data = JSON.parse(stored) as CostData;
    // Reset daily
    const today = new Date().toDateString();
    if (data.lastUpdated !== today) {
      return { totalRequests: 0, estimatedCostUsd: 0, lastUpdated: today };
    }
    return data;
  } catch {
    return { totalRequests: 0, estimatedCostUsd: 0, lastUpdated: '' };
  }
}

export function trackAICall(): void {
  if (typeof window === 'undefined') return;
  const data = getCostData();
  data.totalRequests += 1;
  data.estimatedCostUsd += 0.002; // ~$0.002 per Gemini Flash call
  data.lastUpdated = new Date().toDateString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function AICostMonitor() {
  const [data, setData] = useState<CostData>({ totalRequests: 0, estimatedCostUsd: 0, lastUpdated: '' });

  useEffect(() => {
    setData(getCostData());
    const interval = setInterval(() => setData(getCostData()), 5000);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.min(100, (data.estimatedCostUsd / DAILY_LIMIT_USD) * 100);
  const isWarning = pct > 70;
  const isCritical = pct > 90;

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-foreground">Consumo de IA hoy</span>
        {isCritical && <AlertTriangle className="w-3 h-3 text-red-400 ml-auto" />}
        {isWarning && !isCritical && <AlertTriangle className="w-3 h-3 text-amber-400 ml-auto" />}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-lg font-bold font-mono text-foreground">${data.estimatedCostUsd.toFixed(3)}</span>
        <span className="text-[10px] text-muted-foreground">/ ${DAILY_LIMIT_USD.toFixed(2)} limite</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isCritical ? 'hsl(0 84% 60%)' : isWarning ? 'hsl(43 96% 56%)' : 'linear-gradient(90deg, hsl(239 84% 67%), hsl(262 80% 65%))',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{data.totalRequests} llamadas hoy</span>
        <span>{pct.toFixed(0)}% usado</span>
      </div>
    </div>
  );
}
