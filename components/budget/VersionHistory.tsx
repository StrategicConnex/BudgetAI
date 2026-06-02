'use client';

import { useState, useEffect } from 'react';
import { History, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { BudgetVersion } from '@/lib/supabase/queries/budget-versions';

/**
 * F12: Budget version history component.
 */
interface VersionHistoryProps {
  budgetId: string;
  onRestore: (snapshot: BudgetVersion['snapshot']) => void;
  disabled?: boolean;
}

export default function VersionHistory({ budgetId, onRestore, disabled }: VersionHistoryProps) {
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded && versions.length === 0) {
      setLoading(true);
      import('@/lib/supabase/queries/budget-versions').then(({ getBudgetVersions }) =>
        getBudgetVersions(budgetId).then(v => { setVersions(v); setLoading(false); })
      ).catch(() => setLoading(false));
    }
  }, [expanded, budgetId, versions.length]);

  return (
    <div className="rounded-xl border border-border bg-card/80">
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        <History className="w-4 h-4 text-primary" />
        <span>Historial de versiones</span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Cargando versiones...</div>
          ) : versions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Sin versiones guardadas</div>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">v{v.version}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleString('es-AR')}
                      {v.changed_fields && ` — ${v.changed_fields.join(', ')}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRestore(v.snapshot)} disabled={disabled}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
