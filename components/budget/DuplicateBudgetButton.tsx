'use client';

import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useBudgetStore } from '@/store/budget.store';
import type { BudgetData } from '@/types/budget';

interface DuplicateBudgetButtonProps {
  budget: BudgetData;
  className?: string;
}

export default function DuplicateBudgetButton({ budget, className }: DuplicateBudgetButtonProps) {
  const router = useRouter();
  const { setBudget, setCurrentStep } = useBudgetStore();

  function handleDuplicate() {
    setBudget({ ...budget, titulo: `${budget.titulo} (copia)`, numero: undefined, createdAt: undefined });
    setCurrentStep('preview');
    router.push('/dashboard/budgets/new');
    toast.success('Presupuesto duplicado — editalo y exportalo');
  }

  return (
    <button
      onClick={handleDuplicate}
      className={className || 'p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'}
      title="Duplicar presupuesto"
    >
      <Copy className="w-4 h-4" />
    </button>
  );
}
