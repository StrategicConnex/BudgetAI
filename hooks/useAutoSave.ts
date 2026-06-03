'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { BudgetData } from '@/types/budget';

interface UseAutoSaveOptions {
  budgetId: string | null;
  budget: BudgetData | null;
  delay?: number;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  saveNow: () => void;
}

/**
 * Hook that auto-saves budget changes to the database with debounce.
 * Tracks when the budget object changes (by deep comparison) and
 * calls /api/budgets/update after a configurable delay (default 2s).
 */
export function useAutoSave({ budgetId, budget, delay = 2000 }: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  const doSave = useCallback(async () => {
    if (!budgetId || !budget) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: budgetId, budget }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar');
      }
      setLastSaved(new Date());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [budgetId, budget]);

  useEffect(() => {
    if (!budgetId || !budget) return;
    const serialized = JSON.stringify(budget);

    // Skip auto-save on initial load — only save when user actually edits
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      prevRef.current = serialized;
      return;
    }

    if (serialized === prevRef.current) return;
    prevRef.current = serialized;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [budget, budgetId, delay, doSave]);

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    doSave();
  }, [doSave]);

  return { isSaving, lastSaved, saveError, saveNow };
}