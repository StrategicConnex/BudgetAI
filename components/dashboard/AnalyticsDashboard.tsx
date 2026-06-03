'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import type { BudgetData } from '@/types/budget';

interface BudgetRow {
  id: string;
  title: string;
  status: string;
  created_at: string;
  ai_output: BudgetData | null;
}

interface AnalyticsDashboardProps {
  budgets: BudgetRow[];
}

const COLORS = [
  'hsl(239 84% 67%)',
  'hsl(262 80% 65%)',
  'hsl(158 64% 52%)',
  'hsl(43 96% 56%)',
  'hsl(0 84% 60%)',
  'hsl(190 90% 50%)',
  'hsl(330 70% 60%)',
  'hsl(30 80% 55%)',
];

const CHART_AXIS_STYLE = { fontSize: 11, fill: 'hsl(215 16% 47%)' };

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color?: 'primary' | 'emerald' | 'violet' | 'amber';
}

function KPICard({ icon, label, value, sub, color = 'primary' }: KPICardProps) {
  const c = {
    primary: { bg: 'hsl(239 84% 67% / 0.1)', border: 'hsl(239 84% 67% / 0.25)', text: 'hsl(239 84% 67%)' },
    emerald: { bg: 'hsl(158 64% 52% / 0.1)', border: 'hsl(158 64% 52% / 0.25)', text: 'hsl(158 64% 52%)' },
    violet: { bg: 'hsl(262 80% 65% / 0.1)', border: 'hsl(262 80% 65% / 0.25)', text: 'hsl(262 80% 65%)' },
    amber: { bg: 'hsl(43 96% 56% / 0.1)', border: 'hsl(43 96% 56% / 0.25)', text: 'hsl(43 96% 56%)' },
  }[color];
  return (
    <div className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: c.bg, border: '1px solid ' + c.border, color: c.text }}>{icon}</div>
      <div className="text-lg font-bold text-foreground mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
    </div>
  );
}

export default function AnalyticsDashboard({ budgets }: AnalyticsDashboardProps) {
  const analysis = useMemo(() => {
    const months: Record<string, { month: string; count: number; total: number; exports: number }> = {};
    const categories: Record<string, { name: string; count: number; total: number }> = {};
    const clients: Record<string, { name: string; total: number; count: number; currency: string }> = {};
    let exported = 0;
    let totalAmt = 0;
    let currency = 'ARS';

    for (const b of budgets) {
      const d = new Date(b.created_at);
      const mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const ml = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      if (!months[mk]) months[mk] = { month: ml, count: 0, total: 0, exports: 0 };
      months[mk].count += 1;
      if (b.status === 'exported') { months[mk].exports += 1; exported += 1; }
      if (b.ai_output?.totales?.total) {
        months[mk].total += b.ai_output.totales.total;
        totalAmt += b.ai_output.totales.total;
        currency = b.ai_output.totales.currency || 'ARS';
      }
      const cat = b.ai_output?.categoria || 'Sin categoría';
      if (!categories[cat]) categories[cat] = { name: cat, count: 0, total: 0 };
      categories[cat].count += 1;
      if (b.ai_output?.totales?.total) categories[cat].total += b.ai_output.totales.total;

      // Aggregate client data
      const clientName = b.ai_output?.cliente?.nombre || 'Cliente sin nombre';
      if (!clients[clientName]) clients[clientName] = { name: clientName, total: 0, count: 0, currency };
      clients[clientName].count += 1;
      if (b.ai_output?.totales?.total) {
        clients[clientName].total += b.ai_output.totales.total;
      }
    }

    const monthly = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    const cats = Object.values(categories).sort((a, b) => b.count - a.count).slice(0, 8);
    const ready = budgets.filter(b => b.status === 'ready').length;
    const tot = budgets.length;
    return {
      monthlyData: monthly,
      categoryData: cats,
      clientData: Object.values(clients)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      statusData: [
        { name: 'Listos', value: ready, color: 'hsl(158 64% 52%)' },
        { name: 'Exportados', value: exported, color: 'hsl(239 84% 67%)' },
        { name: 'Borradores', value: Math.max(0, tot - ready - exported), color: 'hsl(43 96% 56%)' },
      ],
      totalGenerated: tot,
      totalExported: exported,
      totalAmount: totalAmt,
      totalAmountCurrency: currency,
      avgPerBudget: tot > 0 ? totalAmt / tot : 0,
      conversionRate: tot > 0 ? Math.round(exported / tot * 100) : 0,
    };
  }, [budgets]);

  const { monthlyData, categoryData, clientData, statusData, totalGenerated, totalExported, totalAmount, totalAmountCurrency, avgPerBudget, conversionRate } = analysis;

  const fmt = (v: number) => {
    if (totalAmountCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
    }
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(v);
  };

  if (budgets.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-8 text-center">
        <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">Generá presupuestos para ver estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Analíticas</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Presupuestos" value={String(totalGenerated)} sub="generados" color="primary" />
        <KPICard icon={<DownloadIcon className="w-4 h-4" />} label="Exportados" value={String(totalExported)} sub={conversionRate + '% del total'} color="emerald" />
        <KPICard icon={<BarChart3 className="w-4 h-4" />} label="Total facturado" value={fmt(totalAmount)} sub="suma de presupuestos" color="violet" />
        <KPICard icon={<Calendar className="w-4 h-4" />} label="Promedio" value={fmt(avgPerBudget)} sub="por presupuesto" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(239 84% 67% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle>Evolución mensual</CardTitle>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 47% / 0.15)" />
                <XAxis dataKey="month" tick={CHART_AXIS_STYLE} />
                <YAxis tick={CHART_AXIS_STYLE} />
                <Tooltip contentStyle={{ background: 'hsl(222 20% 12%)', border: '1px solid hsl(215 16% 47% / 0.3)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} formatter={(value: any) => [fmt(Number(value)), 'Monto']} />
                <Bar dataKey="total" fill="hsl(239 84% 67%)" radius={[4, 4, 0, 0]} name="Monto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(262 80% 65% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-violet-400" />
            <CardTitle>Categorías</CardTitle>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {categoryData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222 20% 12%)', border: '1px solid hsl(215 16% 47% / 0.3)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} formatter={(value: any, name: any) => [value, name]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'hsl(215 16% 47%)' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(158 64% 52% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <CardTitle>Presupuestos por mes</CardTitle>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 47% / 0.15)" />
                <XAxis dataKey="month" tick={CHART_AXIS_STYLE} />
                <YAxis tick={CHART_AXIS_STYLE} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 20% 12%)', border: '1px solid hsl(215 16% 47% / 0.3)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(158 64% 52%)" strokeWidth={2} dot={{ r: 3 }} name="Cantidad" />
                <Line type="monotone" dataKey="exports" stroke="hsl(239 84% 67%)" strokeWidth={2} dot={{ r: 3 }} name="Exportados" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(43 96% 56% / 0.2)' }}>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-amber-400" />
            <CardTitle>Estado de presupuestos</CardTitle>
          </div>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={4}>
                  {statusData.filter(d => d.value > 0).map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222 20% 12%)', border: '1px solid hsl(215 16% 47% / 0.3)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'hsl(215 16% 47%)' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><div className="font-bold text-emerald-400">{totalGenerated}</div><div className="text-muted-foreground">Total</div></div>
            <div><div className="font-bold text-primary">{totalExported}</div><div className="text-muted-foreground">Exportados</div></div>
            <div><div className="font-bold text-amber-400">{conversionRate}%</div><div className="text-muted-foreground">Conversión</div></div>
          </div>
        </Card>

      {/* Fourth row: full-width client ranking */}
      <Card padding="md" className="flex flex-col gap-4" style={{ borderColor: 'hsl(0 84% 60% / 0.2)' }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-400" />
          <CardTitle>Ranking de clientes por facturación</CardTitle>
          <span className="ml-auto text-[11px] text-muted-foreground">Top {clientData.length} clientes</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={clientData}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 16% 47% / 0.15)" horizontal={false} />
              <XAxis type="number" tick={CHART_AXIS_STYLE} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_STYLE} width={90} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 20% 12%)', border: '1px solid hsl(215 16% 47% / 0.3)', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                formatter={(value: any) => [fmt(Number(value)), 'Facturado']}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Facturado">
                {clientData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {clientData.length > 5 && (
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
              Ver clientes restantes ({clientData.length - 5})
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {clientData.slice(5).map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between px-2 py-1 rounded bg-secondary/20">
                  <span className="text-foreground">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </Card>
      </div>
    </div>
  );
}
