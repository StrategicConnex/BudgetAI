import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Plus, Sparkles } from 'lucide-react';

export default async function BudgetsPage() {
  let budgets: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });
    budgets = data || [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''} generado{budgets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/budgets/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
            boxShadow: '0 4px 20px hsl(239 84% 67% / 0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo presupuesto
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sin presupuestos todavía</h2>
          <p className="text-muted-foreground mb-6">
            Creá tu primer presupuesto con inteligencia artificial
          </p>
          <Link
            href="/dashboard/budgets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
          >
            <Sparkles className="w-4 h-4" />
            Generar presupuesto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const aiOutput = budget.ai_output;
            const total = aiOutput?.totales?.total;
            const currency = aiOutput?.totales?.currency || 'ARS';

            return (
              <div key={budget.id} className="glass-card p-5 hover:border-primary/20 transition-all duration-150">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{budget.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        budget.status === 'ready' || budget.status === 'exported'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {budget.status === 'ready' ? 'Listo' : budget.status === 'exported' ? 'Exportado' : budget.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(budget.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}</span>
                      {aiOutput?.categoria && <span>• {aiOutput.categoria}</span>}
                      {aiOutput?.cliente?.nombre && <span>• {aiOutput.cliente.nombre}</span>}
                    </div>
                  </div>
                  {total !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-foreground text-lg">
                        {new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
                          style: 'currency',
                          currency,
                          maximumFractionDigits: 0,
                        }).format(total)}
                      </div>
                      <div className="text-xs text-muted-foreground">{currency}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
