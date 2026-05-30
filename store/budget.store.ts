import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BudgetData, Currency, TemplateId, ImageInput, BudgetCliente, BudgetCondiciones } from '@/types/budget';
import type { PipelineStage } from '@/lib/ai/orchestrator';

// ===== WIZARD STEPS =====
export type WizardStep = 'input' | 'generating' | 'preview' | 'exported';

// ===== STAGE PROGRESS =====
export interface StageProgress {
  stage: PipelineStage;
  message: string;
  progress: number;
}

// ===== STORE STATE =====
interface BudgetState {
  // Wizard navigation
  currentStep: WizardStep;

  // Form inputs
  rawText: string;
  images: ImageInput[];
  templateId: TemplateId;
  currency: Currency;
  clienteNombre: string;
  clienteEmpresa: string;
  tasaImpuesto: number;

  // AI Pipeline
  isGenerating: boolean;
  pipelineProgress: StageProgress | null;
  error: string | null;

  // Generated output
  budget: BudgetData | null;
  budgetId: string | null;

  // Export state
  isExportingPDF: boolean;
  isExportingDOCX: boolean;
  isExportingHTML: boolean;
  exportError: string | null;

  // Actions
  setRawText: (text: string) => void;
  addImage: (image: ImageInput) => void;
  removeImage: (index: number) => void;
  setTemplateId: (id: TemplateId) => void;
  setCurrency: (currency: Currency) => void;
  setClienteNombre: (name: string) => void;
  setClienteEmpresa: (empresa: string) => void;
  setTasaImpuesto: (tasa: number) => void;

  setCurrentStep: (step: WizardStep) => void;
  setIsGenerating: (loading: boolean) => void;
  setPipelineProgress: (progress: StageProgress | null) => void;
  setError: (error: string | null) => void;
  setBudget: (budget: BudgetData | null, id?: string) => void;

  setIsExportingPDF: (loading: boolean) => void;
  setIsExportingDOCX: (loading: boolean) => void;
  setIsExportingHTML: (loading: boolean) => void;
  setExportError: (error: string | null) => void;

  // Update generated budget item inline
  updateBudgetItem: (itemId: string, updates: Partial<BudgetData['items'][0]>) => void;
  updateBudgetGeneral: (updates: Partial<Pick<BudgetData, 'titulo' | 'descripcionGeneral' | 'categoria' | 'numero'>>) => void;
  updateBudgetCliente: (updates: Partial<BudgetCliente>) => void;
  updateBudgetCondiciones: (updates: Partial<BudgetCondiciones>) => void;
  addBudgetItem: (categoria: string) => void;
  deleteBudgetItem: (itemId: string) => void;

  // Reset
  reset: () => void;
}

const INITIAL_STATE = {
  currentStep: 'input' as WizardStep,
  rawText: '',
  images: [] as ImageInput[],
  templateId: 'construction' as TemplateId,
  currency: 'ARS' as Currency,
  clienteNombre: '',
  clienteEmpresa: '',
  tasaImpuesto: 0.21,
  isGenerating: false,
  pipelineProgress: null,
  error: null,
  budget: null,
  budgetId: null,
  isExportingPDF: false,
  isExportingDOCX: false,
  isExportingHTML: false,
  exportError: null,
};

export const useBudgetStore = create<BudgetState>()(
  immer((set) => ({
    ...INITIAL_STATE,

    setRawText: (text) => set((state) => { state.rawText = text; }),
    addImage: (image) => set((state) => { state.images.push(image); }),
    removeImage: (index) => set((state) => { state.images.splice(index, 1); }),
    setTemplateId: (id) => set((state) => { state.templateId = id; }),
    setCurrency: (currency) => set((state) => { state.currency = currency; }),
    setClienteNombre: (name) => set((state) => { state.clienteNombre = name; }),
    setClienteEmpresa: (empresa) => set((state) => { state.clienteEmpresa = empresa; }),
    setTasaImpuesto: (tasa) => set((state) => { state.tasaImpuesto = tasa; }),

    setCurrentStep: (step) => set((state) => { state.currentStep = step; }),
    setIsGenerating: (loading) => set((state) => { state.isGenerating = loading; }),
    setPipelineProgress: (progress) => set((state) => { state.pipelineProgress = progress; }),
    setError: (error) => set((state) => { state.error = error; }),
    setBudget: (budget, id) => set((state) => {
      state.budget = budget;
      if (id) state.budgetId = id;
    }),

    setIsExportingPDF: (loading) => set((state) => { state.isExportingPDF = loading; }),
    setIsExportingDOCX: (loading) => set((state) => { state.isExportingDOCX = loading; }),
    setIsExportingHTML: (loading) => set((state) => { state.isExportingHTML = loading; }),
    setExportError: (error) => set((state) => { state.exportError = error; }),

    updateBudgetItem: (itemId, updates) => set((state) => {
      if (!state.budget) return;
      const idx = state.budget.items.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      Object.assign(state.budget.items[idx], updates);

      // Recalculate totals
      const subtotal = state.budget.items.reduce((acc, item) => {
        const total = (item.cantidad || 0) * (item.precioUnitario || 0);
        item.precioTotal = total;
        return acc + total;
      }, 0);
      state.budget.totales.subtotal = subtotal;
      state.budget.totales.impuestos = subtotal * state.budget.totales.tasaImpuesto;
      state.budget.totales.total = subtotal + state.budget.totales.impuestos;
    }),

    updateBudgetGeneral: (updates) => set((state) => {
      if (!state.budget) return;
      Object.assign(state.budget, updates);
    }),

    updateBudgetCliente: (updates) => set((state) => {
      if (!state.budget) return;
      Object.assign(state.budget.cliente, updates);
    }),

    updateBudgetCondiciones: (updates) => set((state) => {
      if (!state.budget) return;
      Object.assign(state.budget.condiciones, updates);
    }),

    addBudgetItem: (categoria) => set((state) => {
      if (!state.budget) return;
      const newItem = {
        id: Math.random().toString(36).substring(2, 9),
        titulo: 'Nuevo trabajo',
        descripcion: 'Descripción del trabajo a realizar...',
        unidad: 'u',
        cantidad: 1,
        precioUnitario: 0,
        precioTotal: 0,
        categoria: categoria || 'General',
        imagenes: [],
      };
      state.budget.items.push(newItem);

      // Recalculate totals
      const subtotal = state.budget.items.reduce((acc, item) => acc + (item.cantidad || 0) * (item.precioUnitario || 0), 0);
      state.budget.totales.subtotal = subtotal;
      state.budget.totales.impuestos = subtotal * state.budget.totales.tasaImpuesto;
      state.budget.totales.total = subtotal + state.budget.totales.impuestos;
    }),

    deleteBudgetItem: (itemId) => set((state) => {
      if (!state.budget) return;
      state.budget.items = state.budget.items.filter(i => i.id !== itemId);

      // Recalculate totals
      const subtotal = state.budget.items.reduce((acc, item) => acc + (item.cantidad || 0) * (item.precioUnitario || 0), 0);
      state.budget.totales.subtotal = subtotal;
      state.budget.totales.impuestos = subtotal * state.budget.totales.tasaImpuesto;
      state.budget.totales.total = subtotal + state.budget.totales.impuestos;
    }),

    reset: () => set(() => ({ ...INITIAL_STATE })),
  }))
);
