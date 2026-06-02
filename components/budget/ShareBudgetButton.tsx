'use client';

import { useState } from 'react';
import { Share2, Link2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * F7: Share budget via public link.
 * Generates a shareable read-only view of the budget.
 */
interface ShareBudgetButtonProps {
  budgetId?: string;
  budgetTitle: string;
  budgetData: unknown;
  className?: string;
}

export default function ShareBudgetButton({ budgetId, budgetTitle, budgetData, className }: ShareBudgetButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      if (budgetId) {
        const url = `${window.location.origin}/share/${budgetId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado al portapapeles');
      } else {
        // Sin ID, copiar resumen como texto
        const data = budgetData as { titulo?: string; cliente?: { nombre?: string }; totales?: { total?: number; currency?: string } };
        const text = `${data?.titulo || budgetTitle}\nCliente: ${data?.cliente?.nombre || '—'}\nTotal: ${data?.totales?.total || 0} ${data?.totales?.currency || 'ARS'}`;
        await navigator.clipboard.writeText(text);
        toast.success('Resumen copiado al portapapeles');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className={className || 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-all'}
      title="Compartir presupuesto"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  );
}
