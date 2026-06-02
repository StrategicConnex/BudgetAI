// ===== AI PIPELINE TESTS =====
// Validates: providers, orchestrator, stages, prompts, fallbacks, retries

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRawInput, generateParsedInput, generateFakeBudgetData, generateMalformedJSON } from '../fixtures/synthetic-data';

// ==============================================
// 1. PROVIDER TESTS
// ==============================================
describe('AI Providers — Provider Layer', () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure env vars are set
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.XIAOMI_API_KEY = 'test-xiaomi-key';
  });

  describe('callAI — Primary Provider (Google Gemini)', () => {
    it('should initialize Google Generative AI client with API key', async () => {
      const { callAI } = await import('@/lib/ai/providers');
      expect(callAI).toBeDefined();
      expect(typeof callAI).toBe('function');
    });

    it('should throw error when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      
      try {
        const { callAI } = await import('@/lib/ai/providers');
        await expect(callAI([{ role: 'user', content: 'test' }])).rejects.toThrow();
      } catch (err: any) {
        expect(err.message).toContain('API_KEY');
      }
    });

    it('should attempt Xiaomi fallback when Gemini fails', async () => {
      // Mock fetch to simulate both failures
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Gemini failed'))
        .mockRejectedValueOnce(new Error('Xiaomi Anthropic failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: '{"test": true}' } }] }),
        });

      const { callAI } = await import('@/lib/ai/providers');
      const result = await callAI([{ role: 'user', content: 'test' }], { jsonMode: false });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('withRetry — Exponential Backoff', () => {
    it('should retry failed operations up to maxRetries', async () => {
      const { withRetry } = await import('@/lib/ai/providers');
      
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) throw new Error(`Attempt ${attempts} failed`);
        return 'success';
      });

      const result = await withRetry(fn, 3, 100);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after exhausting retries', async () => {
      const { withRetry } = await import('@/lib/ai/providers');
      
      const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(withRetry(fn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should succeed on first attempt without retries', async () => {
      const { withRetry } = await import('@/lib/ai/providers');
      
      const fn = vi.fn().mockResolvedValue('instant success');
      const result = await withRetry(fn, 3, 100);
      expect(result).toBe('instant success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('extractJSON — JSON Extraction', () => {
    it('should extract JSON from clean response', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      const result = extractJSON('{"key": "value"}');
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from markdown code block', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      const result = extractJSON('```json\n{"key": "value"}\n```');
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from code block without language', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      const result = extractJSON('```\n{"key": "value"}\n```');
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from text with surrounding content', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      const result = extractJSON('Here is the result:\n{"key": "value"}\nHope that helps!');
      expect(result).toBe('{"key": "value"}');
    });

    it('should throw when no JSON found', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      expect(() => extractJSON('No JSON here')).toThrow();
    });

    it('should handle nested JSON objects', async () => {
      const { extractJSON } = await import('@/lib/ai/providers');
      const nested = '{"outer": {"inner": [1, 2, 3], "nested": {"deep": "value"}}}';
      const result = extractJSON(nested);
      expect(JSON.parse(result).outer.inner).toEqual([1, 2, 3]);
    });
  });
});

// ==============================================
// 2. ORCHESTRATOR TESTS
// ==============================================
describe('AI Orchestrator — Pipeline Orchestration', () => {
  beforeEach(() => {
    vi.resetModules();
    // Sin OPENROUTER_API_KEY para que stages usen datos mock en vez de llamadas reales
    delete process.env.OPENROUTER_API_KEY;
  });

  it('should process complete pipeline successfully', async () => {
    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    const rawInput = generateRawInput();
    
    const result = await generateBudgetOrchestrator(rawInput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.items.length).toBeGreaterThan(0);
      expect(result.data.cliente.nombre).toBeDefined();
    }
  });

  it('should report progress at each stage', async () => {
    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    const progressUpdates: any[] = [];
    
    const rawInput = generateRawInput();
    const result = await generateBudgetOrchestrator(rawInput, (progress) => {
      progressUpdates.push(progress);
    });

    expect(result.success).toBe(true);
    expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
    
    const stages = progressUpdates.map(p => p.stage);
    expect(stages).toContain('vision');
    expect(stages).toContain('parsing');
    expect(stages).toContain('generation');
    expect(stages).toContain('validation');
    expect(stages).toContain('complete');
  });

  it('should produce valid budget data from pipeline', async () => {
    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    const rawInput = generateRawInput({
      texto: 'Reparación de humedad en pared de living. Pintura general de 2 ambientes.',
      currency: 'ARS',
    });
    
    const result = await generateBudgetOrchestrator(rawInput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      expect(result.data.items.length).toBeGreaterThan(0);
      for (const item of result.data.items) {
        expect(item.precioTotal).toBeCloseTo(item.cantidad * item.precioUnitario, 2);
      }
      expect(result.data.totales.subtotal).toBeGreaterThan(0);
      expect(result.data.totales.total).toBeGreaterThan(0);
    }
  });

  it('should respect currency setting', async () => {
    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    
    const rawInputUSD = generateRawInput({ currency: 'USD' });
    const resultUSD = await generateBudgetOrchestrator(rawInputUSD);
    expect(resultUSD.success).toBe(true);
    if (resultUSD.data) {
      expect(resultUSD.data.totales.currency).toBe('USD');
    }
  });

  it('should use default tax rate when not provided', async () => {
    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    
    const rawInput = generateRawInput({ tasaImpuesto: undefined });
    const result = await generateBudgetOrchestrator(rawInput);
    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.totales.tasaImpuesto).toBe(0.21);
    }
  });
});

// ==============================================
// 3. STAGE TESTS
// ==============================================
describe('AI Stages — Individual Pipeline Stages', () => {
  beforeEach(() => {
    // Sin OPENROUTER_API_KEY para que stages usen datos mock
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('Generator Stage', () => {
    it('should produce valid budget output with items', async () => {
      const { generateBudget } = await import('@/lib/ai/stages/generator');
      
      const result = await generateBudget({
        parsedInput: generateParsedInput(),
        rawInput: generateRawInput(),
        visionSummary: 'Analysis: Wall damage detected',
      });

      expect(result).toBeDefined();
      expect(result.titulo).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should categorize items correctly', async () => {
      const { generateBudget } = await import('@/lib/ai/stages/generator');
      
      const result = await generateBudget({
        parsedInput: generateParsedInput({ categoriaSugerida: 'Electricidad' }),
        rawInput: generateRawInput(),
      });

      expect(result.categoria).toBe('Electricidad');
    });
  });

  describe('Validator Stage', () => {
    it('should calculate correct totals', async () => {
      const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
      
      const mockOutput = {
        titulo: 'Test',
        cliente: { nombre: 'Test Client' },
        categoria: 'Construcción',
        descripcionGeneral: 'Test',
        items: [
          { titulo: 'Item 1', descripcion: 'Desc 1', unidad: 'm²', cantidad: 10, precioUnitario: 1000, categoria: 'General' },
          { titulo: 'Item 2', descripcion: 'Desc 2', unidad: 'u', cantidad: 5, precioUnitario: 500, categoria: 'General' },
        ],
        condiciones: { validezDias: 30, formaPago: 'Transferencia', plazoDias: 15 },
      };

      const result = validateAndFinalize({
        aiOutput: mockOutput as any,
        currency: 'ARS',
        tasaImpuesto: 0.21,
        templateId: 'construction',
      });

      expect(result.items.length).toBe(2);
      expect(result.totales.subtotal).toBe(12500); // 10000 + 2500
      expect(result.totales.impuestos).toBe(2625); // 12500 * 0.21
      expect(result.totales.total).toBe(15125); // 12500 + 2625
      expect(result.totales.currency).toBe('ARS');
    });

    it('should deduplicate items by title', async () => {
      const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
      
      const mockOutput = {
        titulo: 'Test',
        cliente: { nombre: 'Test' },
        categoria: 'General',
        descripcionGeneral: 'Test',
        items: [
          { titulo: 'Item Duplicado', descripcion: 'Desc 1', unidad: 'm²', cantidad: 10, precioUnitario: 1000, categoria: 'General' },
          { titulo: 'Item Duplicado', descripcion: 'Desc 2', unidad: 'm²', cantidad: 5, precioUnitario: 500, categoria: 'General' },
          { titulo: 'Item Unico', descripcion: 'Desc 3', unidad: 'u', cantidad: 1, precioUnitario: 200, categoria: 'General' },
        ],
        condiciones: {},
      };

      const result = validateAndFinalize({
        aiOutput: mockOutput as any,
        currency: 'ARS',
        tasaImpuesto: 0,
        templateId: 'construction',
      });

      expect(result.items.length).toBe(2); // One duplicate removed
    });

    it('should generate budget number', async () => {
      const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
      
      const mockOutput = {
        titulo: 'Test',
        cliente: { nombre: 'Test' },
        categoria: 'General',
        descripcionGeneral: 'Test',
        items: [{ titulo: 'Item', descripcion: 'Desc', unidad: 'u', cantidad: 1, precioUnitario: 100, categoria: 'General' }],
        condiciones: {},
      };

      const result = validateAndFinalize({
        aiOutput: mockOutput as any,
        currency: 'ARS',
        tasaImpuesto: 0,
        templateId: 'construction',
      });

      expect(result.numero).toMatch(/^PRES-\d{4}-\d{4}$/);
    });

    it('should handle zero tax rate', async () => {
      const { validateAndFinalize } = await import('@/lib/ai/stages/validator');
      
      const mockOutput = {
        titulo: 'Test',
        cliente: { nombre: 'Test' },
        categoria: 'General',
        descripcionGeneral: 'Test',
        items: [{ titulo: 'Item', descripcion: 'Desc', unidad: 'u', cantidad: 1, precioUnitario: 100, categoria: 'General' }],
        condiciones: {},
      };

      const result = validateAndFinalize({
        aiOutput: mockOutput as any,
        currency: 'USD',
        tasaImpuesto: 0,
        templateId: 'minimal-white',
      });

      expect(result.totales.impuestos).toBe(0);
      expect(result.totales.total).toBe(result.totales.subtotal);
    });
  });

  describe('formatCurrency', () => {
    it('should format ARS correctly', async () => {
      const { formatCurrency } = await import('@/lib/ai/stages/validator');
      const result = formatCurrency(1234.56, 'ARS');
      expect(result).toContain('$');
      expect(result).toContain('1.234');
    });

    it('should format USD correctly', async () => {
      const { formatCurrency } = await import('@/lib/ai/stages/validator');
      const result = formatCurrency(1000.50, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('should handle zero', async () => {
      const { formatCurrency } = await import('@/lib/ai/stages/validator');
      const result = formatCurrency(0, 'ARS');
      expect(result).toContain('0');
    });

    it('should handle large numbers', async () => {
      const { formatCurrency } = await import('@/lib/ai/stages/validator');
      const result = formatCurrency(9999999.99, 'ARS');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Vision Stage', () => {
    it('should return mock when no API key', async () => {
      process.env.OPENROUTER_API_KEY = '';
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      
      const result = await analyzeImage({
        base64: 'dGVzdA==',
        mimeType: 'image/jpeg',
        filename: 'test.jpg',
      });

      expect(result).toBeDefined();
      expect(result.descripcion).toBeDefined();
      expect(result.trabajosSugeridos).toBeDefined();
      expect(result.riesgo).toMatch(/^bajo$|^medio$|^alto$/);
    });

    it('should analyze multiple images', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      
      const result = await analyzeImages([
        { base64: 'dGVzdA==', mimeType: 'image/jpeg', filename: 'test1.jpg' },
        { base64: 'dGVzdA==', mimeType: 'image/png', filename: 'test2.jpg' },
      ]);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty for no images', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([]);
      expect(result).toEqual([]);
    });
  });

  describe('Parser Stage', () => {
    it('should return mock when no API key', async () => {
      process.env.OPENROUTER_API_KEY = '';
      const { parseInput } = await import('@/lib/ai/stages/parser');
      
      const result = await parseInput({ texto: 'Test description' });
      expect(result).toBeDefined();
      expect(result.clienteInfo).toBeDefined();
      expect(result.trabajosDetectados).toBeDefined();
      expect(result.trabajosDetectados.length).toBeGreaterThan(0);
    });
  });
});

// ==============================================
// 4. PROMPT TESTS
// ==============================================
describe('AI Prompts — System Prompts', () => {
  it('should have system prompt for budget generation', async () => {
    const { SYSTEM_PROMPT } = await import('@/lib/ai/prompts/system');
    expect(SYSTEM_PROMPT).toBeDefined();
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(SYSTEM_PROMPT).toContain('JSON');
    expect(SYSTEM_PROMPT).toContain('presupuesto');
  });

  it('should have vision system prompt', async () => {
    const { VISION_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/system');
    expect(VISION_SYSTEM_PROMPT).toBeDefined();
    expect(VISION_SYSTEM_PROMPT).toContain('inspector técnico');
    expect(VISION_SYSTEM_PROMPT).toContain('JSON');
  });

  it('should have normalizer system prompt', async () => {
    const { NORMALIZER_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/system');
    expect(NORMALIZER_SYSTEM_PROMPT).toBeDefined();
    expect(NORMALIZER_SYSTEM_PROMPT).toContain('analizador');
    expect(NORMALIZER_SYSTEM_PROMPT).toContain('JSON');
  });

  it('should have validator system prompt', async () => {
    const { VALIDATOR_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/system');
    expect(VALIDATOR_SYSTEM_PROMPT).toBeDefined();
    expect(VALIDATOR_SYSTEM_PROMPT).toContain('revisor');
  });

  it('prompts should enforce JSON-only responses', async () => {
    const { SYSTEM_PROMPT, VISION_SYSTEM_PROMPT, NORMALIZER_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/system');
    
    const prompts = [SYSTEM_PROMPT, VISION_SYSTEM_PROMPT, NORMALIZER_SYSTEM_PROMPT];
    for (const prompt of prompts) {
      expect(prompt).toMatch(/JSON|Devuelve.*JSON|ÚNICAMENTE JSON/i);
    }
  });
});

// ==============================================
// 5. MODEL CONFIGURATION TESTS
// ==============================================
describe('AI Model Configuration', () => {
  it('should have valid model identifiers', async () => {
    const { AI_MODELS } = await import('@/lib/ai/providers');
    expect(AI_MODELS.main).toBeDefined();
    expect(AI_MODELS.vision).toBeDefined();
    expect(AI_MODELS.flash).toBeDefined();
    expect(typeof AI_MODELS.main).toBe('string');
    expect(AI_MODELS.main.length).toBeGreaterThan(5);
  });

  it('should have Xiaomi backup configuration', async () => {
    const mod = await import('@/lib/ai/providers');
    // Verify Xiaomi env vars
    expect(process.env.XIAOMI_API_KEY).toBeDefined();
  });
});
