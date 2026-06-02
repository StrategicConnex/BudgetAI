import { createClient } from '@/lib/supabase/server';
import type { BudgetData } from '@/types/budget';

/**
 * F12: Budget versioning — track changes over time.
 */
export interface BudgetVersion {
  id: string;
  budget_id: string;
  version: number;
  snapshot: BudgetData;
  changed_fields?: string[];
  created_at: string;
}

/**
 * Create a new version snapshot of a budget.
 */
export async function createBudgetVersion(
  budgetId: string,
  snapshot: BudgetData,
  changedFields?: string[]
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get latest version number
    const { data: latest } = await supabase
      .from('budget_versions')
      .select('version')
      .eq('budget_id', budgetId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latest?.version || 0) + 1;

    await supabase.from('budget_versions').insert({
      budget_id: budgetId,
      version: nextVersion,
      snapshot,
      changed_fields: changedFields || null,
    });
  } catch {
    // Versioning should never break the app
  }
}

/**
 * Get all versions of a budget, ordered by version number.
 */
export async function getBudgetVersions(budgetId: string): Promise<BudgetVersion[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('budget_versions')
      .select('*')
      .eq('budget_id', budgetId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Restore a specific version of a budget.
 */
export async function restoreBudgetVersion(
  budgetId: string,
  version: number
): Promise<BudgetData | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('budget_versions')
      .select('snapshot')
      .eq('budget_id', budgetId)
      .eq('version', version)
      .single();

    if (error) throw error;
    return data?.snapshot as BudgetData || null;
  } catch {
    return null;
  }
}
