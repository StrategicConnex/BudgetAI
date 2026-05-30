import { createClient } from '@/lib/supabase/server';
import { listBudgets } from '@/lib/supabase/queries/budgets';
import Link from 'next/link';
import { FileText, Sparkles, TrendingUp, Download } from 'lucide-react';
import AIStatusCards from '@/components/dashboard/AIStatusCards';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let budgets: Awaited<ReturnType<typeof listBudgets>> = [];
  let totalBudgets = 0;

  try {
    budgets = await listBudgets(5);
    totalBudgets = budgets.length;
  } catch {
    // Supabase no configurado — modo demo
  }

  const recentBudgets = budgets.slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenido{' '}
          <span className="text-gradient">
            {user?.email?.split('@')[0] || 'usuario'}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Generá presupuestos profesionales con IA en segundos
        </p>
      </div>

      {/* AI Status Cards */}
      <AIStatusCards />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Presupuestos generados"
          value={String(totalBudgets)}
          color="primary"
        />
        <StatCard
          icon={<Download className="w-5 h-5" />}
          label="Exportaciones"
          value="0"
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Este mes"
          value={String(totalBudgets)}
          color="violet"
        />
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.15), hsl(262 80% 65% / 0.15))',
          border: '1px solid hsl(239 84% 67% / 0.25)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2"
          style={{ background: 'hsl(239 84% 67%)' }} />
        <div className="relative">
          <div className="badge-premium mb-3 w-fit">
            <Sparkles className="w-3 h-3" />
            Gemini AI
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Generá tu próximo presupuesto
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Describí el trabajo, subí fotos del lugar, y la IA analiza todo
            para crear un presupuesto profesional listo para exportar.
          </p>
          <Link
            href="/dashboard/budgets/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
              boxShadow: '0 8px 32px hsl(239 84% 67% / 0.35)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Generar presupuesto con IA
          </Link>
        </div>
      </div>

      {/* Recent budgets */}
      {recentBudgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Presupuestos recientes</h2>
            <Link href="/dashboard/budgets" className="text-sm text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {recentBudgets.map((budget) => (
              <div key={budget.id} className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{budget.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(budget.created_at).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  budget.status === 'ready'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-muted border-border text-muted-foreground'
                }`}>
                  {budget.status === 'ready' ? 'Listo' : budget.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentBudgets.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin presupuestos aún</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Generá tu primer presupuesto con inteligencia artificial
          </p>
          <Link
            href="/dashboard/budgets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))' }}
          >
            <Sparkles className="w-4 h-4" />
            Crear primer presupuesto
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'emerald' | 'violet';
}) {
  const colors = {
    primary: { bg: 'hsl(239 84% 67% / 0.1)', border: 'hsl(239 84% 67% / 0.25)', text: 'hsl(239 84% 67%)' },
    emerald: { bg: 'hsl(158 64% 52% / 0.1)', border: 'hsl(158 64% 52% / 0.25)', text: 'hsl(158 64% 52%)' },
    violet: { bg: 'hsl(262 80% 65% / 0.1)', border: 'hsl(262 80% 65% / 0.25)', text: 'hsl(262 80% 65%)' },
  };

  const c = colors[color];

  return (
    <div className="glass-card p-5">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
