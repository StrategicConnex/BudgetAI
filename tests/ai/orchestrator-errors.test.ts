// ===== ORCHESTRATOR ERROR HANDLING =====
// Tests extracted from pipeline.test.ts to avoid module contamination
// from vi.mock() inside it(). Mocks are at file level here.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRawInput, generateFakeBudgetData } from '../fixtures/synthetic-data';

const mockAnalyzeImages = vi.fn();
const mockBuildVisionSummary = vi.fn().mockReturnValue('');
const mockGenerateBudget = vi.fn();

vi.mock('@/lib/ai/stages/vision', () => ({
  analyzeImages: mockAnalyzeImages,
  buildVisionSummary: mockBuildVisionSummary,
}));

vi.mock('@/lib/ai/stages/generator', () => ({
  generateBudget: mockGenerateBudget,
}));

describe('Orchestrator -- Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyzeImages.mockResolvedValue([]);
    mockGenerateBudget.mockResolvedValue(generateFakeBudgetData());
    // parseInput (real) usa OPENROUTER_API_KEY para decidir mock vs real. Lo borramos.
    delete process.env.OPENROUTER_API_KEY;
  });

  it('should handle vision stage failure gracefully', async () => {
    mockAnalyzeImages.mockRejectedValue(new Error('Vision API error'));

    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    const rawInput = generateRawInput({
      imagenes: [{ base64: 'test', mimeType: 'image/jpeg', filename: 'test.jpg' }],
    });

    const result = await generateBudgetOrchestrator(rawInput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle generator failure gracefully', async () => {
    mockGenerateBudget.mockRejectedValue(new Error('Generation failed'));

    const { generateBudgetOrchestrator } = await import('@/lib/ai/orchestrator');
    const rawInput = generateRawInput();

    const result = await generateBudgetOrchestrator(rawInput);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
