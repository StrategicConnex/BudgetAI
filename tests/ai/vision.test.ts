// ===== VISION STAGE UNIT TESTS =====
// Tests: analyzeImage, analyzeImages, buildVisionSummary
// Mock path (no OPENROUTER_API_KEY) + AI path (mocked providers)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VisionAnalysis, ImageInput } from '@/types/budget';

const sampleImage: ImageInput = {
  base64: 'dGVzdA==',
  mimeType: 'image/jpeg',
  filename: 'test.jpg',
};

const validAIResponse: VisionAnalysis = {
  descripcion: 'Pared con humedad ascendente en sector inferior',
  elementos: ['pared', 'zocalo', 'revoque'],
  condicion: 'con humedad y deterioro superficial',
  trabajosSugeridos: ['Impermeabilizacion de muro', 'Revoque grueso', 'Pintura impermeabilizante'],
  materiales: ['cemento hidrofugo', 'arena', 'pintura impermeabilizante', 'malla'],
  riesgo: 'medio',
};

// Mock refs at module level (same pattern as orchestrator-errors.test.ts)
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
describe('Vision Stage -- Mock Path (no API key)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('analyzeImage', () => {
    it('should return VISION_MOCK when no OPENROUTER_API_KEY', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImage(sampleImage);

      expect(result).toBeDefined();
      expect(result.descripcion).toBeDefined();
      expect(typeof result.descripcion).toBe('string');
      expect(result.descripcion.length).toBeGreaterThan(0);
    });

    it('should return mock with all expected fields', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImage(sampleImage);

      const requiredKeys: (keyof VisionAnalysis)[] = [
        'descripcion',
        'elementos',
        'condicion',
        'trabajosSugeridos',
        'materiales',
        'riesgo',
      ];
      for (const key of requiredKeys) {
        expect(result).toHaveProperty(key);
      }

      expect(Array.isArray(result.elementos)).toBe(true);
      expect(result.elementos.length).toBeGreaterThan(0);
      expect(Array.isArray(result.trabajosSugeridos)).toBe(true);
      expect(result.trabajosSugeridos.length).toBeGreaterThan(0);
      expect(Array.isArray(result.materiales)).toBe(true);
      expect(result.materiales.length).toBeGreaterThan(0);
    });

    it('should return riesgo as one of bajo/medio/alto', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImage(sampleImage);

      expect(['bajo', 'medio', 'alto']).toContain(result.riesgo);
    });

    it('should handle different image MIME types', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      for (const mimeType of mimeTypes) {
        const result = await analyzeImage({ ...sampleImage, mimeType });
        expect(result).toBeDefined();
        expect(result.descripcion.length).toBeGreaterThan(0);
      }
    });

    it('should handle image without filename', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImage({ base64: 'dGVzdA==', mimeType: 'image/png', filename: '' });
      expect(result).toBeDefined();
      expect(result.descripcion).toBeDefined();
    });
  });

  describe('analyzeImages', () => {
    it('should return empty array for no images', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([]);
      expect(result).toEqual([]);
    });

    it('should return analyses for multiple images', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const images = [
        { base64: 'dGVzdDE=', mimeType: 'image/jpeg', filename: 'img1.jpg' },
        { base64: 'dGVzdDI=', mimeType: 'image/png', filename: 'img2.png' },
      ];
      const result = await analyzeImages(images);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      for (const analysis of result) {
        expect(analysis.descripcion).toBeDefined();
        expect(analysis.trabajosSugeridos.length).toBeGreaterThan(0);
      }
    });

    it('should handle single image', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([sampleImage]);
      expect(result.length).toBe(1);
      expect(result[0].riesgo).toMatch(/^bajo$|^medio$|^alto$/);
    });
  });
});
// ==============================================
// 2. AI PATH TESTS (con OPENROUTER_API_KEY + providers mock)
// ==============================================
describe('Vision Stage -- AI Path (mocked providers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    mockCallAI.mockResolvedValue(JSON.stringify(validAIResponse));
    mockExtractJSON.mockImplementation((text: string) => text);
    mockWithRetry.mockImplementation((fn: () => Promise<any>) => fn());
  });

  describe('analyzeImage -- AI calls', () => {
    it('should call AI provider with correct parameters', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await analyzeImage(sampleImage);

      expect(mockCallAI).toHaveBeenCalledTimes(1);
      const [messages, options] = mockCallAI.mock.calls[0];
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBeInstanceOf(Array);
      expect(messages[0].content[0].type).toBe('image_url');
      expect(messages[0].content[0].image_url.url).toContain('data:image/jpeg;base64,');
      expect(options.model).toBe('test-vision');
      expect(options.temperature).toBe(0.1);
      expect(options.jsonMode).toBe(true);
    });

    it('should return parsed VisionAnalysis from AI response', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImage(sampleImage);

      expect(result.descripcion).toBe(validAIResponse.descripcion);
      expect(result.condicion).toBe(validAIResponse.condicion);
      expect(result.riesgo).toBe(validAIResponse.riesgo);
      expect(result.elementos).toEqual(validAIResponse.elementos);
      expect(result.trabajosSugeridos).toEqual(validAIResponse.trabajosSugeridos);
      expect(result.materiales).toEqual(validAIResponse.materiales);
    });

    it('should throw when AI response is missing descripcion', async () => {
      const incomplete = { ...validAIResponse, descripcion: '' };
      mockCallAI.mockResolvedValue(JSON.stringify(incomplete));

      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await expect(analyzeImage(sampleImage)).rejects.toThrow('Respuesta de visi\u00f3n incompleta');
    });

    it('should throw when AI response has undefined trabajosSugeridos', async () => {
      const { trabajosSugeridos, ...incomplete } = validAIResponse;
      mockCallAI.mockResolvedValue(JSON.stringify(incomplete));

      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await expect(analyzeImage(sampleImage)).rejects.toThrow('Respuesta de visi\u00f3n incompleta');
    });

    it('should NOT throw when trabajosSugeridos is empty array (truthy)', async () => {
      const empty = { ...validAIResponse, trabajosSugeridos: [] };
      mockCallAI.mockResolvedValue(JSON.stringify(empty));

      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await expect(analyzeImage(sampleImage)).resolves.toBeDefined();
    });

    it('should call extractJSON on AI response', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await analyzeImage(sampleImage);

      expect(mockExtractJSON).toHaveBeenCalled();
    });

    it('should pass VISION_SYSTEM_PROMPT in the message text', async () => {
      const { analyzeImage } = await import('@/lib/ai/stages/vision');
      await analyzeImage(sampleImage);

      const textContent = mockCallAI.mock.calls[0][0][0].content[1].text;
      expect(textContent).toContain('inspector t\u00e9cnico');
      expect(textContent).toContain('Analiza esta imagen');
    });
  });

  describe('analyzeImages -- with AI calls', () => {
    it('should return results from multiple AI calls', async () => {
      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([sampleImage, { ...sampleImage, filename: 'img2.jpg' }]);

      expect(result.length).toBe(2);
      expect(mockCallAI).toHaveBeenCalledTimes(2);
    });

    it('should filter out failed analyses', async () => {
      mockCallAI
        .mockResolvedValueOnce(JSON.stringify(validAIResponse))
        .mockRejectedValueOnce(new Error('Vision API error'));

      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([
        sampleImage,
        { ...sampleImage, base64: 'bad-data', filename: 'bad.jpg' },
      ]);

      expect(result.length).toBe(1);
      expect(result[0].descripcion).toBe(validAIResponse.descripcion);
    });

    it('should return empty array when all analyses fail', async () => {
      mockCallAI.mockRejectedValue(new Error('API unavailable'));

      const { analyzeImages } = await import('@/lib/ai/stages/vision');
      const result = await analyzeImages([sampleImage, { ...sampleImage, filename: 'img2.jpg' }]);

      expect(result).toEqual([]);
    });
  });
});
// ==============================================
// 3. buildVisionSummary TESTS
// ==============================================
describe('buildVisionSummary', () => {
  const analysis1: VisionAnalysis = {
    descripcion: 'Pared con humedad',
    elementos: ['pared'],
    condicion: 'deteriorado',
    trabajosSugeridos: ['Impermeabilizacion', 'Revoque'],
    materiales: ['cemento', 'arena'],
    riesgo: 'medio',
  };

  const analysis2: VisionAnalysis = {
    descripcion: 'Grieta en cielorraso',
    elementos: ['cielorraso'],
    condicion: 'danado',
    trabajosSugeridos: ['Revoque', 'Pintura'],
    materiales: ['yeso', 'arena'],
    riesgo: 'alto',
  };

  it('should return empty string for empty array', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([]);
    expect(result).toBe('');
  });

  it('should include image count in summary', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1]);
    expect(result).toContain('1 imagen');
  });

  it('should use plural imagenes for multiple images', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1, analysis2]);
    expect(result).toContain('2 imagenes');
  });

  it('should include all fields for each analysis', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1]);

    expect(result).toContain(analysis1.descripcion);
    expect(result).toContain(analysis1.condicion);
    expect(result).toContain(analysis1.riesgo);
    for (const el of analysis1.elementos) {
      expect(result).toContain(el);
    }
  });

  it('should deduplicate trabajosSugeridos across multiple analyses', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1, analysis2]);

    const trabajosSection = result.split('TRABAJOS SUGERIDOS')[1]?.split('MATERIALES')[0] || '';
    const revoqueMatches = trabajosSection.match(/- Revoque/g);
    expect(revoqueMatches).toHaveLength(1);
  });

  it('should deduplicate materiales across multiple analyses', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1, analysis2]);

    const materialesSection = result.split('MATERIALES POSIBLES')[1] || '';
    const arenaMatches = materialesSection.match(/- arena/g);
    expect(arenaMatches).toHaveLength(1);
  });

  it('should include trabajos and materiales sections headers', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1]);

    expect(result).toContain('TRABAJOS SUGERIDOS');
    expect(result).toContain('MATERIALES POSIBLES');
    expect(result).toContain('AN\u00c1LISIS DE IM\u00c1GENES');
  });

  it('should handle analysis with empty trabajosSugeridos', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const emptyTrabajos: VisionAnalysis = { ...analysis1, trabajosSugeridos: [] };
    const result = buildVisionSummary([emptyTrabajos]);

    expect(result).toBeDefined();
    expect(result).toContain('TRABAJOS SUGERIDOS');
  });

  it('should handle analysis with empty materiales', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const emptyMateriales: VisionAnalysis = { ...analysis1, materiales: [] };
    const result = buildVisionSummary([emptyMateriales]);

    expect(result).toBeDefined();
    expect(result).toContain('MATERIALES POSIBLES');
  });

  it('should format each image with numbered label', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1, analysis2]);

    expect(result).toContain('Imagen 1:');
    expect(result).toContain('Imagen 2:');
  });

  it('should not include extra image labels for single image', async () => {
    const { buildVisionSummary } = await import('@/lib/ai/stages/vision');
    const result = buildVisionSummary([analysis1]);

    expect(result).toContain('Imagen 1:');
    expect(result).not.toContain('Imagen 2:');
  });
});
