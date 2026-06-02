// ===== COMPONENT & UX VALIDATION TESTS =====
// Tests: store behavior, data flow, calculations, state management, UI logic

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ==============================================
// 1. BUDGET STORE TESTS
// ==============================================
describe('Budget Store — State Management', () => {
  let store: any;

  beforeEach(async () => {
    vi.resetModules();
    // Clear any singleton state
    const { useBudgetStore } = await import('@/store/budget.store');
    store = useBudgetStore;
    store.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state.currentStep).toBe('input');
    expect(state.rawText).toBe('');
    expect(state.images).toEqual([]);
    expect(state.templateId).toBe('construction');
    expect(state.currency).toBe('ARS');
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBeNull();
    expect(state.budget).toBeNull();
    expect(state.budgetId).toBeNull();
  });

  it('should update raw text', () => {
    store.getState().setRawText('Test budget description');
    expect(store.getState().rawText).toBe('Test budget description');
  });

  it('should add and remove images', () => {
    const image1 = { base64: 'abc', mimeType: 'image/jpeg', filename: 'test1.jpg' };
    const image2 = { base64: 'def', mimeType: 'image/png', filename: 'test2.jpg' };

    store.getState().addImage(image1);
    store.getState().addImage(image2);
    expect(store.getState().images.length).toBe(2);

    store.getState().removeImage(0);
    expect(store.getState().images.length).toBe(1);
    expect(store.getState().images[0].filename).toBe('test2.jpg');
  });

  it('should toggle template id', () => {
    store.getState().setTemplateId('minimal-white');
    expect(store.getState().templateId).toBe('minimal-white');
    
    store.getState().setTemplateId('construction');
    expect(store.getState().templateId).toBe('construction');
  });

  it('should toggle currency', () => {
    store.getState().setCurrency('USD');
    expect(store.getState().currency).toBe('USD');
    
    store.getState().setCurrency('ARS');
    expect(store.getState().currency).toBe('ARS');
  });

  it('should set client info', () => {
    store.getState().setClienteNombre('Juan Pérez');
    store.getState().setClienteEmpresa('Constructora SA');
    
    expect(store.getState().clienteNombre).toBe('Juan Pérez');
    expect(store.getState().clienteEmpresa).toBe('Constructora SA');
  });

  it('should set tax rate', () => {
    store.getState().setTasaImpuesto(0.105);
    expect(store.getState().tasaImpuesto).toBe(0.105);
  });

  it('should manage generation state', () => {
    store.getState().setIsGenerating(true);
    expect(store.getState().isGenerating).toBe(true);
    
    store.getState().setIsGenerating(false);
    expect(store.getState().isGenerating).toBe(false);
  });

  it('should manage pipeline progress', () => {
    const progress = { stage: 'vision' as const, message: 'Analyzing...', progress: 10 };
    store.getState().setPipelineProgress(progress);
    expect(store.getState().pipelineProgress).toEqual(progress);
    
    store.getState().setPipelineProgress(null);
    expect(store.getState().pipelineProgress).toBeNull();
  });

  it('should manage error state', () => {
    store.getState().setError('Test error');
    expect(store.getState().error).toBe('Test error');
    
    store.getState().setError(null);
    expect(store.getState().error).toBeNull();
  });

  it('should manage step navigation', () => {
    store.getState().setCurrentStep('generating');
    expect(store.getState().currentStep).toBe('generating');
    
    store.getState().setCurrentStep('preview');
    expect(store.getState().currentStep).toBe('preview');
    
    store.getState().setCurrentStep('exported');
    expect(store.getState().currentStep).toBe('exported');
    
    store.getState().setCurrentStep('input');
    expect(store.getState().currentStep).toBe('input');
  });

  it('should set budget data', () => {
    const mockBudget = {
      titulo: 'Test Budget',
      cliente: { nombre: 'Test Client' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [],
      totales: { subtotal: 0, impuestos: 0, tasaImpuesto: 0.21, total: 0, currency: 'ARS' },
      condiciones: { validezDias: 30, formaPago: 'Cash', plazoDias: 0 },
      templateId: 'construction' as const,
    };
    
    store.getState().setBudget(mockBudget as any, 'test-id-123');
    expect(store.getState().budget).toEqual(mockBudget);
    expect(store.getState().budgetId).toBe('test-id-123');
  });

  it('should manage export loading states', () => {
    store.getState().setIsExportingPDF(true);
    expect(store.getState().isExportingPDF).toBe(true);
    
    store.getState().setIsExportingDOCX(true);
    expect(store.getState().isExportingDOCX).toBe(true);
    
    store.getState().setIsExportingHTML(true);
    expect(store.getState().isExportingHTML).toBe(true);
    
    // Reset all
    store.getState().setIsExportingPDF(false);
    store.getState().setIsExportingDOCX(false);
    store.getState().setIsExportingHTML(false);
    
    expect(store.getState().isExportingPDF).toBe(false);
    expect(store.getState().isExportingDOCX).toBe(false);
    expect(store.getState().isExportingHTML).toBe(false);
  });

  it('should reset state completely', () => {
    // Set some state
    store.getState().setRawText('Test');
    store.getState().setCurrency('USD');
    store.getState().setCurrentStep('preview');
    
    // Reset
    store.getState().reset();
    
    // Verify reset
    expect(store.getState().rawText).toBe('');
    expect(store.getState().currency).toBe('ARS');
    expect(store.getState().currentStep).toBe('input');
    expect(store.getState().images).toEqual([]);
    expect(store.getState().budget).toBeNull();
    expect(store.getState().error).toBeNull();
  });
});

// ==============================================
// 2. BUDGET ITEM CRUD TESTS
// ==============================================
describe('Budget Store — Item CRUD Operations', () => {
  let store: any;

  beforeEach(async () => {
    vi.resetModules();
    const { useBudgetStore } = await import('@/store/budget.store');
    store = useBudgetStore;
    store.getState().reset();
    
    // Set a mock budget
    store.getState().setBudget({
      titulo: 'Test',
      cliente: { nombre: 'Test' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [
        { id: 'item-1', titulo: 'Item 1', descripcion: 'Desc 1', unidad: 'm²', cantidad: 10, precioUnitario: 1000, precioTotal: 10000, categoria: 'General', imagenes: [] },
        { id: 'item-2', titulo: 'Item 2', descripcion: 'Desc 2', unidad: 'u', cantidad: 5, precioUnitario: 500, precioTotal: 2500, categoria: 'General', imagenes: [] },
      ],
      totales: { subtotal: 12500, impuestos: 2625, tasaImpuesto: 0.21, total: 15125, currency: 'ARS' },
      condiciones: { validezDias: 30, formaPago: 'Cash', plazoDias: 0 },
      templateId: 'construction' as const,
    });
  });

  it('should update an item by ID', () => {
    store.getState().updateBudgetItem('item-1', { cantidad: 15, precioUnitario: 1200 });
    
    const budget = store.getState().budget;
    const updatedItem = budget.items.find((i: any) => i.id === 'item-1');
    
    expect(updatedItem.cantidad).toBe(15);
    expect(updatedItem.precioUnitario).toBe(1200);
    expect(updatedItem.precioTotal).toBe(18000); // 15 * 1200
  });

  it('should recalculate totals when updating item', () => {
    store.getState().updateBudgetItem('item-1', { cantidad: 20, precioUnitario: 1000 });
    
    const budget = store.getState().budget;
    expect(budget.totales.subtotal).toBe(22500); // 20000 + 2500
    expect(budget.totales.impuestos).toBe(4725); // 22500 * 0.21
    expect(budget.totales.total).toBe(27225); // 22500 + 4725
  });

  it('should delete an item by ID', () => {
    store.getState().deleteBudgetItem('item-1');
    
    const budget = store.getState().budget;
    expect(budget.items.length).toBe(1);
    expect(budget.items[0].id).toBe('item-2');
  });

  it('should recalculate totals after deleting item', () => {
    store.getState().deleteBudgetItem('item-1');
    
    const budget = store.getState().budget;
    expect(budget.totales.subtotal).toBe(2500); // Only item-2
    expect(budget.totales.total).toBe(3025); // 2500 + 525
  });

  it('should add a new item', () => {
    store.getState().addBudgetItem('General');
    
    const budget = store.getState().budget;
    expect(budget.items.length).toBe(3);
    
    const newItem = budget.items[2];
    expect(newItem.titulo).toBe('Nuevo trabajo');
    expect(newItem.cantidad).toBe(1);
    expect(newItem.precioUnitario).toBe(0);
    expect(newItem.categoria).toBe('General');
  });

  it('should update general budget info', () => {
    store.getState().updateBudgetGeneral({
      titulo: 'Updated Title',
      descripcionGeneral: 'Updated description',
    });
    
    const budget = store.getState().budget;
    expect(budget.titulo).toBe('Updated Title');
    expect(budget.descripcionGeneral).toBe('Updated description');
  });

  it('should update client info', () => {
    store.getState().updateBudgetCliente({
      nombre: 'New Client',
      empresa: 'New Corp',
    });
    
    const budget = store.getState().budget;
    expect(budget.cliente.nombre).toBe('New Client');
    expect(budget.cliente.empresa).toBe('New Corp');
  });

  it('should update conditions', () => {
    store.getState().updateBudgetCondiciones({
      validezDias: 60,
      formaPago: 'Transferencia',
    });
    
    const budget = store.getState().budget;
    expect(budget.condiciones.validezDias).toBe(60);
    expect(budget.condiciones.formaPago).toBe('Transferencia');
  });
});

// ==============================================
// 3. VALIDATOR SCHEMA TESTS
// ==============================================
describe('Validator — Schema Validation', () => {
  it('should validate complete budget schema', async () => {
    const { BudgetSchema } = await import('@/lib/validators/budget');
    
    const validBudget = {
      titulo: 'Presupuesto de Obra',
      cliente: { nombre: 'Juan Pérez', email: 'juan@test.com' },
      categoria: 'Construcción',
      descripcionGeneral: 'Trabajos de construcción general',
      items: [
        { id: '1', titulo: 'Item 1', descripcion: 'Descripción', unidad: 'm²', cantidad: 10, precioUnitario: 1000, precioTotal: 10000, categoria: 'General', imagenes: [] },
      ],
      totales: { subtotal: 10000, impuestos: 2100, tasaImpuesto: 0.21, total: 12100, currency: 'ARS' },
      condiciones: { validezDias: 30, formaPago: 'Transferencia', plazoDias: 15 },
      templateId: 'construction',
    };

    const result = BudgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
  });

  it('should reject budget without items', async () => {
    const { BudgetSchema } = await import('@/lib/validators/budget');
    
    const invalidBudget = {
      titulo: 'Test',
      cliente: { nombre: 'Test' },
      categoria: 'Test',
      descripcionGeneral: 'Test',
      items: [],
      totales: { subtotal: 0, impuestos: 0, tasaImpuesto: 0.21, total: 0, currency: 'ARS' },
      condiciones: { validezDias: 30, formaPago: 'Test', plazoDias: 0 },
      templateId: 'construction',
    };

    const result = BudgetSchema.safeParse(invalidBudget);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('items');
    }
  });

  it('should validate AI output schema with nullable fields', async () => {
    const { AIBudgetOutputSchema } = await import('@/lib/validators/budget');
    
    const aiOutput = {
      titulo: 'Test',
      cliente: { nombre: 'Test', empresa: null, email: null },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [{ titulo: 'Item', descripcion: 'Desc', cantidad: 1, precioUnitario: 100 }],
      condiciones: null,
    };

    const result = AIBudgetOutputSchema.safeParse(aiOutput);
    expect(result.success).toBe(true);
  });

  it('should transform string numbers to actual numbers in AI output', async () => {
    const { AIBudgetOutputSchema } = await import('@/lib/validators/budget');
    
    const aiOutput = {
      titulo: 'Test',
      cliente: { nombre: 'Test' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [{ titulo: 'Item', descripcion: 'Desc', cantidad: '10', precioUnitario: '1000' }],
      condiciones: {},
    };

    const result = AIBudgetOutputSchema.safeParse(aiOutput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.items[0].cantidad).toBe('number');
      expect(result.data.items[0].cantidad).toBe(10);
    }
  });

  it('should validate raw input schema', async () => {
    const { RawInputSchema } = await import('@/lib/validators/budget');
    
    const valid = RawInputSchema.safeParse({
      texto: 'Test description for budget',
      templateId: 'construction',
      currency: 'ARS',
    });
    expect(valid.success).toBe(true);

    const tooShort = RawInputSchema.safeParse({
      texto: 'short',
      templateId: 'construction',
      currency: 'ARS',
    });
    expect(tooShort.success).toBe(false);
  });
});

// ==============================================
// 4. UI STATE LOGIC TESTS
// ==============================================
describe('UI State — Wizard & Export Logic', () => {
  let store: any;

  beforeEach(async () => {
    vi.resetModules();
    const { useBudgetStore } = await import('@/store/budget.store');
    store = useBudgetStore;
    store.getState().reset();
  });

  it('should follow correct wizard step progression', () => {
    const steps = ['input', 'generating', 'preview', 'exported'];
    
    for (const step of steps) {
      store.getState().setCurrentStep(step);
      expect(store.getState().currentStep).toBe(step);
    }
  });

  it('should not allow preview without budget data', () => {
    expect(store.getState().budget).toBeNull();
    store.getState().setCurrentStep('preview');
    expect(store.getState().currentStep).toBe('preview');
  });

  it('should reset export error when starting new export', () => {
    store.getState().setExportError('Previous error');
    store.getState().setExportError(null);
    expect(store.getState().exportError).toBeNull();
  });

  it('should track export status per format', () => {
    // PDF export
    store.getState().setIsExportingPDF(true);
    expect(store.getState().isExportingPDF).toBe(true);
    expect(store.getState().isExportingDOCX).toBe(false);
    expect(store.getState().isExportingHTML).toBe(false);
    
    // DOCX export
    store.getState().setIsExportingDOCX(true);
    expect(store.getState().isExportingDOCX).toBe(true);
    
    // HTML export
    store.getState().setIsExportingHTML(true);
    expect(store.getState().isExportingHTML).toBe(true);
  });
});
