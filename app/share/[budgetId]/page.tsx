import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BudgetReadOnly from '@/components/budget/BudgetReadOnly';
import type { BudgetData } from '@/types/budget';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ budgetId: string }>;
  searchParams: Promise<{ expires?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { budgetId } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('budgets')
      .select('ai_output, title')
      .eq('id', budgetId)
      .single();

    const output = data?.ai_output as BudgetData | null;
    return {
      title: output?.titulo || data?.title || 'Presupuesto',
      description: output?.descripcionGeneral || 'Presupuesto generado con BudgetAI',
      openGraph: {
        title: output?.titulo || 'Presupuesto BudgetAI',
        description: output?.descripcionGeneral || '',
        type: 'website',
      },
    };
  } catch {
    return { title: 'Presupuesto' };
  }
}

export default async function ShareBudgetPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const { expires } = await searchParams;

  // Check link expiration server-side
  if (expires) {
    const expiresDate = new Date(expires);
    if (isNaN(expiresDate.getTime()) || expiresDate < new Date()) {
      return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Enlace expirado</h1>
            <p className="text-sm text-muted-foreground mb-1">Este enlace de presupuesto ya no está disponible.</p>
            <p className="text-xs text-muted-foreground/60">Venció el {expiresDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      );
    }
  }

  // Fetch budget without requiring auth
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('ai_output')
    .eq('id', budgetId)
    .single();

  if (error || !data?.ai_output) {
    notFound();
  }

  const budgetData = data.ai_output as BudgetData;

  return <BudgetReadOnly budget={budgetData} budgetId={budgetId} expiresAt={expires} />;
}
