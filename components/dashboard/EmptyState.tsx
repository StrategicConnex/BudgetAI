'use client';

import Link from 'next/link';
import { Sparkles, FileText, Upload, BarChart3, ArrowRight } from 'lucide-react';

/**
 * D7: Improved empty states with illustrations and context-aware CTAs.
 */

interface EmptyStateProps {
  type: 'no-budgets' | 'no-results' | 'no-data' | 'first-time';
  title?: string;
  description?: string;
}

const EMPTY_CONFIGS = {
  'no-budgets': {
    icon: FileText,
    title: 'Sin presupuestos aun',
    description: 'Genera tu primer presupuesto con inteligencia artificial en segundos.',
    cta: { label: 'Crear primer presupuesto', href: '/dashboard/budgets/new', icon: Sparkles },
  },
  'no-results': {
    icon: FileText,
    title: 'Sin resultados',
    description: 'No se encontraron presupuestos con los filtros aplicados.',
    cta: null,
  },
  'no-data': {
    icon: BarChart3,
    title: 'Sin datos todavia',
    description: 'Aun no hay datos para mostrar aqui. Empeza generando presupuestos.',
    cta: { label: 'Ir al dashboard', href: '/dashboard', icon: ArrowRight },
  },
  'first-time': {
    icon: Sparkles,
    title: 'Bienvenido a BudgetAI!',
    description: 'Empeza subiendo fotos del lugar o escribiendo una descripcion del trabajo.',
    cta: { label: 'Subir fotos', href: '/dashboard/budgets/new', icon: Upload },
  },
};

export default function EmptyState({ type, title, description }: EmptyStateProps) {
  const config = EMPTY_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-10 h-10 text-primary/60" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-primary/5 blur-xl -z-10" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title || config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description || config.description}</p>
      {config.cta && (
        <Link
          href={config.cta.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(239 84% 67%), hsl(262 80% 65%))',
            boxShadow: '0 4px 20px hsl(239 84% 67% / 0.3)',
          }}
        >
          <config.cta.icon className="w-4 h-4" />
          {config.cta.label}
        </Link>
      )}
    </div>
  );
}
