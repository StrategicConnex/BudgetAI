import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import BudgetDetailClient from './BudgetDetailClient';
import type { BudgetData } from '@/types/budget';

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  // Verify ownership
  if (data.user_id !== user.id) {
    notFound();
  }

  const budget = data.ai_output as BudgetData | null;

  if (!budget) {
    notFound();
  }

  return (
    <BudgetDetailClient
      budget={budget}
      budgetId={data.id}
      createdAt={data.created_at}
      status={data.status}
    />
  );
}
