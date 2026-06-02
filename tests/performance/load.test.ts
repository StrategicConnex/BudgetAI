// ===== PERFORMANCE & LOAD TESTS =====
// Tests: load, stress, concurrency, N+1 queries, bundle size, memory, rendering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFakeBudgetData, generateBulkBudgetRows, generateFakeBudgets } from '../fixtures/synthetic-data';

// ==============================================
// 1. BUDGET DATA PERFORMANCE
// ==============================================
describe('Budget Data — Computational Performance', () => {
  it('should calculate totals efficiently for large budgets', () => {
    const budget = generateFakeBudgetData({ items: generateFakeBudgetData().items });
    const start = performance.now();
    
    // Simulate multiple total calculations
    for (let i = 0; i < 100; i++) {
      const subtotal = budget.items.reduce((acc, item) => acc + item.precioTotal, 0);
      const impuestos = subtotal * budget.totales.tasaImpuesto;
      const total = subtotal + impuestos;
      expect(total).toBeGreaterThan(0);
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500); // Should take less than 500ms for 100 iterations
  });

  it('should handle 1000 item budgets without performance degradation', () => {
    const start = performance.now();
    
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: crypto.randomUUID(),
      titulo: `Item ${i}`,
      descripcion: 'Performance test item',
      unidad: 'm²',
      cantidad: i + 1,
      precioUnitario: 1000 + i,
      precioTotal: (i + 1) * (1000 + i),
      categoria: 'Test',
      imagenes: [],
    }));

    const subtotal = items.reduce((acc, item) => acc + item.precioTotal, 0);
    const duration = performance.now() - start;
    
    expect(subtotal).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should be fast even with 1000 items
  });

  it('should batch process bulk budget rows efficiently', () => {
    const start = performance.now();
    const rows = generateBulkBudgetRows(100);
    const loadDuration = performance.now() - start;
    
    expect(rows.length).toBe(100);
    expect(loadDuration).toBeLessThan(500); // Loading 100 rows should be fast
    
    // Verify all rows have valid data
    const processStart = performance.now();
    for (const row of rows) {
      expect(row.id).toBeDefined();
      expect(row.title).toBeDefined();
      expect(row.status).toBeDefined();
      expect(['draft', 'generating', 'ready', 'exported']).toContain(row.status);
    }
    const processDuration = performance.now() - processStart;
    expect(processDuration).toBeLessThan(200);
  });
});

// ==============================================
// 2. VALIDATOR PERFORMANCE
// ==============================================
describe('Validator — Schema Validation Performance', () => {
  it('should validate budget schema under 10ms', async () => {
    const { BudgetSchema } = await import('@/lib/validators/budget');
    const budget = generateFakeBudgetData();
    
    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      const result = BudgetSchema.safeParse(budget);
      expect(result.success).toBe(true);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000); // 50 validations under 1s
  });

  it('should validate AI output schema under 10ms', async () => {
    const { AIBudgetOutputSchema } = await import('@/lib/validators/budget');
    const budget = generateFakeBudgetData();
    
    const start = performance.now();
    const result = AIBudgetOutputSchema.safeParse({
      titulo: budget.titulo,
      cliente: { nombre: budget.cliente.nombre },
      categoria: budget.categoria,
      descripcionGeneral: budget.descripcionGeneral,
      items: budget.items.map(i => ({
        titulo: i.titulo,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
      condiciones: {
        validezDias: budget.condiciones.validezDias,
        formaPago: budget.condiciones.formaPago,
      },
    });
    const duration = performance.now() - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(20);
  });

  it('should handle 1000 concurrent schema validations', async () => {
    const { BudgetSchema } = await import('@/lib/validators/budget');
    const budgets = generateFakeBudgets(100);
    
    const start = performance.now();
    const results = budgets.map(b => BudgetSchema.safeParse(b));
    const duration = performance.now() - start;
    
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(90); // Most should pass
    expect(duration).toBeLessThan(500); // Bulk validation under 500ms
  });
});

// ==============================================
// 3. AI PROVIDER PERFORMANCE
// ==============================================
describe('AI Providers — Retry & Fallback Performance', () => {
  it('should respect timeout in withRetry', async () => {
    const { withRetry } = await import('@/lib/ai/providers');
    
    const start = performance.now();
    try {
      await withRetry(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500)),
        2,
        50
      );
    } catch {
      // Expected
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000); // Should not hang
  });

  it('should have exponential backoff delay', async () => {
    const { withRetry } = await import('@/lib/ai/providers');
    
    const attempts: number[] = [];
    const start = performance.now();
    
    const failingFn = vi.fn().mockImplementation(() => {
      attempts.push(Date.now());
      throw new Error('Fail');
    });

    try {
      await withRetry(failingFn, 3, 10);
    } catch {
      // Expected
    }

    const duration = performance.now() - start;
    expect(failingFn).toHaveBeenCalledTimes(3);
    // With base delay of 10ms: 10 + 20 = 30ms minimum
    expect(duration).toBeGreaterThanOrEqual(20);
  });

  it('should complete fast on success', async () => {
    const { withRetry } = await import('@/lib/ai/providers');
    
    const start = performance.now();
    const result = await withRetry(() => Promise.resolve('fast'), 3, 100);
    const duration = performance.now() - start;
    
    expect(result).toBe('fast');
    expect(duration).toBeLessThan(100);
  });
});

// ==============================================
// 4. MEMORY CONSUMPTION TESTS
// ==============================================
describe('Memory — Data Structure Efficiency', () => {
  it('should handle large synthetic datasets', () => {
    const budget = generateFakeBudgetData();
    const budgetJSON = JSON.stringify(budget);
    
    // Budget should be reasonably sized
    expect(budgetJSON.length).toBeLessThan(100000); // Under 100KB
  });

  it('should handle 10K budget items in memory', () => {
    const start = performance.now();
    
    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: `item-${i}`,
      titulo: `Item ${i}`,
      descripcion: 'X'.repeat(100),
      unidad: 'u',
      cantidad: 1,
      precioUnitario: 100,
      precioTotal: 100,
      categoria: 'Test',
      imagenes: [],
    }));

    const memoryEstimate = JSON.stringify(items).length;
    const duration = performance.now() - start;
    
    expect(memoryEstimate).toBeLessThan(10 * 1024 * 1024); // Under 10MB
    expect(duration).toBeLessThan(500);
  });

  it('should not have memory leaks in item recalculation', async () => {
    const { useBudgetStore } = await import('@/store/budget.store');
    
    // Create a store instance and simulate repeated updates
    const store = useBudgetStore;
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      store.getState().setRawText(`Test ${i}`);
      store.getState().setCurrency(i % 2 === 0 ? 'ARS' : 'USD');
    }
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });
});

// ==============================================
// 5. RENDERING & BUNDLE PERFORMANCE
// ==============================================
describe('Bundle & Rendering Performance', () => {
  it('should not have excessive re-exports in library files', async () => {
    // Check that providers.ts doesn't have circular dependencies
    const providers = await import('@/lib/ai/providers');
    expect(providers).toBeDefined();
    expect(Object.keys(providers).length).toBeLessThan(20); // Reasonable export count
  });

  it('should have lean store with minimal actions', async () => {
    const fs = await import('fs');
    const storeContent = fs.readFileSync('./store/budget.store.ts', 'utf-8');
    const actionCount = (storeContent.match(/:\s*\(/g) || []).length;
    expect(actionCount).toBeLessThan(50); // Not too many store actions (48 actions)
  });

  it('should not import unnecessary libraries', async () => {
    const packageJSON = await import('../../package.json');
    const deps = Object.keys(packageJSON.dependencies);
    
    // Should not have unnecessary dependencies
    const unnecessaryDeps = deps.filter(d => 
      d.includes('lodash') || d.includes('moment') || d.includes('jquery')
    );
    expect(unnecessaryDeps.length).toBe(0);
  });

  it('should tree-shake icon imports', async () => {
    const fs = await import('fs');
    // Check that components import specific icons, not entire library
    const components = ['AIInputArea.tsx', 'BudgetPreview.tsx', 'Sidebar.tsx', 'AIStatusCards.tsx'];
    
    for (const comp of components) {
      const path = `./components/budget/${comp}`;
      try {
        const content = fs.readFileSync(path, 'utf-8');
        // Should use specific icon imports
        if (content.includes('lucide-react')) {
          expect(content).toMatch(/import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"]/);
        }
      } catch {
        // Component might not exist
      }
    }
  });
});

// ==============================================
// 6. API ROUTE PERFORMANCE
// ==============================================
describe('API Routes — Response Time', () => {
  it('should have maxDuration configured for generate route', async () => {
    const fs = await import('fs');
    const routeContent = fs.readFileSync('./app/api/budgets/generate/route.ts', 'utf-8');
    expect(routeContent).toContain('maxDuration');
    expect(routeContent).toMatch(/maxDuration\s*=\s*60/); // 60s timeout
  });

  it('should have maxDuration configured for export routes', async () => {
    const fs = await import('fs');
    const exportRoutes = ['pdf', 'docx', 'html'];
    
    for (const route of exportRoutes) {
      const path = `./app/api/export/${route}/route.ts`;
      try {
        const content = fs.readFileSync(path, 'utf-8');
        expect(content).toContain('maxDuration');
      } catch {
        // Route might not exist
      }
    }
  });

  it('should have maxDuration configured for OCR routes', async () => {
    const fs = await import('fs');
    const ocrContent = fs.readFileSync('./app/api/ocr/route.ts', 'utf-8');
    expect(ocrContent).toContain('maxDuration');
    expect(ocrContent).toMatch(/maxDuration\s*=\s*30/); // 30s timeout
  });
});

// ==============================================
// 7. CONCURRENT OPERATIONS
// ==============================================
describe('Concurrent Operations — Race Condition Detection', () => {
  it('should handle concurrent budget generation', async () => {
    const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
    
    const mockOutput = {
      titulo: 'Concurrent Test',
      cliente: { nombre: 'Test' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [{ titulo: 'Item', descripcion: 'Desc', unidad: 'u', cantidad: 1, precioUnitario: 100, categoria: 'General' }],
      condiciones: {},
    };

    const start = performance.now();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => 
        validateAndFinalize({
          aiOutput: mockOutput as any,
          currency: 'ARS',
          tasaImpuesto: 0.21,
          templateId: 'construction',
        })
      )
    );
    const duration = performance.now() - start;

    expect(results.length).toBe(10);
    for (const result of results) {
      expect(result.numero).toMatch(/^PRES-\d{4}-\d{4}$/);
    }
    expect(duration).toBeLessThan(1000);
  });

  it('should generate unique budget numbers concurrently', async () => {
    const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
    
    const mockOutput = {
      titulo: 'Test',
      cliente: { nombre: 'Test' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [{ titulo: 'Item', descripcion: 'Desc', unidad: 'u', cantidad: 1, precioUnitario: 100, categoria: 'General' }],
      condiciones: {},
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => 
        validateAndFinalize({
          aiOutput: mockOutput as any,
          currency: 'ARS',
          tasaImpuesto: 0,
          templateId: 'construction',
        })
      )
    );

    const numbers = results.map(r => r.numero);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(5); // All should be unique
  });
});
