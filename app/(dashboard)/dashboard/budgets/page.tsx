import { createClient } from '@/lib/supabase/server';
import BudgetsListClient from './BudgetsListClient';
import type { BudgetData } from '@/types/budget';

export default async function BudgetsPage() {
  let budgets: { id: string; title: string; status: string; created_at: string; ai_output: BudgetData | null }[] = [];

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

  return <BudgetsListClient budgets={budgets} />;
}
