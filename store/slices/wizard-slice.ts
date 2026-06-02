// ── Types ───────────────────────────────────────────
export type WizardStep = 'input' | 'generating' | 'preview' | 'exported';

// ── State ───────────────────────────────────────────
export interface WizardSlice {
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
}

export const WIZARD_INITIAL_STATE = {
  currentStep: 'input' as WizardStep,
};

export const createWizardSlice = (set: any): WizardSlice => ({
  ...WIZARD_INITIAL_STATE,

  setCurrentStep: (step) => set((state: any) => { state.currentStep = step; }),
});
