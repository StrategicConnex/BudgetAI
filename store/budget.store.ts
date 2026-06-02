import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createFormSlice, FORM_INITIAL_STATE } from './slices/form-slice';
import { createPipelineSlice, PIPELINE_INITIAL_STATE } from './slices/pipeline-slice';
import { createBudgetSlice, BUDGET_INITIAL_STATE } from './slices/budget-slice';
import { createExportSlice, EXPORT_INITIAL_STATE } from './slices/export-slice';
import { createWizardSlice, WIZARD_INITIAL_STATE } from './slices/wizard-slice';
import type { FormSlice } from './slices/form-slice';
import type { PipelineSlice } from './slices/pipeline-slice';
import type { BudgetSlice } from './slices/budget-slice';
import type { ExportSlice } from './slices/export-slice';
import type { WizardSlice } from './slices/wizard-slice';

// ===== COMPOSED STORE TYPE =====
// Mantiene la misma API pública que el store original.
export interface BudgetState extends FormSlice, PipelineSlice, BudgetSlice, ExportSlice, WizardSlice {
  reset: () => void;
}

// ===== COMPOSED STORE =====
// Cada slice aporta su estado y acciones. El reset unifica todos los initial states.
export const useBudgetStore = create<BudgetState>()(
  immer((set) => ({
    ...createFormSlice(set),
    ...createPipelineSlice(set),
    ...createBudgetSlice(set),
    ...createExportSlice(set),
    ...createWizardSlice(set),

    // Reset global: restaura todos los slices a su estado inicial
    reset: () =>
      set((state: any) => {
        Object.assign(state, {
          ...FORM_INITIAL_STATE,
          ...PIPELINE_INITIAL_STATE,
          ...BUDGET_INITIAL_STATE,
          ...EXPORT_INITIAL_STATE,
          ...WIZARD_INITIAL_STATE,
        });
      }),
  }))
);

// ===== RE-EXPORT TYPES =====
// Para mantener compatibilidad con importaciones existentes.
export type { WizardStep } from './slices/wizard-slice';
export type { StageProgress } from './slices/pipeline-slice';
