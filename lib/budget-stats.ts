import { createClient } from '@/lib/supabase/server';

/**
 * F13: Budget statistics and usage insights.
 */
export interface BudgetStats {
  totalBudgets: number;
  totalExported: number;
  thisMonth: number;
  lastMonth: number;
  topCategories: Array<{ category: string; count: number }>;
  totalValue: number;
  avgValue: number;
}

export async function getBudgetStats(): Promise<BudgetStats> {
  const defaultStats: BudgetStats = {
    totalBudgets: 0,
    totalExported: 0,
    thisMonth: 0,
    lastMonth: 0,
    topCategories: [],
    totalValue: 0,
    avgValue: 0,
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultStats;

    const { data: allBudgets } = await supabase
      .from('budgets')
      .select('id, status, created_at, ai_output')
      .eq('user_id', user.id);

    if (!allBudgets || allBudgets.length === 0) return defaultStats;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const totalExported = allBudgets.filter((b: any) => b.status === 'exported').length;
    const thisMonthBudgets = allBudgets.filter((b: any) => b.created_at >= thisMonthStart).length;
    const lastMonthBudgets = allBudgets.filter((b: any) => b.created_at >= lastMonthStart && b.created_at < thisMonthStart).length;

    // Category counts
    const categoryMap = new Map<string, number>();
    let totalValue = 0;

    for (const b of allBudgets) {
      const output = b.ai_output as { categoria?: string; totales?: { total?: number } } | null;
      if (output?.categoria) {
        categoryMap.set(output.categoria, (categoryMap.get(output.categoria) || 0) + 1);
      }
      if (output?.totales?.total) {
        totalValue += output.totales.total;
      }
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalBudgets: allBudgets.length,
      totalExported,
      thisMonth: thisMonthBudgets,
      lastMonth: lastMonthBudgets,
      topCategories,
      totalValue,
      avgValue: totalValue / allBudgets.length,
    };
  } catch {
    return defaultStats;
  }
}
