// ===== STORE SLICE UNIT TESTS =====
// Each slice is tested in isolation using immer's produce() directly.
// Esto evita depender de otros slices o del store compuesto, y es type-safe
// porque usamos tipos simples en vez de la complejidad de createStore + immer middleware.

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from 'immer';

import { createFormSlice, FORM_INITIAL_STATE } from '@/store/slices/form-slice';
import { createPipelineSlice, PIPELINE_INITIAL_STATE } from '@/store/slices/pipeline-slice';
import { createBudgetSlice, BUDGET_INITIAL_STATE } from '@/store/slices/budget-slice';
import { createExportSlice, EXPORT_INITIAL_STATE } from '@/store/slices/export-slice';
import { createWizardSlice, WIZARD_INITIAL_STATE } from '@/store/slices/wizard-slice';
import type { FormSlice } from '@/store/slices/form-slice';
import type { PipelineSlice } from '@/store/slices/pipeline-slice';
import type { BudgetSlice } from '@/store/slices/budget-slice';
import type { ExportSlice } from '@/store/slices/export-slice';
import type { WizardSlice } from '@/store/slices/wizard-slice';
import type { ImageInput } from '@/types/budget';

// ==============================================
// HELPERS
// ==============================================

type SetFn<T> = (updater: (draft: T) => void) => void;

/**
 * Crea un mock de state slice aislado.
 * En lugar de usar createStore de Zustand, aplicamos las mutaciones
 * via immer produce() como lo haría el middleware.
 */
function createSliceStore<TState extends Record<string, any>>(
  creator: (set: SetFn<TState>) => TState,
  initialState: Partial<TState>
) {
  let state = creator((updater) => {
    state = produce(state, updater);
  });

  // Reset con el initial state
  function reset() {
    state = creator((updater) => {
      state = produce(state, updater);
    });
    // Force-set initial state values
    for (const [key, val] of Object.entries(initialState)) {
      (state as any)[key] = val;
    }
  }

  // Aplicar initial state post-creación
  for (const [key, val] of Object.entries(initialState)) {
    (state as any)[key] = val;
  }

  return {
    getState: () => state,
    reset,
  };
}

const MOCK_IMAGE: ImageInput = {
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  mimeType: 'image/png',
  filename: 'test.png',
};

const MOCK_BUDGET = {
  titulo: 'Presupuesto Test',
  numero: 'BGT-001',
  cliente: { nombre: 'Cliente Test', empresa: 'Empresa SA', email: 'cliente@test.com' },
  categoria: 'Construcción',
  descripcionGeneral: 'Trabajos de construcción general',
  items: [
    { id: 'item-1', titulo: 'Item 1', descripcion: 'Descripción 1', unidad: 'm²', cantidad: 10, precioUnitario: 1000, precioTotal: 10000, categoria: 'General', imagenes: [] },
    { id: 'item-2', titulo: 'Item 2', descripcion: 'Descripción 2', unidad: 'u', cantidad: 5, precioUnitario: 500, precioTotal: 2500, categoria: 'Pintura', imagenes: [] },
  ],
  totales: { subtotal: 12500, impuestos: 2625, tasaImpuesto: 0.21, total: 15125, currency: 'ARS' as const },
  condiciones: { validezDias: 30, formaPago: 'Transferencia', plazoDias: 15 },
  templateId: 'construction' as const,
};

// ==============================================
// FORM SLICE TESTS
// ==============================================
describe('FormSlice — formulario de entrada', () => {
  let store: ReturnType<typeof createSliceStore<FormSlice>>;

  beforeEach(() => {
    store = createSliceStore<FormSlice>(
      (set) => createFormSlice(set),
      FORM_INITIAL_STATE
    );
  });

  it('debería inicializar con estado default', () => {
    const state = store.getState();
    expect(state.rawText).toBe('');
    expect(state.images).toEqual([]);
    expect(state.templateId).toBe('construction');
    expect(state.currency).toBe('ARS');
    expect(state.clienteNombre).toBe('');
    expect(state.clienteEmpresa).toBe('');
    expect(state.tasaImpuesto).toBe(0.21);
  });

  it('debería actualizar rawText', () => {
    store.getState().setRawText('Reparación de filtraciones en techo');
    expect(store.getState().rawText).toBe('Reparación de filtraciones en techo');
  });

  it('debería agregar imágenes', () => {
    store.getState().addImage(MOCK_IMAGE);
    expect(store.getState().images).toHaveLength(1);
    expect(store.getState().images[0].filename).toBe('test.png');
  });

  it('debería agregar múltiples imágenes', () => {
    store.getState().addImage(MOCK_IMAGE);
    store.getState().addImage({ ...MOCK_IMAGE, filename: 'test2.png' });
    expect(store.getState().images).toHaveLength(2);
  });

  it('debería eliminar imágenes por índice', () => {
    store.getState().addImage(MOCK_IMAGE);
    store.getState().addImage({ ...MOCK_IMAGE, filename: 'test2.png' });
    store.getState().removeImage(0);
    expect(store.getState().images).toHaveLength(1);
    expect(store.getState().images[0].filename).toBe('test2.png');
  });

  it('debería eliminar la última imagen sin errores', () => {
    store.getState().addImage(MOCK_IMAGE);
    store.getState().removeImage(0);
    expect(store.getState().images).toHaveLength(0);
  });

  it('debería eliminar imagen del medio correctamente', () => {
    store.getState().addImage(MOCK_IMAGE);
    store.getState().addImage({ ...MOCK_IMAGE, filename: 'test2.png' });
    store.getState().addImage({ ...MOCK_IMAGE, filename: 'test3.png' });
    store.getState().removeImage(1);
    expect(store.getState().images).toHaveLength(2);
    expect(store.getState().images[0].filename).toBe('test.png');
    expect(store.getState().images[1].filename).toBe('test3.png');
  });

  it('debería cambiar templateId', () => {
    store.getState().setTemplateId('minimal-white');
    expect(store.getState().templateId).toBe('minimal-white');
  });

  it('debería cambiar entre templateId', () => {
    store.getState().setTemplateId('minimal-white');
    store.getState().setTemplateId('construction');
    expect(store.getState().templateId).toBe('construction');
  });

  it('debería cambiar currency', () => {
    store.getState().setCurrency('USD');
    expect(store.getState().currency).toBe('USD');
  });

  it('debería cambiar entre currency', () => {
    store.getState().setCurrency('USD');
    store.getState().setCurrency('ARS');
    expect(store.getState().currency).toBe('ARS');
  });

  it('debería actualizar nombre de cliente', () => {
    store.getState().setClienteNombre('Juan Pérez');
    expect(store.getState().clienteNombre).toBe('Juan Pérez');
  });

  it('debería actualizar empresa de cliente', () => {
    store.getState().setClienteEmpresa('Constructora SA');
    expect(store.getState().clienteEmpresa).toBe('Constructora SA');
  });

  it('debería actualizar tasa de impuesto', () => {
    store.getState().setTasaImpuesto(0.105);
    expect(store.getState().tasaImpuesto).toBe(0.105);
  });

  it('debería manejar tasa de impuesto cero', () => {
    store.getState().setTasaImpuesto(0);
    expect(store.getState().tasaImpuesto).toBe(0);
  });

  it('debería limpiar rawText cuando se setea string vacío', () => {
    store.getState().setRawText('texto previo');
    store.getState().setRawText('');
    expect(store.getState().rawText).toBe('');
  });

  it('no debería mutar estado adyacente al setear rawText', () => {
    store.getState().setRawText('nuevo texto');
    const state = store.getState();
    expect(state.templateId).toBe('construction'); // no debería cambiar
    expect(state.currency).toBe('ARS'); // no debería cambiar
  });
});

// ==============================================
// PIPELINE SLICE TESTS
// ==============================================
describe('PipelineSlice — pipeline de generación AI', () => {
  let store: ReturnType<typeof createSliceStore<PipelineSlice>>;

  beforeEach(() => {
    store = createSliceStore<PipelineSlice>(
      (set) => createPipelineSlice(set),
      PIPELINE_INITIAL_STATE
    );
  });

  it('debería inicializar con estado default', () => {
    const state = store.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.pipelineProgress).toBeNull();
    expect(state.error).toBeNull();
  });

  it('debería alternar isGenerating', () => {
    store.getState().setIsGenerating(true);
    expect(store.getState().isGenerating).toBe(true);
    store.getState().setIsGenerating(false);
    expect(store.getState().isGenerating).toBe(false);
  });

  it('debería establecer pipelineProgress correctamente', () => {
    const progress = { stage: 'vision' as const, message: 'Analizando imágenes...', progress: 25 };
    store.getState().setPipelineProgress(progress);
    expect(store.getState().pipelineProgress).toEqual(progress);
  });

  it('debería limpiar pipelineProgress con null', () => {
    store.getState().setPipelineProgress({ stage: 'generation' as const, message: 'Generando...', progress: 50 });
    store.getState().setPipelineProgress(null);
    expect(store.getState().pipelineProgress).toBeNull();
  });

  it('debería actualizar progreso en distintas etapas de pipeline', () => {
    const stages = [
      { stage: 'parsing' as const, message: 'Extrayendo información...', progress: 40 },
      { stage: 'generation' as const, message: 'Generando presupuesto...', progress: 65 },
      { stage: 'validation' as const, message: 'Validando...', progress: 85 },
      { stage: 'complete' as const, message: '¡Listo!', progress: 100 },
    ];

    for (const s of stages) {
      store.getState().setPipelineProgress(s);
      expect(store.getState().pipelineProgress).toEqual(s);
    }
  });

  it('debería manejar error', () => {
    store.getState().setError('Error de conexión con proveedor AI');
    expect(store.getState().error).toBe('Error de conexión con proveedor AI');
  });

  it('debería limpiar error correctamente', () => {
    store.getState().setError('Error temporal');
    store.getState().setError(null);
    expect(store.getState().error).toBeNull();
  });

  it('debería mantener isGenerating en true cuando se setea un error', () => {
    store.getState().setIsGenerating(true);
    store.getState().setError('Error en pipeline');
    const state = store.getState();
    expect(state.isGenerating).toBe(true); // no debería cambiar
    expect(state.error).toBe('Error en pipeline');
  });

  it('debería mantener pipelineProgress cuando se alterna isGenerating', () => {
    store.getState().setPipelineProgress({ stage: 'vision' as const, message: 'Test', progress: 10 });
    store.getState().setIsGenerating(true);
    expect(store.getState().pipelineProgress).toEqual({ stage: 'vision', message: 'Test', progress: 10 });
  });
});

// ==============================================
// BUDGET SLICE TESTS
// ==============================================
describe('BudgetSlice — datos del presupuesto y CRUD', () => {
  let store: ReturnType<typeof createSliceStore<BudgetSlice>>;

  beforeEach(() => {
    store = createSliceStore<BudgetSlice>(
      (set) => createBudgetSlice(set),
      BUDGET_INITIAL_STATE
    );
  });

  it('debería inicializar con estado default', () => {
    const state = store.getState();
    expect(state.budget).toBeNull();
    expect(state.budgetId).toBeNull();
  });

  it('debería setear budget con id', () => {
    store.getState().setBudget(MOCK_BUDGET as any, 'budget-abc-123');
    const state = store.getState();
    expect(state.budget).toEqual(MOCK_BUDGET);
    expect(state.budgetId).toBe('budget-abc-123');
  });

  it('debería setear budget sin id', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    const state = store.getState();
    expect(state.budget).toEqual(MOCK_BUDGET);
    expect(state.budgetId).toBeNull();
  });

  it('debería limpiar budget con null', () => {
    store.getState().setBudget(MOCK_BUDGET as any, 'id-123');
    store.getState().setBudget(null);
    expect(store.getState().budget).toBeNull();
    // budgetId NO se limpia porque setBudget(null) sin id no lo resetea
    expect(store.getState().budgetId).toBe('id-123');
  });

  it('debería actualizar un item por ID (updateBudgetItem)', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 20, precioUnitario: 1200 });

    const budget = store.getState().budget!;
    const updated = budget.items.find((i: any) => i.id === 'item-1')!;
    expect(updated.cantidad).toBe(20);
    expect(updated.precioUnitario).toBe(1200);
    expect(updated.precioTotal).toBe(24000); // 20 * 1200
  });

  it('debería recalcular totales al actualizar item', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 20, precioUnitario: 1000 });

    const budget = store.getState().budget!;
    // item-1: 20 * 1000 = 20000, item-2: 5 * 500 = 2500 → subtotal = 22500
    expect(budget.totales.subtotal).toBe(22500);
    expect(budget.totales.impuestos).toBe(4725); // 22500 * 0.21
    expect(budget.totales.total).toBe(27225); // 22500 + 4725
  });

  it('debería actualizar parcialmente un item sin perder otros campos', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 15 });

    const budget = store.getState().budget!;
    const updated = budget.items.find((i: any) => i.id === 'item-1')!;
    expect(updated.cantidad).toBe(15);
    expect(updated.precioUnitario).toBe(1000); // no cambió
    expect(updated.titulo).toBe('Item 1'); // no cambió
  });

  it('no debería mutar si itemId no existe', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    const prev = store.getState().budget;
    store.getState().updateBudgetItem('item-inexistente', { cantidad: 99 });
    expect(store.getState().budget).toEqual(prev);
  });

  it('no debería hacer nada si budget es null en updateBudgetItem', () => {
    // budget es null (estado inicial), esto no debería tirar error
    expect(() => {
      store.getState().updateBudgetItem('item-1', { cantidad: 5 });
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería agregar un item con addBudgetItem', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().addBudgetItem('Pintura');

    const budget = store.getState().budget!;
    expect(budget.items).toHaveLength(3);
    const newItem = budget.items[2];
    expect(newItem.titulo).toBe('Nuevo trabajo');
    expect(newItem.cantidad).toBe(1);
    expect(newItem.precioUnitario).toBe(0);
    expect(newItem.precioTotal).toBe(0);
    expect(newItem.categoria).toBe('Pintura');
    expect(newItem.id).toBeDefined();
    expect(newItem.id.length).toBeGreaterThan(0);
  });

  it('debería generar IDs únicos para items nuevos', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().addBudgetItem('General');
    store.getState().addBudgetItem('General');

    const ids = store.getState().budget!.items.map((i: any) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length); // todos deben ser únicos
  });

  it('debería recalcular totales al agregar item', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().addBudgetItem('General'); // cantidad=1, precioUnitario=0 → no cambia subtotal

    const budget = store.getState().budget!;
    expect(budget.totales.subtotal).toBe(12500); // igual porque el item nuevo vale 0
  });

  it('debería usar categoría "General" cuando se pasa categoría vacía en addBudgetItem', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().addBudgetItem('');

    const newItem = store.getState().budget!.items[2];
    expect(newItem.categoria).toBe('General'); // fallbackea a 'General' por categoria || 'General'
  });

  it('no debería agregar item si budget es null', () => {
    expect(() => {
      store.getState().addBudgetItem('General');
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería eliminar un item por ID', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().deleteBudgetItem('item-1');
    expect(store.getState().budget!.items).toHaveLength(1);
    expect(store.getState().budget!.items[0].id).toBe('item-2');
  });

  it('debería recalcular totales al eliminar item', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().deleteBudgetItem('item-1');

    // Solo queda item-2: 5 * 500 = 2500
    const budget = store.getState().budget!;
    expect(budget.totales.subtotal).toBe(2500);
    expect(budget.totales.impuestos).toBe(525); // 2500 * 0.21
    expect(budget.totales.total).toBe(3025); // 2500 + 525
  });

  it('no debería mutar si se elimina ID inexistente', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    const prev = store.getState().budget;
    store.getState().deleteBudgetItem('id-inexistente');
    expect(store.getState().budget).toEqual(prev);
  });

  it('no debería hacer nada si budget es null en deleteBudgetItem', () => {
    expect(() => {
      store.getState().deleteBudgetItem('item-1');
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería actualizar datos generales del presupuesto', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetGeneral({
      titulo: 'Presupuesto Actualizado',
      descripcionGeneral: 'Nueva descripción',
    });
    const budget = store.getState().budget!;
    expect(budget.titulo).toBe('Presupuesto Actualizado');
    expect(budget.descripcionGeneral).toBe('Nueva descripción');
  });

  it('debería actualizar solo los campos generales enviados', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetGeneral({ titulo: 'Solo título' });
    const budget = store.getState().budget!;
    expect(budget.titulo).toBe('Solo título');
    expect(budget.descripcionGeneral).toBe('Trabajos de construcción general'); // no cambió
    expect(budget.categoria).toBe('Construcción'); // no cambió
  });

  it('no debería hacer nada si budget es null en updateBudgetGeneral', () => {
    expect(() => {
      store.getState().updateBudgetGeneral({ titulo: 'Test' });
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería actualizar datos del cliente', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetCliente({
      nombre: 'Nuevo Cliente',
      empresa: 'Nueva Empresa',
    });
    const budget = store.getState().budget!;
    expect(budget.cliente.nombre).toBe('Nuevo Cliente');
    expect(budget.cliente.empresa).toBe('Nueva Empresa');
  });

  it('debería actualizar solo campos de cliente enviados', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetCliente({ nombre: 'Solo Nombre' });
    const budget = store.getState().budget!;
    expect(budget.cliente.nombre).toBe('Solo Nombre');
    expect(budget.cliente.empresa).toBe('Empresa SA'); // no cambió
    expect(budget.cliente.email).toBe('cliente@test.com'); // no cambió
  });

  it('no debería hacer nada si budget es null en updateBudgetCliente', () => {
    expect(() => {
      store.getState().updateBudgetCliente({ nombre: 'Test' });
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería actualizar condiciones de pago', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetCondiciones({
      validezDias: 60,
      formaPago: 'Efectivo',
    });
    const budget = store.getState().budget!;
    expect(budget.condiciones.validezDias).toBe(60);
    expect(budget.condiciones.formaPago).toBe('Efectivo');
  });

  it('debería actualizar solo condiciones enviadas', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetCondiciones({ validezDias: 45 });
    const budget = store.getState().budget!;
    expect(budget.condiciones.validezDias).toBe(45);
    expect(budget.condiciones.formaPago).toBe('Transferencia'); // no cambió
    expect(budget.condiciones.plazoDias).toBe(15); // no cambió
  });

  it('no debería hacer nada si budget es null en updateBudgetCondiciones', () => {
    expect(() => {
      store.getState().updateBudgetCondiciones({ validezDias: 30 });
    }).not.toThrow();
    expect(store.getState().budget).toBeNull();
  });

  it('debería recalcular totales después de múltiples operaciones', () => {
    store.getState().setBudget(MOCK_BUDGET as any);

    // Agregar un item con valor
    store.getState().addBudgetItem('Nueva categoría');
    // El item agregado tiene cantidad=1, precioUnitario=0 → no cambia subtotal
    expect(store.getState().budget!.totales.subtotal).toBe(12500);

    // Actualizar el item nuevo con precio
    const items = store.getState().budget!.items;
    const newId = items[items.length - 1].id;
    store.getState().updateBudgetItem(newId, { cantidad: 3, precioUnitario: 2000 });

    // item-1: 10 * 1000 = 10000, item-2: 5 * 500 = 2500, new: 3 * 2000 = 6000
    expect(store.getState().budget!.totales.subtotal).toBe(18500);
    expect(store.getState().budget!.totales.impuestos).toBe(3885); // 18500 * 0.21
    expect(store.getState().budget!.totales.total).toBe(22385);

    // Eliminar item-1
    store.getState().deleteBudgetItem('item-1');
    // item-2: 2500, new: 6000 = 8500
    expect(store.getState().budget!.totales.subtotal).toBe(8500);
  });

  it('debería mantener el budget si no se pasa id en setBudget', () => {
    store.getState().setBudget(MOCK_BUDGET as any, 'existing-id');
    store.getState().setBudget({ ...MOCK_BUDGET, titulo: 'Actualizado' } as any);
    const state = store.getState();
    expect(state.budget!.titulo).toBe('Actualizado');
    expect(state.budgetId).toBe('existing-id'); // no se pierde el id anterior
  });

  it('debería actualizar budgetId si se pasa nuevo id en setBudget', () => {
    store.getState().setBudget(MOCK_BUDGET as any, 'old-id');
    store.getState().setBudget(MOCK_BUDGET as any, 'new-id');
    expect(store.getState().budgetId).toBe('new-id');
  });

  // ===== Edge cases: valores negativos =====

  it('debería permitir actualizar item con cantidad negativa', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: -5 });

    const budget = store.getState().budget!;
    expect(budget.items[0].cantidad).toBe(-5);
    // precioTotal se recalcula: -5 * 1000 = -5000
    expect(budget.items[0].precioTotal).toBe(-5000);
    // subtotal: -5000 + 2500 = -2500
    expect(budget.totales.subtotal).toBe(-2500);
    expect(budget.totales.impuestos).toBe(-525); // -2500 * 0.21
    expect(budget.totales.total).toBe(-3025);
  });

  it('debería permitir actualizar item con precio unitario negativo', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { precioUnitario: -200 });

    const budget = store.getState().budget!;
    expect(budget.items[0].precioUnitario).toBe(-200);
    // precioTotal: 10 * -200 = -2000
    expect(budget.items[0].precioTotal).toBe(-2000);
    // subtotal: -2000 + 2500 = 500
    expect(budget.totales.subtotal).toBe(500);
  });

  it('debería permitir actualizar item con cantidad y precio ambos negativos', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: -3, precioUnitario: -1000 });

    const budget = store.getState().budget!;
    // -3 * -1000 = 3000 (positivo por doble negativo)
    expect(budget.items[0].precioTotal).toBe(3000);
    expect(budget.totales.subtotal).toBe(5500); // 3000 + 2500
  });

  it('debería manejar item donde cantidad es cero', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 0 });

    const budget = store.getState().budget!;
    expect(budget.items[0].cantidad).toBe(0);
    expect(budget.items[0].precioTotal).toBe(0); // 0 * 1000 = 0
    expect(budget.totales.subtotal).toBe(2500); // 0 + 2500
    expect(budget.totales.total).toBe(3025);
  });

  it('debería manejar item donde precio y cantidad son ambos cero', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 0, precioUnitario: 0 });

    const budget = store.getState().budget!;
    expect(budget.items[0].precioTotal).toBe(0);
    expect(budget.totales.subtotal).toBe(2500); // solo item-2
    expect(budget.totales.impuestos).toBe(525);
  });

  it('debería manejar item con precio total redondeado correctamente para cantidades decimales', () => {
    store.getState().setBudget(MOCK_BUDGET as any);
    store.getState().updateBudgetItem('item-1', { cantidad: 3.5, precioUnitario: 150.75 });

    const budget = store.getState().budget!;
    expect(budget.items[0].precioTotal).toBeCloseTo(527.625, 3);
    // subtotal: 527.625 + 2500 = 3027.625
    expect(budget.totales.subtotal).toBeCloseTo(3027.625, 3);
  });
});

// ==============================================
// EXPORT SLICE TESTS
// ==============================================

// ==============================================
// EXPORT SLICE TESTS
// ==============================================
describe('ExportSlice — estado de exportación', () => {
  let store: ReturnType<typeof createSliceStore<ExportSlice>>;

  beforeEach(() => {
    store = createSliceStore<ExportSlice>(
      (set) => createExportSlice(set),
      EXPORT_INITIAL_STATE
    );
  });

  it('debería inicializar con todos los estados de exportación en false y error en null', () => {
    const state = store.getState();
    expect(state.isExportingPDF).toBe(false);
    expect(state.isExportingDOCX).toBe(false);
    expect(state.isExportingHTML).toBe(false);
    expect(state.exportError).toBeNull();
  });

  it('debería alternar isExportingPDF', () => {
    store.getState().setIsExportingPDF(true);
    expect(store.getState().isExportingPDF).toBe(true);
    store.getState().setIsExportingPDF(false);
    expect(store.getState().isExportingPDF).toBe(false);
  });

  it('debería alternar isExportingDOCX', () => {
    store.getState().setIsExportingDOCX(true);
    expect(store.getState().isExportingDOCX).toBe(true);
    store.getState().setIsExportingDOCX(false);
    expect(store.getState().isExportingDOCX).toBe(false);
  });

  it('debería alternar isExportingHTML', () => {
    store.getState().setIsExportingHTML(true);
    expect(store.getState().isExportingHTML).toBe(true);
    store.getState().setIsExportingHTML(false);
    expect(store.getState().isExportingHTML).toBe(false);
  });

  it('debería manejar estados de exportación independientes', () => {
    // PDF se exporta, DOCX no, HTML no
    store.getState().setIsExportingPDF(true);
    expect(store.getState().isExportingPDF).toBe(true);
    expect(store.getState().isExportingDOCX).toBe(false);
    expect(store.getState().isExportingHTML).toBe(false);

    // Ahora DOCX también se exporta (paralelo)
    store.getState().setIsExportingDOCX(true);
    expect(store.getState().isExportingPDF).toBe(true);
    expect(store.getState().isExportingDOCX).toBe(true);

    // PDF termina
    store.getState().setIsExportingPDF(false);
    expect(store.getState().isExportingPDF).toBe(false);
    expect(store.getState().isExportingDOCX).toBe(true); // no afectado
  });

  it('debería setear exportError con un mensaje', () => {
    store.getState().setExportError('Error al exportar PDF');
    expect(store.getState().exportError).toBe('Error al exportar PDF');
  });

  it('debería limpiar exportError con null', () => {
    store.getState().setExportError('Error temporal');
    store.getState().setExportError(null);
    expect(store.getState().exportError).toBeNull();
  });

  it('debería manejar exportError con string vacío (diferente de null)', () => {
    store.getState().setExportError('');
    expect(store.getState().exportError).toBe(''); // string vacío, no null
    // Un string vacío es falsy, pero no es null
    expect(store.getState().exportError).not.toBeNull();
  });

  it('no debería afectar estados de exportación al setear exportError', () => {
    store.getState().setIsExportingPDF(true);
    store.getState().setExportError('Error durante exportación');
    const state = store.getState();
    expect(state.isExportingPDF).toBe(true); // no debería cambiar
    expect(state.exportError).toBe('Error durante exportación');
  });

  it('debería mantener exportError cuando se alternan formatos de exportación', () => {
    store.getState().setExportError('Error crítico');
    store.getState().setIsExportingHTML(true);
    expect(store.getState().exportError).toBe('Error crítico'); // no debería cambiar
  });

  it('debería alternar isExportingHTML de vuelta a false', () => {
    store.getState().setIsExportingHTML(true);
    store.getState().setIsExportingHTML(false);
    expect(store.getState().isExportingHTML).toBe(false);
  });

  it('debería soportar múltiples cambios en el mismo formato', () => {
    store.getState().setIsExportingPDF(true);
    store.getState().setIsExportingPDF(false);
    store.getState().setIsExportingPDF(true);
    expect(store.getState().isExportingPDF).toBe(true);
  });

  it('debería resetear todos los flags de exportación volviéndolos a false', () => {
    store.getState().setIsExportingPDF(true);
    store.getState().setIsExportingDOCX(true);
    store.getState().setIsExportingHTML(true);

    store.getState().setIsExportingPDF(false);
    store.getState().setIsExportingDOCX(false);
    store.getState().setIsExportingHTML(false);

    const state = store.getState();
    expect(state.isExportingPDF).toBe(false);
    expect(state.isExportingDOCX).toBe(false);
    expect(state.isExportingHTML).toBe(false);
  });
});

// ==============================================
// WIZARD SLICE TESTS
// ==============================================
describe('WizardSlice — navegación del wizard', () => {
  let store: ReturnType<typeof createSliceStore<WizardSlice>>;

  beforeEach(() => {
    store = createSliceStore<WizardSlice>(
      (set) => createWizardSlice(set),
      WIZARD_INITIAL_STATE
    );
  });

  it('debería inicializar en paso input', () => {
    expect(store.getState().currentStep).toBe('input');
  });

  it('debería navegar generando', () => {
    store.getState().setCurrentStep('generating');
    expect(store.getState().currentStep).toBe('generating');
  });

  it('debería navegar preview', () => {
    store.getState().setCurrentStep('preview');
    expect(store.getState().currentStep).toBe('preview');
  });

  it('debería navegar exported', () => {
    store.getState().setCurrentStep('exported');
    expect(store.getState().currentStep).toBe('exported');
  });

  it('debería navegar de vuelta a input', () => {
    store.getState().setCurrentStep('preview');
    store.getState().setCurrentStep('input');
    expect(store.getState().currentStep).toBe('input');
  });

  it('debería seguir la progresión completa del wizard', () => {
    const steps: Array<'input' | 'generating' | 'preview' | 'exported'> = [
      'input',
      'generating',
      'preview',
      'exported',
    ];

    for (const step of steps) {
      store.getState().setCurrentStep(step);
      expect(store.getState().currentStep).toBe(step);
    }
  });

  it('debería permitir saltos hacia adelante', () => {
    // De input directamente a exported (ej: carga de presupuesto existente)
    store.getState().setCurrentStep('exported');
    expect(store.getState().currentStep).toBe('exported');
  });

  it('debería permitir retroceder pasos', () => {
    store.getState().setCurrentStep('preview');
    store.getState().setCurrentStep('generating'); // retroceder
    expect(store.getState().currentStep).toBe('generating');
  });

  it('debería permitir volver a input desde cualquier paso', () => {
    // Desde generating
    store.getState().setCurrentStep('generating');
    store.getState().setCurrentStep('input');
    expect(store.getState().currentStep).toBe('input');

    // Desde preview
    store.getState().setCurrentStep('preview');
    store.getState().setCurrentStep('input');
    expect(store.getState().currentStep).toBe('input');

    // Desde exported
    store.getState().setCurrentStep('exported');
    store.getState().setCurrentStep('input');
    expect(store.getState().currentStep).toBe('input');
  });

  it('debería manejar múltiples cambios de paso consecutivos', () => {
    store.getState().setCurrentStep('input');
    store.getState().setCurrentStep('generating');
    store.getState().setCurrentStep('preview');
    store.getState().setCurrentStep('generating');
    store.getState().setCurrentStep('preview');
    store.getState().setCurrentStep('exported');
    expect(store.getState().currentStep).toBe('exported');
  });

  it('no debería tener estado adyacente (solo tiene currentStep)', () => {
    const state = store.getState();
    const keys = Object.keys(state).filter(k => k !== 'setCurrentStep');
    expect(keys).toEqual(['currentStep']);
  });
});
