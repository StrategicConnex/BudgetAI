'use client';

import { useBudgetStore } from '@/store/budget.store';
import AIInputArea from '@/components/budget/AIInputArea';
import BudgetPreview from '@/components/budget/BudgetPreview';
import { Sparkles, FileText, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 'input', label: 'Descripción', icon: Sparkles },
  { id: 'generating', label: 'Generando', icon: Sparkles },
  { id: 'preview', label: 'Revisión y Export', icon: FileText },
  { id: 'exported', label: 'Exportado', icon: CheckCircle },
] as const;

export default function NewBudgetPage() {
  const currentStep = useBudgetStore(s => s.currentStep);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Nuevo presupuesto
        </h1>
        <p className="text-muted-foreground text-sm">
          Describí el trabajo e importá fotos — la IA genera el presupuesto completo
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.filter(s => s.id !== 'generating').map((step, idx, arr) => {
          const stepOrder = ['input', 'preview', 'exported'];
          const currentOrder = ['input', 'generating', 'preview', 'exported'];
          const currentIdx = currentOrder.indexOf(currentStep);
          const stepIdx = currentOrder.indexOf(step.id);
          const isDone = stepIdx < currentIdx;
          const isActive = step.id === currentStep || (currentStep === 'generating' && step.id === 'input');

          return (
            <div key={step.id} className="flex items-center gap-0 flex-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'stage-active' : isDone ? 'stage-done' : 'stage-pending'
              }`}>
                {isDone
                  ? <CheckCircle className="w-4 h-4" />
                  : <step.icon className="w-4 h-4" />
                }
                {step.label}
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-colors ${isDone ? 'bg-emerald-500/50' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {(currentStep === 'input' || currentStep === 'generating') && (
        <AIInputArea />
      )}
      {(currentStep === 'preview' || currentStep === 'exported') && (
        <BudgetPreview />
      )}
    </div>
  );
}
