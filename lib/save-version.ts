import type { BudgetData } from '@/types/budget';

/**
 * F12: Client-side helper to save a budget version via API.
 * Fire-and-forget: never blocks or throws.
 */
export async function saveBudgetVersion(
  budgetId: string,
  snapshot: BudgetData,
  changedFields?: string[]
): Promise<void> {
  try {
    await fetch('/api/budgets/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetId, snapshot, changedFields }),
    });
  } catch {
    // Versioning should never block the user
  }
}
