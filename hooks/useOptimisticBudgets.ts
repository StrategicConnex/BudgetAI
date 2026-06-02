'use client';

import { useState, useCallback } from 'react';

/**
 * P1: Optimistic updates for budget list.
 * Shows changes immediately before server confirms.
 */
export interface OptimisticBudget {
  id: string;
  title: string;
  status: string;
  created_at: string;
  ai_output: unknown;
}

export function useOptimisticBudgets(initial: OptimisticBudget[]) {
  const [budgets, setBudgets] = useState<OptimisticBudget[]>(initial);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const addOptimistic = useCallback((budget: OptimisticBudget) => {
    setBudgets(prev => [budget, ...prev]);
    setPending(prev => new Set(prev).add(budget.id));
  }, []);

  const removeOptimistic = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    setPending(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const confirm = useCallback((id: string) => {
    setPending(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const rollback = useCallback((id: string, original: OptimisticBudget) => {
    setBudgets(prev => {
      const exists = prev.some(b => b.id === id);
      if (exists) return prev.map(b => b.id === id ? original : b);
      return [original, ...prev];
    });
    setPending(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { budgets, pending, addOptimistic, removeOptimistic, confirm, rollback, setBudgets };
}
