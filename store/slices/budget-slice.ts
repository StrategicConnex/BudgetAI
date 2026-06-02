import type { BudgetData, BudgetCliente, BudgetCondiciones } from '@/types/budget';

// ── Types ───────────────────────────────────────────
export interface BudgetSlice {
  budget: BudgetData | null;
  budgetId: string | null;

  setBudget: (budget: BudgetData | null, id?: string) => void;
  updateBudgetItem: (itemId: string, updates: Partial<BudgetData['items'][0]>) => void;
  updateBudgetGeneral: (updates: Partial<Pick<BudgetData, 'titulo' | 'descripcionGeneral' | 'categoria' | 'numero'>>) => void;
  updateBudgetCliente: (updates: Partial<BudgetCliente>) => void;
  updateBudgetCondiciones: (updates: Partial<BudgetCondiciones>) => void;
  addBudgetItem: (categoria: string) => void;
  deleteBudgetItem: (itemId: string) => void;
}

export const BUDGET_INITIAL_STATE = {
  budget: null as BudgetData | null,
  budgetId: null as string | null,
};

/** Recalculate totals from items array using immer draft */
function recalculateTotals(state: any): void {
  if (!state.budget) return;
  const subtotal = state.budget.items.reduce(
    (acc: number, item: any) => acc + (item.cantidad || 0) * (item.precioUnitario || 0),
    0
  );
  state.budget.totales.subtotal = subtotal;
  state.budget.totales.impuestos = subtotal * state.budget.totales.tasaImpuesto;
  state.budget.totales.total = subtotal + state.budget.totales.impuestos;
}

export const createBudgetSlice = (set: any): BudgetSlice => ({
  ...BUDGET_INITIAL_STATE,

  setBudget: (budget, id) => set((state: any) => {
    state.budget = budget;
    if (id) state.budgetId = id;
  }),

  updateBudgetItem: (itemId, updates) => set((state: any) => {
    if (!state.budget) return;
    const idx = state.budget.items.findIndex((i: any) => i.id === itemId);
    if (idx === -1) return;
    Object.assign(state.budget.items[idx], updates);

    // Recalculate per-item total
    state.budget.items[idx].precioTotal =
      (state.budget.items[idx].cantidad || 0) * (state.budget.items[idx].precioUnitario || 0);

    recalculateTotals(state);
  }),

  updateBudgetGeneral: (updates) => set((state: any) => {
    if (!state.budget) return;
    Object.assign(state.budget, updates);
  }),

  updateBudgetCliente: (updates) => set((state: any) => {
    if (!state.budget) return;
    Object.assign(state.budget.cliente, updates);
  }),

  updateBudgetCondiciones: (updates) => set((state: any) => {
    if (!state.budget) return;
    Object.assign(state.budget.condiciones, updates);
  }),

  addBudgetItem: (categoria) => set((state: any) => {
    if (!state.budget) return;
    state.budget.items.push({
      id: Math.random().toString(36).substring(2, 9),
      titulo: 'Nuevo trabajo',
      descripcion: 'Descripción del trabajo a realizar...',
      unidad: 'u',
      cantidad: 1,
      precioUnitario: 0,
      precioTotal: 0,
      categoria: categoria || 'General',
      imagenes: [],
    });
    recalculateTotals(state);
  }),

  deleteBudgetItem: (itemId) => set((state: any) => {
    if (!state.budget) return;
    state.budget.items = state.budget.items.filter((i: any) => i.id !== itemId);
    recalculateTotals(state);
  }),
});
