// ===== PARSER STAGE UNIT TESTS =====
// Tests: parseInput
// Mock path (no OPENROUTER_API_KEY) + AI path (mocked providers)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedInput } from '@/types/budget';

const sampleText = 'Hola, soy Juan Perez, necesito reparar humedad en pared y grietas en el techo de mi casa en Caballito.';

const validAIResponse: ParsedInput = {
  clienteInfo: { nombre: 'Juan Perez' },
  descripcionRaw: 'Reparacion de humedad en pared y grietas en cielorraso',
  trabajosDetectados: ['Reparacion de humedad', 'Sellado de grietas', 'Revoque fino', 'Pintura'],
  categoriaSugerida: 'Construccion',
};

// Mock refs at module level
const mockCallAI = vi.fn();
const mockWithRetry = vi.fn((fn: () => Promise<any>) => fn());
const mockExtractJSON = vi.fn((text: string) => text);

vi.mock('@/lib/ai/providers', () => ({
  callAI: mockCallAI,
  withRetry: mockWithRetry,
  extractJSON: mockExtractJSON,
  AI_MODELS: { main: 'test-model', vision: 'test-vision', flash: 'test-flash' },
}));

// ==============================================
// 1. MOCK PATH TESTS
// ==============================================
describe('Parser Stage -- Mock Path (no API key)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('parseInput', () => {
    it('should return PARSER_MOCK when no OPENROUTER_API_KEY', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result).toBeDefined();
      expect(result.clienteInfo).toBeDefined();
      expect(typeof result.clienteInfo!.nombre).toBe('string');
      expect(result.clienteInfo!.nombre!.length).toBeGreaterThan(0);
    });

    it('should return mock with all expected fields', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      const requiredKeys: (keyof ParsedInput)[] = [
        'clienteInfo',
        'descripcionRaw',
        'trabajosDetectados',
        'categoriaSugerida',
      ];
      for (const key of requiredKeys) {
        expect(result).toHaveProperty(key);
      }

      expect(Array.isArray(result.trabajosDetectados)).toBe(true);
      expect(result.trabajosDetectados.length).toBeGreaterThan(0);
      expect(typeof result.descripcionRaw).toBe('string');
      expect(result.descripcionRaw.length).toBeGreaterThan(0);
    });

    it('should not call AI providers', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      expect(mockCallAI).not.toHaveBeenCalled();
      expect(mockWithRetry).not.toHaveBeenCalled();
    });

    it('should return same mock regardless of input text', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result1 = await parseInput({ texto: sampleText });
      const result2 = await parseInput({ texto: 'Texto completamente diferente' });

      expect(result1.clienteInfo.nombre).toBe(result2.clienteInfo.nombre);
      expect(result1.descripcionRaw).toBe(result2.descripcionRaw);
    });

    it('should work without visionSummary', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result).toBeDefined();
      expect(result.categoriaSugerida).toBe('Construcci\u00f3n');
    });
  });
});

// ==============================================
// 2. AI PATH TESTS
// ==============================================
describe('Parser Stage -- AI Path (mocked providers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    mockCallAI.mockResolvedValue(JSON.stringify(validAIResponse));
    mockExtractJSON.mockImplementation((text: string) => text);
    mockWithRetry.mockImplementation((fn: () => Promise<any>) => fn());
  });

  describe('parseInput -- AI calls', () => {
    it('should call AI provider with correct parameters', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      expect(mockCallAI).toHaveBeenCalledTimes(1);
      const [messages, options] = mockCallAI.mock.calls[0];
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(typeof messages[1].content).toBe('string');
      expect(messages[1].content).toContain(sampleText);
      expect(options.model).toBe('test-flash');
      expect(options.temperature).toBe(0.1);
      expect(options.maxTokens).toBe(2048);
      expect(options.jsonMode).toBe(true);
    });

    it('should use NORMALIZER_SYSTEM_PROMPT as system message', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      const systemContent = mockCallAI.mock.calls[0][0][0].content;
      expect(systemContent).toContain('analizador de textos t\u00e9cnicos');
      expect(systemContent).toContain('JSON');
    });

    it('should return parsed ParsedInput from AI response', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result.clienteInfo.nombre).toBe(validAIResponse.clienteInfo.nombre);
      expect(result.descripcionRaw).toBe(validAIResponse.descripcionRaw);
      expect(result.categoriaSugerida).toBe(validAIResponse.categoriaSugerida);
      expect(result.trabajosDetectados).toEqual(validAIResponse.trabajosDetectados);
    });

    it('should include visionSummary in user prompt when provided', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      const visionSummary = 'Analisis de imagen: Pared con humedad';
      await parseInput({ texto: sampleText, visionSummary });

      const userContent = mockCallAI.mock.calls[0][0][1].content;
      expect(userContent).toContain('AN\u00c1LISIS DE IM\u00c1GENES');
      expect(userContent).toContain(visionSummary);
    });

    it('should not include vision section when visionSummary is empty', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText, visionSummary: '' });

      const userContent = mockCallAI.mock.calls[0][0][1].content;
      expect(userContent).not.toContain('AN\u00c1LISIS DE IM\u00c1GENES');
    });

    it('should not include vision section when visionSummary is undefined', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText, visionSummary: undefined });

      const userContent = mockCallAI.mock.calls[0][0][1].content;
      expect(userContent).not.toContain('AN\u00c1LISIS DE IM\u00c1GENES');
    });

    it('should call extractJSON on AI response', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      expect(mockExtractJSON).toHaveBeenCalled();
    });

    it('should call withRetry for resilience', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      expect(mockWithRetry).toHaveBeenCalled();
    });

    it('should handle AI response with null clienteInfo fields', async () => {
      const responseWithNulls: ParsedInput = {
        clienteInfo: { nombre: 'Test' },
        descripcionRaw: 'Test description',
        trabajosDetectados: ['Trabajo 1'],
        categoriaSugerida: 'General',
      };
      mockCallAI.mockResolvedValue(JSON.stringify(responseWithNulls));

      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result.clienteInfo.nombre).toBe('Test');
      expect(result.trabajosDetectados).toEqual(['Trabajo 1']);
    });

    it('should default trabajosDetectados to empty array when missing', async () => {
      const incomplete = {
        clienteInfo: { nombre: 'Test' },
        descripcionRaw: 'Test',
        categoriaSugerida: 'General',
      };
      mockCallAI.mockResolvedValue(JSON.stringify(incomplete));

      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result.trabajosDetectados).toEqual([]);
    });

    it('should default clienteInfo to empty object when missing', async () => {
      const incomplete = {
        descripcionRaw: 'Test',
        trabajosDetectados: ['Trabajo 1'],
        categoriaSugerida: 'General',
      };
      mockCallAI.mockResolvedValue(JSON.stringify(incomplete));

      const { parseInput } = await import('@/lib/ai/stages/parser');
      const result = await parseInput({ texto: sampleText });

      expect(result.clienteInfo).toEqual({});
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockCallAI.mockResolvedValue('invalid json');

      const { parseInput } = await import('@/lib/ai/stages/parser');
      await expect(parseInput({ texto: sampleText })).rejects.toThrow();
    });

    it('should pass texto in the user prompt', async () => {
      const { parseInput } = await import('@/lib/ai/stages/parser');
      await parseInput({ texto: sampleText });

      const userContent = mockCallAI.mock.calls[0][0][1].content;
      expect(userContent).toContain('TEXTO DEL CLIENTE');
      expect(userContent).toContain(sampleText);
    });
  });
});
